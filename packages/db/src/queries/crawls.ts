import type { D1Database } from '../client';
import type { CrawlJob, CrawlResult, JobStatus, CrawlStats, StatusCategory } from '@sitepulse/shared/types';

interface CrawlJobRow {
  id: string;
  project_id: string;
  status: JobStatus;
  trigger: string;
  stats_json: string | null;
  started_at: number | null;
  finished_at: number | null;
  error_message: string | null;
  created_at: number;
}

interface CrawlResultRow {
  id: string;
  job_id: string;
  url: string;
  url_hash: string;
  parent_url: string | null;
  depth: number;
  status_code: number | null;
  status_category: StatusCategory;
  response_time_ms: number | null;
  content_type: string | null;
  redirect_chain_json: string;
  error_reason: string | null;
  scanned_at: number;
}

function rowToJob(row: CrawlJobRow): CrawlJob {
  let stats: CrawlStats | null = null;
  if (row.stats_json) {
    try { stats = JSON.parse(row.stats_json); } catch {}
  }
  return {
    id: row.id,
    projectId: row.project_id,
    status: row.status,
    trigger: row.trigger as CrawlJob['trigger'],
    stats,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

function rowToResult(row: CrawlResultRow): CrawlResult {
  let redirectChain: string[] = [];
  try { redirectChain = JSON.parse(row.redirect_chain_json); } catch {}
  return {
    id: row.id,
    jobId: row.job_id,
    url: row.url,
    urlHash: row.url_hash,
    parentUrl: row.parent_url,
    depth: row.depth,
    statusCode: row.status_code,
    statusCategory: row.status_category,
    responseTimeMs: row.response_time_ms,
    contentType: row.content_type,
    redirectChain,
    errorReason: row.error_reason,
    scannedAt: row.scanned_at,
  };
}

export const crawlsQueries = {
  async listByProject(
    db: D1Database,
    projectId: string,
    limit = 20,
    cursor?: string
  ): Promise<{ items: CrawlJob[]; nextCursor?: string }> {
    let query = 'SELECT * FROM crawl_jobs WHERE project_id = ?';
    const bindings: unknown[] = [projectId];
    if (cursor) {
      query += ' AND created_at < ?';
      bindings.push(parseInt(cursor, 10));
    }
    query += ' ORDER BY created_at DESC LIMIT ?';
    bindings.push(limit + 1);

    const { results } = await db.prepare(query).bind(...bindings).all<CrawlJobRow>();
    const hasMore = results.length > limit;
    const items = results.slice(0, limit).map(rowToJob);
    const result: { items: CrawlJob[]; nextCursor?: string } = { items };
    if (hasMore) result.nextCursor = String(items[items.length - 1]!.createdAt);
    return result;
  },

  async getById(db: D1Database, id: string): Promise<CrawlJob | null> {
    const row = await db
      .prepare('SELECT * FROM crawl_jobs WHERE id = ?')
      .bind(id)
      .first<CrawlJobRow>();
    return row ? rowToJob(row) : null;
  },

  async countRunning(db: D1Database, projectId: string): Promise<number> {
    const row = await db
      .prepare("SELECT COUNT(*) as cnt FROM crawl_jobs WHERE project_id = ? AND status IN ('queued', 'running')")
      .bind(projectId)
      .first<{ cnt: number }>();
    return row?.cnt ?? 0;
  },

  async create(
    db: D1Database,
    data: { id: string; projectId: string; trigger: CrawlJob['trigger'] }
  ): Promise<CrawlJob> {
    const now = Date.now();
    await db
      .prepare(
        'INSERT INTO crawl_jobs (id, project_id, status, trigger, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(data.id, data.projectId, 'queued', data.trigger, now)
      .run();
    return {
      id: data.id,
      projectId: data.projectId,
      status: 'queued',
      trigger: data.trigger,
      stats: null,
      startedAt: null,
      finishedAt: null,
      errorMessage: null,
      createdAt: now,
    };
  },

  async updateStatus(
    db: D1Database,
    id: string,
    status: JobStatus,
    extra?: { stats?: CrawlStats; errorMessage?: string }
  ): Promise<void> {
    const now = Date.now();
    const isTerminal = status === 'completed' || status === 'failed' || status === 'cancelled';
    await db
      .prepare(
        `UPDATE crawl_jobs SET
           status = ?,
           stats_json = COALESCE(?, stats_json),
           error_message = COALESCE(?, error_message),
           started_at = CASE WHEN status = 'queued' AND ? = 'running' THEN ? ELSE started_at END,
           finished_at = CASE WHEN ? THEN ? ELSE finished_at END
         WHERE id = ?`
      )
      .bind(
        status,
        extra?.stats ? JSON.stringify(extra.stats) : null,
        extra?.errorMessage ?? null,
        status, now,
        isTerminal ? 1 : 0, now,
        id
      )
      .run();
  },

  // ─── Results ─────────────────────────────────────────────────────────────

  async insertResultBatch(db: D1Database, results: CrawlResult[]): Promise<void> {
    if (results.length === 0) return;
    const statements = results.map((r) =>
      db
        .prepare(
          `INSERT OR IGNORE INTO crawl_results
            (id, job_id, url, url_hash, parent_url, depth, status_code,
             status_category, response_time_ms, content_type,
             redirect_chain_json, error_reason, scanned_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          r.id, r.jobId, r.url, r.urlHash, r.parentUrl ?? null, r.depth,
          r.statusCode ?? null, r.statusCategory, r.responseTimeMs ?? null,
          r.contentType ?? null, JSON.stringify(r.redirectChain),
          r.errorReason ?? null, r.scannedAt
        )
    );
    await db.batch(statements);
  },

  async listResults(
    db: D1Database,
    jobId: string,
    opts: { cursor?: string; limit?: number; statusCategory?: StatusCategory }
  ): Promise<{ items: CrawlResult[]; nextCursor?: string }> {
    const limit = opts.limit ?? 50;
    let query = 'SELECT * FROM crawl_results WHERE job_id = ?';
    const bindings: unknown[] = [jobId];

    if (opts.statusCategory) {
      query += ' AND status_category = ?';
      bindings.push(opts.statusCategory);
    }
    if (opts.cursor) {
      query += ' AND scanned_at > ?';
      bindings.push(parseInt(opts.cursor, 10));
    }
    query += ' ORDER BY scanned_at ASC LIMIT ?';
    bindings.push(limit + 1);

    const { results } = await db.prepare(query).bind(...bindings).all<CrawlResultRow>();
    const hasMore = results.length > limit;
    const items = results.slice(0, limit).map(rowToResult);
    const resultObj: { items: CrawlResult[]; nextCursor?: string } = { items };
    if (hasMore) resultObj.nextCursor = String(items[items.length - 1]!.scannedAt);
    return resultObj;
  },

  async getBrokenLinks(db: D1Database, jobId: string): Promise<CrawlResult[]> {
    const { results } = await db
      .prepare(
        "SELECT * FROM crawl_results WHERE job_id = ? AND status_category IN ('client_error','server_error','network_error') ORDER BY scanned_at ASC LIMIT 1000"
      )
      .bind(jobId)
      .all<CrawlResultRow>();
    return results.map(rowToResult);
  },
};
