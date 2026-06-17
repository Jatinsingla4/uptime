import type { D1Database } from '../client';
import type { Project, CrawlConfig } from '@sitepulse/shared/types';

interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  base_url: string;
  monitoring_enabled: number;
  check_interval_seconds: number;
  crawl_config_json: string;
  created_at: number;
  updated_at: number;
}

const DEFAULT_CRAWL_CONFIG: CrawlConfig = {
  maxDepth: 5,
  maxPages: 500,
  sameOrigin: true,
  respectRobots: true,
  rateLimitPerSecond: 5,
  userAgent: 'SitePulse/1.0 (+https://sitepulse.app)',
};

function rowToProject(row: ProjectRow): Project {
  let crawlConfig: CrawlConfig;
  try {
    crawlConfig = { ...DEFAULT_CRAWL_CONFIG, ...JSON.parse(row.crawl_config_json) };
  } catch {
    crawlConfig = DEFAULT_CRAWL_CONFIG;
  }
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    baseUrl: row.base_url,
    monitoringEnabled: row.monitoring_enabled === 1,
    checkIntervalSeconds: row.check_interval_seconds,
    crawlConfig,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const projectsQueries = {
  async listByUser(db: D1Database, userId: string): Promise<Project[]> {
    const { results } = await db
      .prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC')
      .bind(userId)
      .all<ProjectRow>();
    return results.map(rowToProject);
  },

  async getById(db: D1Database, id: string, userId: string): Promise<Project | null> {
    const row = await db
      .prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .first<ProjectRow>();
    return row ? rowToProject(row) : null;
  },

  async countByUser(db: D1Database, userId: string): Promise<number> {
    const row = await db
      .prepare('SELECT COUNT(*) as cnt FROM projects WHERE user_id = ?')
      .bind(userId)
      .first<{ cnt: number }>();
    return row?.cnt ?? 0;
  },

  async create(
    db: D1Database,
    data: {
      id: string;
      userId: string;
      name: string;
      baseUrl: string;
      monitoringEnabled: boolean;
      checkIntervalSeconds: number;
      crawlConfig: CrawlConfig;
    }
  ): Promise<Project> {
    const now = Date.now();
    await db
      .prepare(
        `INSERT INTO projects
          (id, user_id, name, base_url, monitoring_enabled, check_interval_seconds, crawl_config_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        data.id,
        data.userId,
        data.name,
        data.baseUrl,
        data.monitoringEnabled ? 1 : 0,
        data.checkIntervalSeconds,
        JSON.stringify(data.crawlConfig),
        now,
        now
      )
      .run();
    return { ...data, createdAt: now, updatedAt: now };
  },

  async update(
    db: D1Database,
    id: string,
    userId: string,
    data: Partial<{
      name: string;
      baseUrl: string;
      monitoringEnabled: boolean;
      checkIntervalSeconds: number;
      crawlConfig: Partial<CrawlConfig>;
    }>
  ): Promise<void> {
    const now = Date.now();
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.baseUrl !== undefined) { fields.push('base_url = ?'); values.push(data.baseUrl); }
    if (data.monitoringEnabled !== undefined) { fields.push('monitoring_enabled = ?'); values.push(data.monitoringEnabled ? 1 : 0); }
    if (data.checkIntervalSeconds !== undefined) { fields.push('check_interval_seconds = ?'); values.push(data.checkIntervalSeconds); }
    if (data.crawlConfig !== undefined) {
      // Merge with existing config
      const existing = await db
        .prepare('SELECT crawl_config_json FROM projects WHERE id = ?')
        .bind(id)
        .first<{ crawl_config_json: string }>();
      let current: Partial<CrawlConfig> = {};
      try { current = JSON.parse(existing?.crawl_config_json ?? '{}'); } catch {}
      fields.push('crawl_config_json = ?');
      values.push(JSON.stringify({ ...DEFAULT_CRAWL_CONFIG, ...current, ...data.crawlConfig }));
    }
    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    values.push(now, id, userId);

    await db
      .prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`)
      .bind(...values)
      .run();
  },

  async delete(db: D1Database, id: string, userId: string): Promise<void> {
    await db
      .prepare('DELETE FROM projects WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .run();
  },
};
