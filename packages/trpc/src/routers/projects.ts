import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../trpc';
import { projectsQueries } from '@sitepulse/db/queries/projects';
import { createProjectSchema, updateProjectSchema } from '@sitepulse/shared/schemas';
import { PLAN_LIMITS } from '@sitepulse/shared/types';
import { ulid } from '@sitepulse/shared/ulid';

export const projectsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return projectsQueries.listByUser(ctx.env.DB, ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await projectsQueries.getById(ctx.env.DB, input.id, ctx.user.id);
      if (!project) throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      return project;
    }),

  create: protectedProcedure
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const limits = PLAN_LIMITS[ctx.user.plan];
      const count = await projectsQueries.countByUser(ctx.env.DB, ctx.user.id);
      if (count >= limits.maxProjects) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Plan limit reached: ${limits.maxProjects} projects max on ${ctx.user.plan} plan`,
        });
      }

      const crawlConfig = {
        maxDepth: 5,
        maxPages: Math.min(input.crawlConfig?.maxPages ?? 500, limits.maxPages),
        sameOrigin: input.crawlConfig?.sameOrigin ?? true,
        respectRobots: input.crawlConfig?.respectRobots ?? true,
        rateLimitPerSecond: input.crawlConfig?.rateLimitPerSecond ?? 5,
        userAgent: input.crawlConfig?.userAgent ?? 'SitePulse/1.0 (+https://sitepulse.app)',
        ...input.crawlConfig,
      };

      const checkInterval = Math.max(
        input.checkIntervalSeconds ?? 300,
        limits.minCheckIntervalSeconds
      );

      return projectsQueries.create(ctx.env.DB, {
        id: ulid(),
        userId: ctx.user.id,
        name: input.name,
        baseUrl: input.baseUrl,
        monitoringEnabled: input.monitoringEnabled ?? true,
        checkIntervalSeconds: checkInterval,
        crawlConfig,
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: updateProjectSchema }))
    .mutation(async ({ ctx, input }) => {
      const project = await projectsQueries.getById(ctx.env.DB, input.id, ctx.user.id);
      if (!project) throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });

      const limits = PLAN_LIMITS[ctx.user.plan];
      const data = { ...input.data };

      // Enforce plan limits on update
      if (data.checkIntervalSeconds !== undefined) {
        data.checkIntervalSeconds = Math.max(data.checkIntervalSeconds, limits.minCheckIntervalSeconds);
      }
      if (data.crawlConfig?.maxPages !== undefined) {
        data.crawlConfig.maxPages = Math.min(data.crawlConfig.maxPages, limits.maxPages);
      }

      // Build update payload respecting exactOptionalPropertyTypes
      type UpdatePayload = Parameters<typeof projectsQueries.update>[3];
      const updatePayload: UpdatePayload = {};
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.baseUrl !== undefined) updatePayload.baseUrl = data.baseUrl;
      if (data.monitoringEnabled !== undefined) updatePayload.monitoringEnabled = data.monitoringEnabled;
      if (data.checkIntervalSeconds !== undefined) updatePayload.checkIntervalSeconds = data.checkIntervalSeconds;
      if (data.crawlConfig !== undefined) updatePayload.crawlConfig = data.crawlConfig;
      await projectsQueries.update(ctx.env.DB, input.id, ctx.user.id, updatePayload);
      return projectsQueries.getById(ctx.env.DB, input.id, ctx.user.id);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await projectsQueries.getById(ctx.env.DB, input.id, ctx.user.id);
      if (!project) throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      await projectsQueries.delete(ctx.env.DB, input.id, ctx.user.id);
      return { success: true };
    }),
});
