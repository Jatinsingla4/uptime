import type { User } from '@sitepulse/shared/types';

export interface Env {
  DB: D1Database;
  CRAWL_TASKS: Queue;
  R2: R2Bucket;
  CRAWL_COORDINATOR: DurableObjectNamespace;
  UPTIME_MONITOR: DurableObjectNamespace;
  JWT_SECRET: string;
  API_BASE_URL: string;
}

export interface Context {
  env: Env;
  user: User;
  requestId: string;
}

// Used internally — full context including optional user for auth middleware to build
export interface RawContext {
  env: Env;
  user: User | null;
  requestId: string;
}
