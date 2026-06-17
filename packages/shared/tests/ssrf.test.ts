/**
 * SSRF Prevention Test Suite
 * Tests every private CIDR, blocked hostname, and edge case from §9.1
 */
import { isSafeUrl, normalizeUrl } from '../src/ssrf.js';

// ─── Blocked: Private CIDRs ───────────────────────────────────────────────────

const BLOCKED_URLS = [
  // 10.0.0.0/8
  ['http://10.0.0.1',      '10.0.0.0/8'],
  ['http://10.255.255.255','10.0.0.0/8'],
  ['http://10.1.2.3',      '10.0.0.0/8'],
  // 172.16.0.0/12
  ['http://172.16.0.1',    '172.16.0.0/12'],
  ['http://172.31.255.255','172.16.0.0/12'],
  ['http://172.20.10.1',   '172.16.0.0/12'],
  // 192.168.0.0/16
  ['http://192.168.1.1',   '192.168.0.0/16'],
  ['http://192.168.0.1',   '192.168.0.0/16'],
  // 127.0.0.0/8 (localhost)
  ['http://127.0.0.1',     '127.0.0.0/8'],
  ['http://127.255.255.255','127.0.0.0/8'],
  // 169.254.0.0/16 (link-local / cloud metadata)
  ['http://169.254.169.254',  'metadata endpoint'],
  ['http://169.254.0.1',      '169.254.0.0/16'],
  // 0.0.0.0/8
  ['http://0.0.0.1',       '0.0.0.0/8'],
  // 100.64.0.0/10 (carrier-grade NAT)
  ['http://100.64.0.1',    '100.64.0.0/10'],
  ['http://100.127.255.255','100.64.0.0/10'],
  // Multicast
  ['http://224.0.0.1',     '224.0.0.0/4'],
  // Blocked hostnames
  ['http://localhost',     'localhost'],
  ['http://localhost:8080','localhost:8080'],
  ['http://metadata.google.internal', 'GCP metadata'],
  // IPv6 loopback
  ['http://[::1]',         'IPv6 loopback'],
  // Non-HTTP schemes
  ['ftp://example.com',    'ftp scheme'],
  ['file:///etc/passwd',   'file scheme'],
  ['javascript://x',       'javascript scheme'],
  // Credentials in URL
  ['http://user:pass@example.com', 'credentials'],
  // Disallowed ports
  ['http://example.com:22',   'SSH port'],
  ['http://example.com:3306', 'MySQL port'],
  ['http://example.com:6379', 'Redis port'],
] as const;

const ALLOWED_URLS = [
  'https://example.com',
  'http://example.com',
  'https://example.com/path/to/page',
  'https://sub.example.co.uk',
  'http://example.com:8080',
  'https://example.com:8443',
  'https://example.com/path?query=1&other=2',
  'https://11.0.0.1',        // 11.x.x.x is public (NOT 10.x.x.x)
  'https://172.15.0.1',      // 172.15.x is public (below 172.16.0.0)
  'https://192.169.0.1',     // 192.169.x is public (above 192.168.x)
  'https://100.63.255.255',  // 100.63 is public (below 100.64.0.0/10)
  'https://100.128.0.1',     // 100.128 is public (above 100.127.255.255)
] as const;

describe('isSafeUrl', () => {
  describe('blocks private/reserved addresses', () => {
    for (const [url, description] of BLOCKED_URLS) {
      it(`blocks ${description}: ${url}`, () => {
        const result = isSafeUrl(url);
        expect(result.safe).toBe(false);
        if (!result.safe) {
          expect(result.reason).toBeTruthy();
        }
      });
    }
  });

  describe('allows public addresses', () => {
    for (const url of ALLOWED_URLS) {
      it(`allows: ${url}`, () => {
        const result = isSafeUrl(url);
        expect(result.safe).toBe(true);
      });
    }
  });

  it('blocks URLs longer than 2048 chars', () => {
    const url = 'https://example.com/' + 'a'.repeat(2048);
    expect(isSafeUrl(url).safe).toBe(false);
  });

  it('blocks invalid URLs', () => {
    expect(isSafeUrl('not-a-url').safe).toBe(false);
    expect(isSafeUrl('').safe).toBe(false);
    expect(isSafeUrl('://broken').safe).toBe(false);
  });
});

describe('normalizeUrl', () => {
  it('lowercases the host', () => {
    expect(normalizeUrl('https://EXAMPLE.COM/path')).toContain('example.com');
  });

  it('removes default ports', () => {
    expect(normalizeUrl('https://example.com:443/path')).not.toContain(':443');
    expect(normalizeUrl('http://example.com:80/path')).not.toContain(':80');
  });

  it('removes fragments', () => {
    expect(normalizeUrl('https://example.com/path#section')).not.toContain('#');
  });

  it('sorts query params', () => {
    const a = normalizeUrl('https://example.com?z=1&a=2');
    const b = normalizeUrl('https://example.com?a=2&z=1');
    expect(a).toBe(b);
  });
});
