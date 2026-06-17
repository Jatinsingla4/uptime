import type { D1Database } from '../client';
import type { UptimeLog, UptimeIncident, UptimeStats } from '@sitepulse/shared/types';

interface UptimeLogRow {
  id: string;
  project_id: string;
  checked_at: number;
  status_code: number | null;
  response_time_ms: number | null;
  is_up: number;
  region: string | null;
  error_message: string | null;
}

interface UptimeIncidentRow {
  id: string;
  project_id: string;
  started_at: number;
  resolved_at: number | null;
  duration_seconds: number | null;
  error_summary: string | null;
}

function rowToLog(row: UptimeLogRow): UptimeLog {
  return {
    id: row.id,
    projectId: row.project_id,
    checkedAt: row.checked_at,
    statusCode: row.status_code,
    responseTimeMs: row.response_time_ms,
    isUp: row.is_up === 1,
    region: row.region,
    errorMessage: row.error_message,
  };
}

function rowToIncident(row: UptimeIncidentRow): UptimeIncident {
  return {
    id: row.id,
    projectId: row.project_id,
    startedAt: row.started_at,
    resolvedAt: row.resolved_at,
    durationSeconds: row.duration_seconds,
    errorSummary: row.error_summary,
  };
}

const RANGE_MS: Record<string, number> = {
  '1h':  1 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d':  7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

export const uptimeQueries = {
  async insertLog(db: D1Database, log: UptimeLog): Promise<void> {
    await db
      .prepare(
        `INSERT INTO uptime_logs
          (id, project_id, checked_at, status_code, response_time_ms, is_up, region, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        log.id, log.projectId, log.checkedAt, log.statusCode ?? null,
        log.responseTimeMs ?? null, log.isUp ? 1 : 0, log.region ?? null,
        log.errorMessage ?? null
      )
      .run();
  },

  async insertLogBatch(db: D1Database, logs: UptimeLog[]): Promise<void> {
    if (logs.length === 0) return;
    const statements = logs.map((l) =>
      db
        .prepare(
          `INSERT OR IGNORE INTO uptime_logs
            (id, project_id, checked_at, status_code, response_time_ms, is_up, region, error_message)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(l.id, l.projectId, l.checkedAt, l.statusCode ?? null, l.responseTimeMs ?? null, l.isUp ? 1 : 0, l.region ?? null, l.errorMessage ?? null)
    );
    await db.batch(statements);
  },

  async getStats(db: D1Database, projectId: string, range: string): Promise<UptimeStats> {
    const rangeMs = RANGE_MS[range] ?? RANGE_MS['24h']!;
    const since = Date.now() - rangeMs;

    const [statsRow, seriesRows, incidents] = await Promise.all([
      db
        .prepare(
          `SELECT
             COUNT(*) as total_checks,
             SUM(is_up) as up_checks,
             AVG(response_time_ms) as avg_ms
           FROM uptime_logs
           WHERE project_id = ? AND checked_at >= ?`
        )
        .bind(projectId, since)
        .first<{ total_checks: number; up_checks: number; avg_ms: number | null }>(),

      db
        .prepare(
          `SELECT checked_at, response_time_ms, is_up
           FROM uptime_logs
           WHERE project_id = ? AND checked_at >= ?
           ORDER BY checked_at ASC
           LIMIT 500`
        )
        .bind(projectId, since)
        .all<{ checked_at: number; response_time_ms: number | null; is_up: number }>(),

      uptimeQueries.listIncidents(db, projectId, { since }),
    ]);

    const totalChecks = statsRow?.total_checks ?? 0;
    const upChecks = statsRow?.up_checks ?? 0;

    return {
      uptimePercent: totalChecks > 0 ? Math.round((upChecks / totalChecks) * 10000) / 100 : 100,
      avgResponseMs: Math.round(statsRow?.avg_ms ?? 0),
      totalChecks,
      incidents,
      series: seriesRows.results.map((r) => ({
        t: r.checked_at,
        ms: r.response_time_ms,
        up: r.is_up === 1,
      })),
    };
  },

  async listIncidents(
    db: D1Database,
    projectId: string,
    opts?: { since?: number; limit?: number }
  ): Promise<UptimeIncident[]> {
    let query = 'SELECT * FROM uptime_incidents WHERE project_id = ?';
    const bindings: unknown[] = [projectId];
    if (opts?.since) { query += ' AND started_at >= ?'; bindings.push(opts.since); }
    query += ' ORDER BY started_at DESC LIMIT ?';
    bindings.push(opts?.limit ?? 50);

    const { results } = await db.prepare(query).bind(...bindings).all<UptimeIncidentRow>();
    return results.map(rowToIncident);
  },

  async openIncident(db: D1Database, incident: UptimeIncident): Promise<void> {
    await db
      .prepare(
        'INSERT OR IGNORE INTO uptime_incidents (id, project_id, started_at, error_summary) VALUES (?, ?, ?, ?)'
      )
      .bind(incident.id, incident.projectId, incident.startedAt, incident.errorSummary ?? null)
      .run();
  },

  async resolveIncident(db: D1Database, id: string, resolvedAt: number): Promise<void> {
    await db
      .prepare(
        `UPDATE uptime_incidents
         SET resolved_at = ?,
             duration_seconds = CAST((? - started_at) / 1000 AS INTEGER)
         WHERE id = ? AND resolved_at IS NULL`
      )
      .bind(resolvedAt, resolvedAt, id)
      .run();
  },

  async getActiveIncident(db: D1Database, projectId: string): Promise<UptimeIncident | null> {
    const row = await db
      .prepare(
        'SELECT * FROM uptime_incidents WHERE project_id = ? AND resolved_at IS NULL ORDER BY started_at DESC LIMIT 1'
      )
      .bind(projectId)
      .first<UptimeIncidentRow>();
    return row ? rowToIncident(row) : null;
  },
};
