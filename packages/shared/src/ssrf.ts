/**
 * SSRF Prevention Utility
 * Blocks requests to private/reserved IP ranges, localhost, and cloud metadata endpoints.
 * IMPORTANT: Cloudflare Workers' fetch() also blocks internal IPs by default,
 * but we validate eagerly before any network call.
 */

// Private IPv4 CIDR ranges as [subnet, mask] pairs
const PRIVATE_IPV4_RANGES: Array<[number, number, string]> = [
  [0x0a000000, 0xff000000, '10.0.0.0/8'],          // 10.0.0.0/8
  [0xac100000, 0xfff00000, '172.16.0.0/12'],        // 172.16.0.0/12
  [0xc0a80000, 0xffff0000, '192.168.0.0/16'],       // 192.168.0.0/16
  [0x7f000000, 0xff000000, '127.0.0.0/8'],          // 127.0.0.0/8 (localhost)
  [0xa9fe0000, 0xffff0000, '169.254.0.0/16'],       // 169.254.0.0/16 (link-local + metadata)
  [0x00000000, 0xff000000, '0.0.0.0/8'],            // 0.0.0.0/8
  [0x64400000, 0xffc00000, '100.64.0.0/10'],        // 100.64.0.0/10 (carrier-grade NAT)
  [0xe0000000, 0xf0000000, '224.0.0.0/4'],          // Multicast
  [0xf0000000, 0xf0000000, '240.0.0.0/4'],          // Reserved
];

// Blocked hostnames (before DNS resolution, best-effort)
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  '169.254.169.254',
  '100.100.100.200', // Alibaba Cloud metadata
  '192.0.0.192',     // Azure metadata (some regions)
]);

// Allowed ports
const ALLOWED_PORTS = new Set([80, 443, 8080, 8443]);

export type SsrfCheckResult =
  | { safe: true }
  | { safe: false; reason: string };

/**
 * Check if a URL is safe to fetch (SSRF prevention).
 * Call this BEFORE any network request to user-supplied URLs.
 */
export function isSafeUrl(rawUrl: string): SsrfCheckResult {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { safe: false, reason: 'Invalid URL' };
  }

  // 1. Scheme check
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { safe: false, reason: `Disallowed protocol: ${url.protocol}` };
  }

  // 2. Credentials in URL
  if (url.username || url.password) {
    return { safe: false, reason: 'URL must not contain credentials' };
  }

  // 3. URL length
  if (rawUrl.length > 2048) {
    return { safe: false, reason: 'URL too long' };
  }

  const hostname = url.hostname.toLowerCase();

  // 4. Blocked hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { safe: false, reason: `Blocked hostname: ${hostname}` };
  }

  // 5. Port allowlist
  const port = url.port ? parseInt(url.port, 10) : (url.protocol === 'https:' ? 443 : 80);
  if (!ALLOWED_PORTS.has(port)) {
    return { safe: false, reason: `Port ${port} not allowed` };
  }

  // 6. IPv4 literal check (without DNS)
  const ipv4 = parseIPv4(hostname);
  if (ipv4 !== null) {
    for (const [subnet, mask, cidr] of PRIVATE_IPV4_RANGES) {
      if ((ipv4 & mask) === subnet) {
        return { safe: false, reason: `IP in private range ${cidr}` };
      }
    }
  }

  // 7. IPv6 literal check (block all private/loopback)
  if (hostname.startsWith('[')) {
    const ipv6 = hostname.slice(1, -1).toLowerCase();
    if (
      ipv6 === '::1' ||
      ipv6.startsWith('fc') ||
      ipv6.startsWith('fd') ||
      ipv6.startsWith('fe80') ||
      ipv6 === '::' ||
      ipv6.startsWith('::ffff:127.') ||
      ipv6.startsWith('::ffff:10.') ||
      ipv6.startsWith('::ffff:192.168.')
    ) {
      return { safe: false, reason: `IPv6 address in private range: ${ipv6}` };
    }
  }

  return { safe: true };
}

function parseIPv4(hostname: string): number | null {
  const parts = hostname.split('.');
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    const n = parseInt(part, 10);
    if (isNaN(n) || n < 0 || n > 255 || part !== String(n)) return null;
    result = (result << 8) | n;
  }
  return result >>> 0;
}

/**
 * Normalize a URL for consistent deduplication:
 * - Lowercase scheme and host
 * - Remove default ports
 * - Remove fragment
 * - Sort query params
 * - Resolve . and ..
 */
export function normalizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.hash = '';
  url.hostname = url.hostname.toLowerCase();

  // Remove default ports
  if (
    (url.protocol === 'http:' && url.port === '80') ||
    (url.protocol === 'https:' && url.port === '443')
  ) {
    url.port = '';
  }

  // Sort query params for consistency
  url.searchParams.sort();

  return url.toString();
}

/**
 * Extract the base URL (origin) from a URL.
 */
export function getOrigin(rawUrl: string): string {
  return new URL(rawUrl).origin;
}
