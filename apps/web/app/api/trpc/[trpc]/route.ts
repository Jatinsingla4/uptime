/**
 * tRPC Next.js API route handler.
 * This is a thin proxy — actual tRPC logic lives in the Cloudflare Worker.
 * The Next.js app calls the Worker directly via httpBatchLink.
 * This route exists for local development only.
 */
export const runtime = 'edge';

export async function GET(req: Request) {
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:8787';
  const url = new URL(req.url);
  const workerUrl = `${apiUrl}${url.pathname}${url.search}`;
  return fetch(workerUrl, { headers: req.headers });
}

export async function POST(req: Request) {
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:8787';
  const url = new URL(req.url);
  const workerUrl = `${apiUrl}${url.pathname}${url.search}`;
  return fetch(workerUrl, {
    method: 'POST',
    headers: req.headers,
    body: req.body,
    // @ts-expect-error — duplex required for streaming POST in edge runtime
    duplex: 'half',
  });
}
