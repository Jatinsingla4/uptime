import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../trpc';
import { crawlsQueries } from '@sitepulse/db/queries/crawls';
import { projectsQueries } from '@sitepulse/db/queries/projects';
import { startCrawlSchema, crawlResultsQuerySchema } from '@sitepulse/shared/schemas';
import { PLAN_LIMITS } from '@sitepulse/shared/types';
import { ulid } from '@sitepulse/shared/ulid';

export const crawlsRouter = router({
  list: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      cursor: z.string().optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await projectsQueries.getById(ctx.env.DB, input.projectId, ctx.user.id);
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });
      return crawlsQueries.listByProject(ctx.env.DB, input.projectId, input.limit, input.cursor);
    }),

  get: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await crawlsQueries.getById(ctx.env.DB, input.jobId);
      if (!job) throw new TRPCError({ code: 'NOT_FOUND' });
      // Verify ownership via project
      const project = await projectsQueries.getById(ctx.env.DB, job.projectId, ctx.user.id);
      if (!project) throw new TRPCError({ code: 'FORBIDDEN' });
      return job;
    }),

  start: protectedProcedure
    .input(startCrawlSchema)
    .mutation(async ({ ctx, input }) => {
      const project = await projectsQueries.getById(ctx.env.DB, input.projectId, ctx.user.id);
      if (!project) throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });

      const limits = PLAN_LIMITS[ctx.user.plan];

      // Check concurrent crawl limits
      const running = await crawlsQueries.countRunning(ctx.env.DB, input.projectId);
      if (running >= limits.maxConcurrentCrawls) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Max ${limits.maxConcurrentCrawls} concurrent crawls on ${ctx.user.plan} plan`,
        });
      }

      const jobId = ulid();
      await crawlsQueries.create(ctx.env.DB, { id: jobId, projectId: input.projectId, trigger: 'manual' });

      // Merge crawl configs
      const crawlConfig = {
        ...project.crawlConfig,
        ...input.config,
        maxPages: Math.min(input.config?.maxPages ?? project.crawlConfig.maxPages, limits.maxPages),
      };

      // Initialize CrawlCoordinator Durable Object
      const coordinatorId = ctx.env.CRAWL_COORDINATOR.idFromName(jobId);
      const coordinator = ctx.env.CRAWL_COORDINATOR.get(coordinatorId);

      await coordinator.fetch('https://internal/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, seedUrl: project.baseUrl, config: crawlConfig }),
      });

      return { jobId };
    }),

  cancel: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const job = await crawlsQueries.getById(ctx.env.DB, input.jobId);
      if (!job) throw new TRPCError({ code: 'NOT_FOUND' });

      const project = await projectsQueries.getById(ctx.env.DB, job.projectId, ctx.user.id);
      if (!project) throw new TRPCError({ code: 'FORBIDDEN' });

      if (job.status === 'completed' || job.status === 'failed') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Crawl already finished' });
      }

      // Signal DO to cancel
      const coordinatorId = ctx.env.CRAWL_COORDINATOR.idFromName(input.jobId);
      const coordinator = ctx.env.CRAWL_COORDINATOR.get(coordinatorId);
      await coordinator.fetch('https://internal/cancel', { method: 'POST' });

      await crawlsQueries.updateStatus(ctx.env.DB, input.jobId, 'cancelled');
      return { success: true };
    }),

  results: protectedProcedure
    .input(crawlResultsQuerySchema)
    .query(async ({ ctx, input }) => {
      const job = await crawlsQueries.getById(ctx.env.DB, input.jobId);
      if (!job) throw new TRPCError({ code: 'NOT_FOUND' });

      const project = await projectsQueries.getById(ctx.env.DB, job.projectId, ctx.user.id);
      if (!project) throw new TRPCError({ code: 'FORBIDDEN' });

      const listOpts: Parameters<typeof crawlsQueries.listResults>[2] = { limit: input.limit };
      if (input.cursor !== undefined) listOpts.cursor = input.cursor;
      if (input.statusCategory !== undefined) listOpts.statusCategory = input.statusCategory;
      return crawlsQueries.listResults(ctx.env.DB, input.jobId, listOpts);
    }),

  brokenLinks: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await crawlsQueries.getById(ctx.env.DB, input.jobId);
      if (!job) throw new TRPCError({ code: 'NOT_FOUND' });

      const project = await projectsQueries.getById(ctx.env.DB, job.projectId, ctx.user.id);
      if (!project) throw new TRPCError({ code: 'FORBIDDEN' });

      return crawlsQueries.getBrokenLinks(ctx.env.DB, input.jobId);
    }),
});
