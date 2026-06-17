import { ulid } from '@sitepulse/shared/ulid';
import { isSafeUrl } from '@sitepulse/shared/ssrf';
import { uptimeQueries } from '@sitepulse/db/queries/uptime';
import type { UptimeLog, UptimeIncident } from '@sitepulse/shared/types';

const PING_TIMEOUT_MS = 10_000;
const CONSECUTIVE_FAILURES_FOR_INCIDENT = 2;
const CONSECUTIVE_SUCCESSES_TO_RESOLVE = 2;
const LOG_BATCH_SIZE = 10;

interface UptimeMonitorEnv {
  DB: D1Database;
}

interface MonitorConfig {
  projectId: string;
  url: string;
  checkIntervalSeconds: number;
  enabled: boolean;
}

export class UptimeMonitor implements DurableObject {
  private state: DurableObjectState;
  private env: UptimeMonitorEnv;
  private config: MonitorConfig | null = null;

  // In-memory state
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  private activeIncidentId: string | null = null;
  private pendingLogs: UptimeLog[] = [];

  constructor(state: DurableObjectState, env: UptimeMonitorEnv) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case '/configure': return this.handleConfigure(request);
      case '/pause':     return this.handlePause();
      case '/resume':    return this.handleResume();
      case '/status':    return this.handleStatus();
      default:
        return new Response('Not Found', { status: 404 });
    }
  }

  // ─── Alarm ────────────────────────────────────────────────────────────────

  async alarm(): Promise<void> {
    // Reload config from storage (DO can be evicted between alarms)
    if (!this.config) {
      this.config = await this.state.storage.get<MonitorConfig>('config') ?? null;
      this.consecutiveFailures = await this.state.storage.get<number>('consecutiveFailures') ?? 0;
      this.consecutiveSuccesses = await this.state.storage.get<number>('consecutiveSuccesses') ?? 0;
      this.activeIncidentId = await this.state.storage.get<string | null>('activeIncidentId') ?? null;
    }

    if (!this.config?.enabled) return;

    // Run the ping
    await this.ping();

    // Flush pending logs
    if (this.pendingLogs.length >= LOG_BATCH_SIZE || this.pendingLogs.length > 0) {
      await this.flushLogs();
    }

    // Schedule next alarm — always relative to NOW to prevent drift
    await this.state.storage.setAlarm(
      Date.now() + (this.config.checkIntervalSeconds * 1000)
    );
  }

  // ─── Ping ─────────────────────────────────────────────────────────────────

  private async ping(): Promise<void> {
    if (!this.config) return;

    // SSRF check
    const safety = isSafeUrl(this.config.url);
    if (!safety.safe) {
      console.error(`[uptime] SSRF blocked: ${this.config.url} — ${safety.reason}`);
      return;
    }

    const startMs = Date.now();
    let statusCode: number | null = null;
    let isUp = false;
    let errorMessage: string | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

      try {
        // Try HEAD first (lightweight), fall back to GET if 405
        let response = await fetch(this.config.url, {
          method: 'HEAD',
          headers: { 'User-Agent': 'SitePulse-Uptime/1.0' },
          signal: controller.signal,
          redirect: 'follow',
        });

        if (response.status === 405) {
          response = await fetch(this.config.url, {
            method: 'GET',
            headers: { 'User-Agent': 'SitePulse-Uptime/1.0' },
            signal: controller.signal,
            redirect: 'follow',
          });
        }

        statusCode = response.status;
        isUp = statusCode >= 200 && statusCode < 400;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errorMessage = msg.includes('aborted') ? 'timeout' : msg.slice(0, 200);
      isUp = false;
    }

    const responseTimeMs = Date.now() - startMs;

    const log: UptimeLog = {
      id: ulid(),
      projectId: this.config.projectId,
      checkedAt: Date.now(),
      statusCode,
      responseTimeMs,
      isUp,
      region: null, // CF colo detection would go here
      errorMessage,
    };

    this.pendingLogs.push(log);

    // Incident detection
    await this.processIncidentLogic(isUp, errorMessage);

    await this.state.storage.put('consecutiveFailures', this.consecutiveFailures);
    await this.state.storage.put('consecutiveSuccesses', this.consecutiveSuccesses);
    await this.state.storage.put('activeIncidentId', this.activeIncidentId);
  }

  private async processIncidentLogic(isUp: boolean, errorMessage: string | null): Promise<void> {
    if (!this.config) return;

    if (!isUp) {
      this.consecutiveFailures++;
      this.consecutiveSuccesses = 0;

      if (
        this.consecutiveFailures >= CONSECUTIVE_FAILURES_FOR_INCIDENT &&
        !this.activeIncidentId
      ) {
        // Open a new incident
        const incident: UptimeIncident = {
          id: ulid(),
          projectId: this.config.projectId,
          startedAt: Date.now(),
          resolvedAt: null,
          durationSeconds: null,
          errorSummary: errorMessage ?? 'Site unreachable',
        };
        this.activeIncidentId = incident.id;
        await uptimeQueries.openIncident(this.env.DB, incident);
        // TODO: trigger notification worker
      }
    } else {
      this.consecutiveSuccesses++;
      this.consecutiveFailures = 0;

      if (
        this.consecutiveSuccesses >= CONSECUTIVE_SUCCESSES_TO_RESOLVE &&
        this.activeIncidentId
      ) {
        await uptimeQueries.resolveIncident(this.env.DB, this.activeIncidentId, Date.now());
        this.activeIncidentId = null;
        // TODO: trigger recovery notification
      }
    }
  }

  // ─── Handlers ────────────────────────────────────────────────────────────

  private async handleConfigure(request: Request): Promise<Response> {
    const body = await request.json<MonitorConfig>();
    this.config = body;
    await this.state.storage.put('config', body);

    if (body.enabled) {
      // Schedule first check immediately
      await this.state.storage.setAlarm(Date.now() + 1000);
    }

    return Response.json({ ok: true });
  }

  private async handlePause(): Promise<Response> {
    if (this.config) {
      this.config.enabled = false;
      await this.state.storage.put('config', this.config);
    }
    return Response.json({ ok: true });
  }

  private async handleResume(): Promise<Response> {
    if (this.config) {
      this.config.enabled = true;
      await this.state.storage.put('config', this.config);
      await this.state.storage.setAlarm(Date.now() + 1000);
    }
    return Response.json({ ok: true });
  }

  private handleStatus(): Response {
    return Response.json({
      config: this.config,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      activeIncidentId: this.activeIncidentId,
      pendingLogCount: this.pendingLogs.length,
    });
  }

  private async flushLogs(): Promise<void> {
    if (this.pendingLogs.length === 0) return;
    const toFlush = this.pendingLogs.splice(0);
    await uptimeQueries.insertLogBatch(this.env.DB, toFlush);
  }
}

export default {
  fetch() {
    return new Response('UptimeMonitor — use via DO binding', { status: 400 });
  },
};
