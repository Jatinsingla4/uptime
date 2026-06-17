/**
 * Simple in-memory rate limiter using CF Workers' globalThis.
 * For production use CF's built-in rate limiting or Durable Objects rate limiter.
 * This implementation: token bucket per user per minute.
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

// In-memory store (resets on Worker restart/cold start — acceptable for edge rate limiting)
const buckets = new Map<string, Bucket>();

const LIMITS = {
  read:    { rpm: 1000, burst: 50 },
  write:   { rpm: 100,  burst: 20 },
  crawl:   { rpm: 10,   burst: 3 },
} as const;

type LimitType = keyof typeof LIMITS;

export function checkRateLimit(
  key: string,
  type: LimitType = 'write'
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const limit = LIMITS[type];
  const now = Date.now();
  const refillIntervalMs = (60 * 1000) / limit.rpm; // ms per token

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: limit.burst, lastRefill: now };
    buckets.set(key, bucket);
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill;
  const newTokens = Math.floor(elapsed / refillIntervalMs);
  if (newTokens > 0) {
    bucket.tokens = Math.min(limit.burst, bucket.tokens + newTokens);
    bucket.lastRefill = now;
  }

  if (bucket.tokens < 1) {
    const retryAfterMs = refillIntervalMs - (now - bucket.lastRefill);
    return { allowed: false, remaining: 0, retryAfterMs: Math.ceil(retryAfterMs) };
  }

  bucket.tokens -= 1;
  return { allowed: true, remaining: bucket.tokens, retryAfterMs: 0 };
}

// Cleanup old buckets every ~1000 requests to prevent memory growth
let cleanupCounter = 0;
export function maybePruneBuckets() {
  if (++cleanupCounter < 1000) return;
  cleanupCounter = 0;
  const cutoff = Date.now() - 5 * 60 * 1000; // 5 min
  for (const [key, bucket] of buckets) {
    if (bucket.lastRefill < cutoff) buckets.delete(key);
  }
}
