import type { CrawlConfig, CrawlStats, JobStatus } from '@sitepulse/shared/types';

export const FRONTIER_SPILL_THRESHOLD = 50_000;
export const RING_BUFFER_SIZE = 500;
export const MAX_REDIRECTS_PER_URL = 5;
export const BATCH_SIZE = 10;
export const HEARTBEAT_INTERVAL_MS = 30_000;
export const STALE_TIMEOUT_MS = 5 * 60 * 1000;

export interface CoordinatorState {
  jobId: string;
  projectId: string;
  seedUrl: string;
  config: CrawlConfig;
  status: JobStatus;
  stats: CrawlStats;
  startedAt: number;
  updatedAt: number;
  // Serializable sets (stored as arrays in DO storage)
  visitedCount: number;
  inFlightCount: number;
}

export function initStats(): CrawlStats {
  return { scanned: 0, broken: 0, redirects: 0, avgResponseMs: 0, totalPages: 0 };
}

export function updateAvgMs(current: CrawlStats, newMs: number): number {
  if (current.scanned === 0) return newMs;
  return Math.round((current.avgResponseMs * (current.scanned - 1) + newMs) / current.scanned);
}
