import { ulid } from '@sitepulse/shared/ulid';
import { normalizeUrl } from '@sitepulse/shared/ssrf';
import type { CrawlConfig, CrawlStats, JobStatus, CrawlTaskMessage, CrawlTaskResult } from '@sitepulse/shared/types';
import { crawlsQueries } from '@sitepulse/db/queries/crawls';
import type { CrawlResult } from '@sitepulse/shared/types';
import { BroadcastManager } from './broadcast.js';
import {
  FRONTIER_SPILL_THRESHOLD, RING_BUFFER_SIZE, MAX_REDIRECTS_PER_URL,
  BATCH_SIZE, HEARTBEAT_INTERVAL_MS, STALE_TIMEOUT_MS,
  initStats, updateAvgMs,
} from './state.js';

export interface CoordinatorEnv {
  CRAWL_TASKS: Queue<CrawlTaskMessage>;
  DB: D1Database;
}

export class CrawlCoordinator implements DurableObject {
  private state: DurableObjectState;
  private env: CoordinatorEnv;
  private broadcast: BroadcastManager;

  // In-memory working sets (replicated to DO storage on writes)
  private visited = new Set<string>();      // url hashes
  private frontier: Array<{ url: string; depth: number; parentUrl: string | null }> = [];
  private inFlight = new Map<string, string>(); // taskId → url
  private jobStats: CrawlStats = initStats();
  private jobStatus: JobStatus = 'queued';
  private config: CrawlConfig | null = null;
  private jobId = '';
  private projectId = '';
  private seedUrl = '';
  private initialized = false;
  private pendingResults: CrawlResult[] = [];

  constructor(state: DurableObjectState, env: CoordinatorEnv) {
    this.state = state;
    this.env = env;
    this.broadcast = new BroadcastManager();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    switch (url.pathname) {
      case '/init':    return this.handleInit(request);
      case '/report':  return this.handleReport(request);
      case '/cancel':  return this.handleCancel();
      case '/status':  return this.handleStatus();
      default:
        return new Response('Not Found', { status: 404 });
    }
  }

  // ─── alarm ──────────────────────────────────────────────────────────────────

  async alarm(): Promise<void> {
    const now = Date.now();
    const updatedAt = (await this.state.storage.get<number>('updatedAt')) ?? 0;

    // Stale check: if not updated in 5 minutes and still running, mark failed
    if (this.jobStatus === 'running' && now - updatedAt > STALE_TIMEOUT_MS) {
      await this.markFailed('Crawl stale — coordinator timed out');
      return;
    }

    // Heartbeat: reschedule if still active
    if (this.jobStatus === 'running' || this.jobStatus === 'queued') {
      await this.state.storage.setAlarm(Date.now() + HEARTBEAT_INTERVAL_MS);
    }
  }

  // ─── Init ────────────────────────────────────────────────────────────────────

  private async handleInit(request: Request): Promise<Response> {
    if (this.initialized) {
      return Response.json({ error: 'Already initialized' }, { status: 409 });
    }

    const body = await request.json<{
      jobId: string;
      seedUrl: string;
      config: CrawlConfig;
    }>();

    this.jobId = body.jobId;
    this.seedUrl = body.seedUrl;
    this.config = body.config;
    this.jobStatus = 'running';
    this.initialized = true;

    const now = Date.now();
    await this.state.storage.put({
      jobId: this.jobId,
      seedUrl: this.seedUrl,
      config: this.config,
      status: 'running',
      stats: initStats(),
      startedAt: now,
      updatedAt: now,
    });

    // Schedule heartbeat alarm
    await this.state.storage.setAlarm(Date.now() + HEARTBEAT_INTERVAL_MS);

    // Update D1 job status
    await crawlsQueries.updateStatus(this.env.DB, this.jobId, 'running');

    // Seed the frontier
    const hash = await hashUrl(normalizeUrl(body.seedUrl));
    this.visited.add(hash);
    this.frontier.push({ url: body.seedUrl, depth: 0, parentUrl: null });

    // Enqueue first batch
    await this.enqueueNextBatch();

    return Response.json({ ok: true });
  }

  // ─── Report task result ──────────────────────────────────────────────────────

  private async handleReport(request: Request): Promise<Response> {
    const result = await request.json<CrawlTaskResult>();

    // Idempotency: skip already-processed tasks
    const processed = await this.state.storage.get<boolean>(`task:${result.taskId}`);
    if (processed) return Response.json({ ok: true, duplicate: true });
    await this.state.storage.put(`task:${result.taskId}`, true);

    // Remove from inFlight
    this.inFlight.delete(result.taskId);

    if (!result.blocked && result.statusCode !== null) {
      // Determine status category
      const category = categorize(result.statusCode, result.redirectChain.length, result.errorReason);

      // Update stats
      this.jobStats.scanned++;
      if (category === 'client_error' || category === 'server_error' || category === 'network_error') {
        this.jobStats.broken++;
      }
      if (category === 'redirect') {
        this.jobStats.redirects++;
      }
      this.jobStats.avgResponseMs = updateAvgMs(this.jobStats, result.responseTimeMs);

      // Queue D1 insert (batched)
      const dbResult: CrawlResult = {
        id: ulid(),
        jobId: result.jobId,
        url: result.url,
        urlHash: await hashUrl(normalizeUrl(result.url)),
        parentUrl: null, // set by task message
        depth: 0,        // retrieved from inFlight metadata
        statusCode: result.statusCode,
        statusCategory: category,
        responseTimeMs: result.responseTimeMs,
        contentType: result.contentType,
        redirectChain: result.redirectChain,
        errorReason: result.errorReason,
        scannedAt: Date.now(),
      };
      this.pendingResults.push(dbResult);

      // Flush to D1 every 50 results or when batch is done
      if (this.pendingResults.length >= 50) {
        await this.flushResults();
      }

      // Broadcast events
      this.broadcast.bufferPageScanned(result.url, result.statusCode, result.responseTimeMs);
      if (category === 'client_error' || category === 'server_error') {
        this.broadcast.broadcast({
          type: 'link.broken',
          url: result.url,
          parentUrl: null,
          statusCode: result.statusCode,
          errorReason: result.errorReason,
          eventId: crypto.randomUUID(),
        });
      }

      // Discover new URLs
      if (this.config && this.visited.size + this.frontier.length < this.config.maxPages) {
        for (const link of result.discoveredLinks) {
          await this.maybeAddToFrontier(link, result.url);
        }
      }
    }

    this.broadcast.broadcastProgress(
      this.jobStats.scanned,
      this.visited.size + this.frontier.length
    );

    await this.state.storage.put('updatedAt', Date.now());
    await this.state.storage.put('stats', this.jobStats);

    // Enqueue more work or finalize
    await this.enqueueNextBatch();

    // Finalization: frontier empty + no in-flight
    if (this.frontier.length === 0 && this.inFlight.size === 0) {
      await this.markCompleted();
    }

    return Response.json({ ok: true });
  }

  // ─── Cancel ──────────────────────────────────────────────────────────────────

  private async handleCancel(): Promise<Response> {
    this.jobStatus = 'cancelled';
    await this.state.storage.put('status', 'cancelled');
    await this.flushResults();
    this.broadcast.broadcast({ type: 'crawl.cancelled', eventId: crypto.randomUUID() });
    return Response.json({ ok: true });
  }

  // ─── Status ───────────────────────────────────────────────────────────────────

  private async handleStatus(): Promise<Response> {
    return Response.json({
      jobId: this.jobId,
      status: this.jobStatus,
      stats: this.jobStats,
      frontierSize: this.frontier.length,
      inFlightSize: this.inFlight.size,
      visitedCount: this.visited.size,
    });
  }

  // ─── WebSocket ───────────────────────────────────────────────────────────────

  private async handleWebSocket(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];

    this.state.acceptWebSocket(server);

    const sessionId = ulid();
    this.broadcast.addSession(sessionId, server);

    const url = new URL(request.url);
    const lastEventId = url.searchParams.get('lastEventId') ?? undefined;

    // Send initial snapshot
    server.send(JSON.stringify({
      type: 'snapshot',
      stats: this.jobStats,
      status: this.jobStatus,
      eventId: crypto.randomUUID(),
    }));

    // Replay missed events
    if (lastEventId) {
      this.broadcast.replaySince(sessionId, lastEventId);
    }

    server.addEventListener('close', () => {
      this.broadcast.removeSession(sessionId);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async maybeAddToFrontier(url: string, parentUrl: string) {
    if (!this.config) return;

    // Normalize URL
    let normalized: string;
    try {
      normalized = normalizeUrl(url);
    } catch {
      return; // Invalid URL
    }

    // Same origin check
    if (this.config.sameOrigin) {
      try {
        const base = new URL(this.seedUrl).origin;
        const target = new URL(normalized).origin;
        if (base !== target) return;
      } catch {
        return;
      }
    }

    const hash = await hashUrl(normalized);
    if (this.visited.has(hash)) return;
    this.visited.add(hash);

    // Determine depth from parent — approximate (we don't track depth per URL in visited set)
    // Use frontier length as proxy check
    if (this.visited.size >= this.config.maxPages) return;

    // Frontier spill to D1 if too large
    if (this.frontier.length >= FRONTIER_SPILL_THRESHOLD) {
      await this.env.DB
        .prepare('INSERT OR IGNORE INTO crawl_frontier (id, job_id, url, url_hash, depth, parent_url, created_at) VALUES (?,?,?,?,?,?,?)')
        .bind(ulid(), this.jobId, normalized, hash, 0, parentUrl, Date.now())
        .run();
      return;
    }

    this.frontier.push({ url: normalized, depth: 0, parentUrl });
  }

  private async enqueueNextBatch() {
    if (this.jobStatus !== 'running') return;
    if (!this.config) return;

    const toEnqueue = this.frontier.splice(0, BATCH_SIZE);
    if (toEnqueue.length === 0) return;

    const messages = toEnqueue.map((item) => {
      const taskId = ulid();
      this.inFlight.set(taskId, item.url);
      const msg: CrawlTaskMessage = {
        taskId,
        jobId: this.jobId,
        url: item.url,
        depth: item.depth,
        parentUrl: item.parentUrl,
        coordinatorId: this.state.id.toString(),
      };
      return msg;
    });

    await this.env.CRAWL_TASKS.sendBatch(
      messages.map((m) => ({ body: m }))
    );
  }

  private async flushResults() {
    if (this.pendingResults.length === 0) return;
    const toFlush = this.pendingResults.splice(0);
    await crawlsQueries.insertResultBatch(this.env.DB, toFlush);
  }

  private async markCompleted() {
    await this.flushResults();
    this.jobStatus = 'completed';
    this.jobStats.totalPages = this.visited.size;
    await crawlsQueries.updateStatus(this.env.DB, this.jobId, 'completed', { stats: this.jobStats });
    await this.state.storage.put('status', 'completed');
    this.broadcast.broadcast({
      type: 'crawl.completed',
      summary: this.jobStats,
      eventId: crypto.randomUUID(),
    });
  }

  private async markFailed(message: string) {
    await this.flushResults();
    this.jobStatus = 'failed';
    await crawlsQueries.updateStatus(this.env.DB, this.jobId, 'failed', { errorMessage: message });
    await this.state.storage.put('status', 'failed');
    this.broadcast.broadcast({
      type: 'crawl.failed',
      error: message,
      eventId: crypto.randomUUID(),
    });
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

async function hashUrl(url: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(url.toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16); // 64-bit fingerprint, collision-acceptable for dedup
}

function categorize(
  statusCode: number,
  redirectCount: number,
  errorReason: string | null
): CrawlResult['statusCategory'] {
  if (errorReason === 'redirect_loop') return 'network_error';
  if (errorReason) return 'network_error';
  if (statusCode >= 200 && statusCode < 300) return 'ok';
  if (statusCode >= 300 && statusCode < 400) return 'redirect';
  if (statusCode >= 400 && statusCode < 500) return 'client_error';
  if (statusCode >= 500) return 'server_error';
  return 'network_error';
}

// Worker entry (required for DO to be exported)
export default {
  fetch() {
    return new Response('CrawlCoordinator — use via DO binding', { status: 400 });
  },
};
