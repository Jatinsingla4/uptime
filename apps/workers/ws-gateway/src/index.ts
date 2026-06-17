import { verifyJwt } from '../../api/src/middleware/auth.js';

interface WsGatewayEnv {
  CRAWL_COORDINATOR: DurableObjectNamespace;
  UPTIME_MONITOR: DurableObjectNamespace;
  JWT_SECRET: string;
}

export default {
  async fetch(request: Request, env: WsGatewayEnv): Promise<Response> {
    const url = new URL(request.url);

    // CORS for WS handshake
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': 'https://sitepulse.app',
          'Access-Control-Allow-Headers': 'Authorization',
        },
      });
    }

    // Require WebSocket upgrade
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    // Auth: JWT from query param (WS can't send custom headers in browser)
    const token = url.searchParams.get('token');
    if (!token) {
      return new Response('Unauthorized', { status: 401 });
    }

    const payload = await verifyJwt(token, env.JWT_SECRET);
    if (!payload) {
      return new Response('Unauthorized: invalid token', { status: 401 });
    }

    // Route: /crawl/:jobId
    const crawlMatch = url.pathname.match(/^\/crawl\/([A-Z0-9]+)$/i);
    if (crawlMatch) {
      const jobId = crawlMatch[1]!;
      const lastEventId = url.searchParams.get('lastEventId') ?? undefined;

      const coordinatorId = env.CRAWL_COORDINATOR.idFromName(jobId);
      const coordinator = env.CRAWL_COORDINATOR.get(coordinatorId);

      // Forward the WS upgrade to the DO
      const doUrl = new URL(`https://internal/ws`);
      if (lastEventId) doUrl.searchParams.set('lastEventId', lastEventId);

      const doReq = new Request(doUrl, {
        headers: new Headers({
          ...Object.fromEntries(request.headers),
          'X-User-Id': payload.sub,
        }),
      });

      return coordinator.fetch(doReq);
    }

    // Route: /uptime/:projectId — future extension
    const uptimeMatch = url.pathname.match(/^\/uptime\/([A-Z0-9]+)$/i);
    if (uptimeMatch) {
      const projectId = uptimeMatch[1]!;
      const monitorId = env.UPTIME_MONITOR.idFromName(projectId);
      const monitor = env.UPTIME_MONITOR.get(monitorId);
      return monitor.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<WsGatewayEnv>;
