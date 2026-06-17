import type { CrawlTaskResult } from '@sitepulse/shared/types';

const FETCH_TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5MB limit for HTML parsing
const MAX_REDIRECTS = 5;

export async function fetchUrl(
  url: string,
  userAgent: string
): Promise<Omit<CrawlTaskResult, 'taskId' | 'jobId' | 'discoveredLinks' | 'blocked'>> {
  const startMs = Date.now();
  const redirectChain: string[] = [];

  let currentUrl = url;
  let response: Response | null = null;
  let errorReason: string | null = null;
  let statusCode: number | null = null;
  let contentType: string | null = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      // CF Workers fetch follows redirects by default.
      // We disable redirect following to capture the chain manually.
      response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'manual', // We handle redirects ourselves
        signal: controller.signal,
        // CF-specific: don't cache at Workers level
        cf: { cacheEverything: false, cacheTtl: 0 } satisfies CfProperties,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // Follow redirects manually to capture chain
    let redirectCount = 0;
    while (response.status >= 300 && response.status < 400 && redirectCount < MAX_REDIRECTS) {
      const location = response.headers.get('Location');
      if (!location) break;

      redirectChain.push(currentUrl);
      try {
        currentUrl = new URL(location, currentUrl).toString();
      } catch {
        errorReason = 'invalid_redirect_location';
        break;
      }
      redirectCount++;

      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), FETCH_TIMEOUT_MS);
      try {
        response = await fetch(currentUrl, {
          method: 'GET',
          headers: { 'User-Agent': userAgent },
          redirect: 'manual',
          signal: controller2.signal,
        });
      } finally {
        clearTimeout(timeoutId2);
      }
    }

    if (redirectCount >= MAX_REDIRECTS) {
      errorReason = 'redirect_loop';
    }

    statusCode = response.status;
    contentType = response.headers.get('Content-Type');

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('aborted') || msg.includes('timeout')) {
      errorReason = 'timeout';
    } else if (msg.includes('DNS') || msg.includes('resolve')) {
      errorReason = 'dns_error';
    } else if (msg.includes('certificate') || msg.includes('SSL') || msg.includes('TLS')) {
      errorReason = 'ssl_error';
    } else if (msg.includes('refused') || msg.includes('ECONNREFUSED')) {
      errorReason = 'connection_refused';
    } else {
      errorReason = 'network_error';
    }
    statusCode = null;
  }

  return {
    url,
    statusCode,
    responseTimeMs: Date.now() - startMs,
    contentType,
    redirectChain,
    errorReason,
  };
}

/**
 * Read body with size limit — streams until MAX_BODY_BYTES then stops.
 */
export async function readBodyLimited(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.length;
      chunks.push(value);

      if (totalBytes >= MAX_BODY_BYTES) {
        break; // Truncate — parse partial HTML
      }
    }
  } finally {
    reader.releaseLock();
  }

  const combined = new Uint8Array(totalBytes > MAX_BODY_BYTES ? MAX_BODY_BYTES : totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk.slice(0, Math.min(chunk.length, MAX_BODY_BYTES - offset)), offset);
    offset += chunk.length;
    if (offset >= MAX_BODY_BYTES) break;
  }

  return new TextDecoder().decode(combined);
}
