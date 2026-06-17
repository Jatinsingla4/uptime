import { isSafeUrl } from '@sitepulse/shared/ssrf';
import type { CrawlTaskMessage, CrawlTaskResult } from '@sitepulse/shared/types';
import { fetchUrl, readBodyLimited } from './fetch.js';
import { extractLinks } from './parse.js';

interface CrawlerEnv {
  CRAWL_COORDINATOR: DurableObjectNamespace;
}

export default {
  async queue(
    batch: MessageBatch<unknown>,
    env: CrawlerEnv
  ): Promise<void> {
    // Process all messages in the batch concurrently
    await Promise.allSettled(
      (batch as MessageBatch<CrawlTaskMessage>).messages.map((msg) => processTask(msg, env))
    );
  },
} satisfies ExportedHandler<CrawlerEnv>;

async function processTask(
  msg: Message<CrawlTaskMessage>,
  env: CrawlerEnv
): Promise<void> {
  const task = msg.body;

  try {
    // 1. SSRF guard — never skip this
    const safetyCheck = isSafeUrl(task.url);
    if (!safetyCheck.safe) {
      await reportBack(env, task, {
        taskId: task.taskId,
        jobId: task.jobId,
        url: task.url,
        statusCode: null,
        responseTimeMs: 0,
        contentType: null,
        redirectChain: [],
        discoveredLinks: [],
        errorReason: `blocked: ${safetyCheck.reason}`,
        blocked: true,
      });
      msg.ack();
      return;
    }

    // 2. Fetch the URL
    const fetchResult = await fetchUrl(task.url, 'SitePulse/1.0 (+https://sitepulse.app)');

    // 3. Extract links only from HTML responses
    let discoveredLinks: string[] = [];
    if (
      fetchResult.statusCode !== null &&
      fetchResult.statusCode < 400 &&
      fetchResult.contentType?.includes('html')
    ) {
      try {
        // Re-fetch for body (fetchUrl used redirect:manual, no body consumed)
        const bodyResponse = await fetch(task.url, {
          method: 'GET',
          headers: { 'User-Agent': 'SitePulse/1.0 (+https://sitepulse.app)' },
          cf: { cacheEverything: false } satisfies CfProperties,
        });
        const html = await readBodyLimited(bodyResponse);
        discoveredLinks = await extractLinks(html, task.url);
      } catch {
        // Link extraction failure is non-fatal
      }
    }

    // 4. Report back to coordinator DO
    await reportBack(env, task, {
      ...fetchResult,
      taskId: task.taskId,
      jobId: task.jobId,
      discoveredLinks,
      blocked: false,
    });

    msg.ack();
  } catch (err) {
    // Non-retriable errors: ack to avoid infinite retries
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[crawler] Task ${task.taskId} failed: ${errMsg}`);

    // Let Wrangler retry (max 3) by NOT acking — message goes back to queue
    // For permanent errors, ack to prevent DLQ flooding
    if (isPermanentError(errMsg)) {
      msg.ack();
    } else {
      msg.retry();
    }
  }
}

async function reportBack(
  env: CrawlerEnv,
  task: CrawlTaskMessage,
  result: CrawlTaskResult
): Promise<void> {
  const coordinatorId = env.CRAWL_COORDINATOR.idFromString(task.coordinatorId);
  const coordinator = env.CRAWL_COORDINATOR.get(coordinatorId);

  const response = await coordinator.fetch('https://internal/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  });

  if (!response.ok) {
    throw new Error(`Coordinator report failed: ${response.status}`);
  }
}

function isPermanentError(msg: string): boolean {
  return (
    msg.includes('NOT_FOUND') ||
    msg.includes('INVALID') ||
    msg.includes('blocked:')
  );
}
