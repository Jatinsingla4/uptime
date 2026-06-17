import type { CrawlStats, JobStatus } from './types';

// ─── WebSocket Event Types ────────────────────────────────────────────────────

export interface SnapshotEvent {
  type: 'snapshot';
  stats: CrawlStats;
  status: JobStatus;
  eventId: string;
}

export interface PageScannedEvent {
  type: 'page.scanned';
  url: string;
  statusCode: number;
  responseTimeMs: number;
  eventId: string;
}

export interface PageScannedBatchEvent {
  type: 'page.scanned.batch';
  items: Array<{ url: string; statusCode: number; responseTimeMs: number }>;
  eventId: string;
}

export interface LinkBrokenEvent {
  type: 'link.broken';
  url: string;
  parentUrl: string | null;
  statusCode: number;
  errorReason: string | null;
  eventId: string;
}

export interface ProgressEvent {
  type: 'progress';
  scanned: number;
  total: number;
  percent: number;
  eventId: string;
}

export interface CrawlCompletedEvent {
  type: 'crawl.completed';
  summary: CrawlStats;
  eventId: string;
}

export interface CrawlFailedEvent {
  type: 'crawl.failed';
  error: string;
  eventId: string;
}

export interface CrawlCancelledEvent {
  type: 'crawl.cancelled';
  eventId: string;
}

// Uptime events
export interface UptimeStatusChangeEvent {
  type: 'uptime.status_change';
  projectId: string;
  isUp: boolean;
  statusCode: number | null;
  responseTimeMs: number | null;
  eventId: string;
}

export type CrawlEvent =
  | SnapshotEvent
  | PageScannedEvent
  | PageScannedBatchEvent
  | LinkBrokenEvent
  | ProgressEvent
  | CrawlCompletedEvent
  | CrawlFailedEvent
  | CrawlCancelledEvent;

export type WsEvent = CrawlEvent | UptimeStatusChangeEvent;

// ─── Client → Server WebSocket messages ──────────────────────────────────────

export interface WsClientSubscribe {
  type: 'subscribe';
  jobId: string;
  lastEventId?: string;
}

export interface WsClientPing {
  type: 'ping';
}

export type WsClientMessage = WsClientSubscribe | WsClientPing;
