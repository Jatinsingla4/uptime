/**
 * AI Bridge Worker — proxies requests to RunPod Python service.
 * Handles async job pattern: POST to queue, poll for result.
 */

interface AiBridgeEnv {
  RUNPOD_API_URL: string;
  RUNPOD_API_KEY: string;
  DB: D1Database;
}

type AiJobType = 'cluster' | 'recommend' | 'summarize' | 'embed';

interface AiJobRequest {
  type: AiJobType;
  payload: unknown;
  jobId: string;
  callbackUrl?: string;
}

export default {
  async fetch(request: Request, env: AiBridgeEnv): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const body = await request.json<AiJobRequest>();

    const response = await fetch(`${env.RUNPOD_API_URL}/${body.type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RUNPOD_API_KEY}`,
      },
      body: JSON.stringify(body.payload),
    });

    if (!response.ok) {
      const text = await response.text();
      return Response.json(
        { error: `RunPod error: ${response.status}`, detail: text },
        { status: 502 }
      );
    }

    const result = await response.json();
    return Response.json({ ok: true, result });
  },
} satisfies ExportedHandler<AiBridgeEnv>;
