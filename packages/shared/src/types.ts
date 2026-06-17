// ─── Core Entity Types ────────────────────────────────────────────────────────

export type UserPlan = 'free' | 'pro' | 'enterprise';

export interface User {
  id: string;
  email: string;
  name: string | null;
  plan: UserPlan;
  createdAt: number;
  updatedAt: number;
}

export interface CrawlConfig {
  maxDepth: number;
  maxPages: number;
  sameOrigin: boolean;
  respectRobots: boolean;
  rateLimitPerSecond: number;
  userAgent: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  baseUrl: string;
  monitoringEnabled: boolean;
  checkIntervalSeconds: number;
  crawlConfig: CrawlConfig;
  createdAt: number;
  updatedAt: number;
}

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type JobTrigger = 'manual' | 'scheduled' | 'api';

export interface CrawlStats {
  scanned: number;
  broken: number;
  redirects: number;
  avgResponseMs: number;
  totalPages: number;
}

export interface CrawlJob {
  id: string;
  projectId: string;
  status: JobStatus;
  trigger: JobTrigger;
  stats: CrawlStats | null;
  startedAt: number | null;
  finishedAt: number | null;
  errorMessage: string | null;
  createdAt: number;
}

export type StatusCategory =
  | 'ok'
  | 'redirect'
  | 'client_error'
  | 'server_error'
  | 'network_error'
  | 'blocked';

export interface CrawlResult {
  id: string;
  jobId: string;
  url: string;
  urlHash: string;
  parentUrl: string | null;
  depth: number;
  statusCode: number | null;
  statusCategory: StatusCategory;
  responseTimeMs: number | null;
  contentType: string | null;
  redirectChain: string[];
  errorReason: string | null;
  scannedAt: number;
}

export interface UptimeLog {
  id: string;
  projectId: string;
  checkedAt: number;
  statusCode: number | null;
  responseTimeMs: number | null;
  isUp: boolean;
  region: string | null;
  errorMessage: string | null;
}

export interface UptimeIncident {
  id: string;
  projectId: string;
  startedAt: number;
  resolvedAt: number | null;
  durationSeconds: number | null;
  errorSummary: string | null;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string | null;
  keyHash: string;
  lastUsedAt: number | null;
  createdAt: number;
  /** Last 4 chars for display */
  keyPreview?: string;
}

export interface NotificationChannel {
  id: string;
  userId: string;
  type: 'email' | 'slack' | 'webhook';
  target: string;
  enabled: boolean;
}

// ─── Queue Message Types ──────────────────────────────────────────────────────

export interface CrawlTaskMessage {
  taskId: string;
  jobId: string;
  url: string;
  depth: number;
  parentUrl: string | null;
  coordinatorId: string;
}

export interface CrawlTaskResult {
  taskId: string;
  jobId: string;
  url: string;
  statusCode: number | null;
  responseTimeMs: number;
  contentType: string | null;
  redirectChain: string[];
  discoveredLinks: string[];
  errorReason: string | null;
  blocked: boolean;
}

// ─── Uptime Types ─────────────────────────────────────────────────────────────

export interface UptimeStatsSeries {
  t: number;
  ms: number | null;
  up: boolean;
}

export interface UptimeStats {
  uptimePercent: number;
  avgResponseMs: number;
  totalChecks: number;
  incidents: UptimeIncident[];
  series: UptimeStatsSeries[];
}

// ─── Plan Limits ─────────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<UserPlan, {
  maxProjects: number;
  maxCrawlsPerHour: number;
  maxConcurrentCrawls: number;
  minCheckIntervalSeconds: number;
  maxPages: number;
}> = {
  free:       { maxProjects: 3,   maxCrawlsPerHour: 5,   maxConcurrentCrawls: 1,  minCheckIntervalSeconds: 300, maxPages: 100 },
  pro:        { maxProjects: 20,  maxCrawlsPerHour: 20,  maxConcurrentCrawls: 5,  minCheckIntervalSeconds: 60,  maxPages: 5000 },
  enterprise: { maxProjects: 500, maxCrawlsPerHour: 200, maxConcurrentCrawls: 50, minCheckIntervalSeconds: 10,  maxPages: 100000 },
};
