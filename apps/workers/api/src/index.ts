import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@sitepulse/trpc';
import type { RawContext, Env } from '@sitepulse/trpc';
import { usersQueries } from '@sitepulse/db/queries/users';
import { verifyJwt } from './middleware/auth.js';
import { checkRateLimit, maybePruneBuckets } from './middleware/rateLimit.js';
import { ulid } from '@sitepulse/shared/ulid';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://sitepulse.app',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Idempotency-Key',
  'Access-Control-Max-Age':       '86400',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return Response.json({ ok: true, ts: Date.now() });
    }

    // tRPC routes
    if (url.pathname.startsWith('/trpc')) {
      const requestId = ulid();

      // Extract JWT from Authorization header or httpOnly cookie
      let user = null;
      const authHeader = request.headers.get('Authorization');
      const cookieHeader = request.headers.get('Cookie');

      let token: string | null = null;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      } else if (cookieHeader) {
        const match = cookieHeader.match(/sp_token=([^;]+)/);
        token = match?.[1] ?? null;
      }

      if (token) {
        const payload = await verifyJwt(token, env.JWT_SECRET);
        if (payload) {
          user = await usersQueries.getById(env.DB, payload.sub);
        }
      }

      // Rate limiting
      if (user) {
        maybePruneBuckets();
        const isWrite = request.method === 'POST';
        const isCrawl = url.pathname.includes('crawls.start');
        const limitType = isCrawl ? 'crawl' : isWrite ? 'write' : 'read';
        const { allowed, remaining, retryAfterMs } = checkRateLimit(user.id, limitType);

        if (!allowed) {
          return new Response('Too Many Requests', {
            status: 429,
            headers: {
              ...CORS_HEADERS,
              'Retry-After': String(Math.ceil(retryAfterMs / 1000)),
              'X-RateLimit-Remaining': '0',
            },
          });
        }

        const ctx: RawContext = { env, user, requestId };
        const response = await fetchRequestHandler({
          endpoint: '/trpc',
          req: request,
          router: appRouter,
          createContext: () => ctx,
          onError: ({ error, path }) => {
            console.error(`[tRPC] ${path ?? 'unknown'}: ${error.message}`);
          },
        });

        // Add CORS + request ID to response
        const headers = new Headers(response.headers);
        Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v));
        headers.set('X-Request-ID', requestId);
        headers.set('X-RateLimit-Remaining', String(remaining));

        return new Response(response.body, { status: response.status, headers });
      }

      // Unauthenticated — still allow public procedures
      const ctx: RawContext = { env, user: null, requestId };
      const response = await fetchRequestHandler({
        endpoint: '/trpc',
        req: request,
        router: appRouter,
        createContext: () => ctx,
        onError: ({ error, path }) => {
          console.error(`[tRPC] ${path ?? 'unknown'}: ${error.message}`);
        },
      });

      const headers = new Headers(response.headers);
      Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v));
      headers.set('X-Request-ID', requestId);

      return new Response(response.body, { status: response.status, headers });
    }

    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
