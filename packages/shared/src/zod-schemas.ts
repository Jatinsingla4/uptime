import { z } from 'zod';

// ─── URL validation ───────────────────────────────────────────────────────────

export const urlSchema = z
  .string()
  .max(2048, 'URL too long')
  .refine((val) => {
    try {
      const url = new URL(val);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Must be a valid HTTP/HTTPS URL')
  .refine((val) => {
    try {
      const url = new URL(val);
      // No credentials
      return !url.username && !url.password;
    } catch {
      return false;
    }
  }, 'URL must not contain credentials');

// ─── Crawl Config ─────────────────────────────────────────────────────────────

export const crawlConfigSchema = z.object({
  maxDepth: z.number().int().min(1).max(20).default(5),
  maxPages: z.number().int().min(1).max(100_000).default(500),
  sameOrigin: z.boolean().default(true),
  respectRobots: z.boolean().default(true),
  rateLimitPerSecond: z.number().min(0.1).max(50).default(5),
  userAgent: z.string().max(200).default('SitePulse/1.0 (+https://sitepulse.app)'),
});

// ─── Project ──────────────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  baseUrl: urlSchema,
  monitoringEnabled: z.boolean().default(true),
  checkIntervalSeconds: z.number().int().min(10).max(86400).default(300),
  crawlConfig: crawlConfigSchema.optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// ─── Crawl ────────────────────────────────────────────────────────────────────

export const startCrawlSchema = z.object({
  projectId: z.string().min(1),
  config: crawlConfigSchema.partial().optional(),
});

export const crawlResultsQuerySchema = z.object({
  jobId: z.string().min(1),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  statusCategory: z
    .enum(['ok', 'redirect', 'client_error', 'server_error', 'network_error', 'blocked'])
    .optional(),
});

// ─── Uptime ───────────────────────────────────────────────────────────────────

export const uptimeStatsSchema = z.object({
  projectId: z.string().min(1),
  range: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
});

// ─── API Keys ─────────────────────────────────────────────────────────────────

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
});

// ─── Notifications ────────────────────────────────────────────────────────────

export const createNotificationChannelSchema = z.object({
  type: z.enum(['email', 'slack', 'webhook']),
  target: z.string().min(1).max(500),
  enabled: z.boolean().default(true),
});

// ─── Reports ─────────────────────────────────────────────────────────────────

export const generateReportSchema = z.object({
  jobId: z.string().min(1),
  format: z.enum(['csv', 'json']).default('csv'),
});

// ─── Pagination ──────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});
