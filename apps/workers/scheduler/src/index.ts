import { ulid } from '@sitepulse/shared/ulid';
import { projectsQueries } from '@sitepulse/db/queries/projects';
import { crawlsQueries } from '@sitepulse/db/queries/crawls';

interface SchedulerEnv {
  DB: D1Database;
  CRAWL_COORDINATOR: DurableObjectNamespace;
  CRAWL_TASKS: Queue;
}

export default {
  async scheduled(event: ScheduledEvent, env: SchedulerEnv): Promise<void> {
    const cron = event.cron;

    if (cron === '0 * * * *') {
      // Hourly: cleanup stale idempotency keys + rollup uptime
      await cleanupIdempotencyKeys(env);
    }

    if (cron === '0 2 * * *') {
      // Daily at 2am: rollup uptime_logs into uptime_daily_stats
      await rollupUptimeStats(env);
      // Purge crawl_results older than 90 days
      await purgeOldCrawlResults(env);
    }
  },

  async fetch(): Promise<Response> {
    return new Response('Scheduler worker — runs on cron triggers only', { status: 400 });
  },
} satisfies ExportedHandler<SchedulerEnv>;

async function cleanupIdempotencyKeys(env: SchedulerEnv): Promise<void> {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  await env.DB
    .prepare('DELETE FROM idempotency_keys WHERE created_at < ?')
    .bind(cutoff)
    .run();
}

async function rollupUptimeStats(env: SchedulerEnv): Promise<void> {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const dateStr = yesterday.toISOString().slice(0, 10);
  const dayStart = yesterday.setUTCHours(0, 0, 0, 0);
  const dayEnd = dayStart + 86_400_000;

  await env.DB
    .prepare(
      `INSERT OR REPLACE INTO uptime_daily_stats
        (id, project_id, date_utc, total_checks, up_checks, avg_response_ms, min_response_ms, max_response_ms, incident_count)
       SELECT
         (project_id || '-' || ?) as id,
         project_id,
         ? as date_utc,
         COUNT(*) as total_checks,
         SUM(is_up) as up_checks,
         CAST(AVG(response_time_ms) AS INTEGER) as avg_response_ms,
         MIN(response_time_ms) as min_response_ms,
         MAX(response_time_ms) as max_response_ms,
         0 as incident_count
       FROM uptime_logs
       WHERE checked_at >= ? AND checked_at < ?
       GROUP BY project_id`
    )
    .bind(dateStr, dateStr, dayStart, dayEnd)
    .run();
}

async function purgeOldCrawlResults(env: SchedulerEnv): Promise<void> {
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  // Purge in batches to avoid timeout
  await env.DB
    .prepare(
      `DELETE FROM crawl_results WHERE scanned_at < ? AND rowid IN (
         SELECT rowid FROM crawl_results WHERE scanned_at < ? LIMIT 10000
       )`
    )
    .bind(cutoff, cutoff)
    .run();

  // Also purge old uptime_logs (>30d raw, replaced by daily aggregates)
  const uptimeCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  await env.DB
    .prepare(
      `DELETE FROM uptime_logs WHERE checked_at < ? AND rowid IN (
         SELECT rowid FROM uptime_logs WHERE checked_at < ? LIMIT 50000
       )`
    )
    .bind(uptimeCutoff, uptimeCutoff)
    .run();
}
