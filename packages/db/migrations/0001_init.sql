-- SitePulse Database Schema v1
-- Cloudflare D1 (SQLite)

-- ─── USERS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  name            TEXT,
  plan            TEXT NOT NULL DEFAULT 'free'
                  CHECK(plan IN ('free', 'pro', 'enterprise')),
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─── PROJECTS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
  id                      TEXT PRIMARY KEY,
  user_id                 TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  base_url                TEXT NOT NULL,
  monitoring_enabled      INTEGER NOT NULL DEFAULT 1
                          CHECK(monitoring_enabled IN (0, 1)),
  check_interval_seconds  INTEGER NOT NULL DEFAULT 300,
  crawl_config_json       TEXT NOT NULL DEFAULT '{}',
  created_at              INTEGER NOT NULL,
  updated_at              INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);

-- ─── CRAWL JOBS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crawl_jobs (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'queued'
                  CHECK(status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  trigger         TEXT NOT NULL DEFAULT 'manual'
                  CHECK(trigger IN ('manual', 'scheduled', 'api')),
  stats_json      TEXT,
  started_at      INTEGER,
  finished_at     INTEGER,
  error_message   TEXT,
  created_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_project_created ON crawl_jobs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_status ON crawl_jobs(status);

-- ─── CRAWL RESULTS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crawl_results (
  id                  TEXT PRIMARY KEY,
  job_id              TEXT NOT NULL REFERENCES crawl_jobs(id) ON DELETE CASCADE,
  url                 TEXT NOT NULL,
  url_hash            TEXT NOT NULL,
  parent_url          TEXT,
  depth               INTEGER NOT NULL DEFAULT 0,
  status_code         INTEGER,
  status_category     TEXT NOT NULL DEFAULT 'ok'
                      CHECK(status_category IN ('ok','redirect','client_error','server_error','network_error','blocked')),
  response_time_ms    INTEGER,
  content_type        TEXT,
  redirect_chain_json TEXT NOT NULL DEFAULT '[]',
  error_reason        TEXT,
  scanned_at          INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_results_job ON crawl_results(job_id);
CREATE INDEX IF NOT EXISTS idx_results_job_category ON crawl_results(job_id, status_category);
CREATE INDEX IF NOT EXISTS idx_results_url_hash ON crawl_results(url_hash);

-- ─── CRAWL FRONTIER (overflow for large crawls) ───────────────────────────────

CREATE TABLE IF NOT EXISTS crawl_frontier (
  id         TEXT PRIMARY KEY,
  job_id     TEXT NOT NULL REFERENCES crawl_jobs(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  url_hash   TEXT NOT NULL,
  depth      INTEGER NOT NULL DEFAULT 0,
  parent_url TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_frontier_job ON crawl_frontier(job_id, created_at ASC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_frontier_job_url ON crawl_frontier(job_id, url_hash);

-- ─── UPTIME LOGS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS uptime_logs (
  id                  TEXT PRIMARY KEY,
  project_id          TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  checked_at          INTEGER NOT NULL,
  status_code         INTEGER,
  response_time_ms    INTEGER,
  is_up               INTEGER NOT NULL DEFAULT 1
                      CHECK(is_up IN (0, 1)),
  region              TEXT,
  error_message       TEXT
);
CREATE INDEX IF NOT EXISTS idx_uptime_project_time ON uptime_logs(project_id, checked_at DESC);

-- ─── UPTIME INCIDENTS ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS uptime_incidents (
  id               TEXT PRIMARY KEY,
  project_id       TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  started_at       INTEGER NOT NULL,
  resolved_at      INTEGER,
  duration_seconds INTEGER,
  error_summary    TEXT
);
CREATE INDEX IF NOT EXISTS idx_incidents_project ON uptime_incidents(project_id, started_at DESC);

-- ─── UPTIME DAILY STATS (aggregated rollup) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS uptime_daily_stats (
  id                  TEXT PRIMARY KEY,
  project_id          TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date_utc            TEXT NOT NULL,  -- YYYY-MM-DD
  total_checks        INTEGER NOT NULL DEFAULT 0,
  up_checks           INTEGER NOT NULL DEFAULT 0,
  avg_response_ms     INTEGER,
  min_response_ms     INTEGER,
  max_response_ms     INTEGER,
  incident_count      INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_project_date ON uptime_daily_stats(project_id, date_utc);

-- ─── API KEYS ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_keys (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash     TEXT NOT NULL UNIQUE,
  key_preview  TEXT NOT NULL,
  name         TEXT,
  last_used_at INTEGER,
  created_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

-- ─── NOTIFICATION CHANNELS ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_channels (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK(type IN ('email', 'slack', 'webhook')),
  target     TEXT NOT NULL,
  enabled    INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0, 1)),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notification_channels(user_id);

-- ─── IDEMPOTENCY KEYS (24h TTL, manual cleanup via scheduler) ─────────────────

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key         TEXT PRIMARY KEY,
  response    TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);
