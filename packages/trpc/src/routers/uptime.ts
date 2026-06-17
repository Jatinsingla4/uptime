import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../trpc';
import { uptimeQueries } from '@sitepulse/db/queries/uptime';
import { projectsQueries } from '@sitepulse/db/queries/projects';
import { uptimeStatsSchema } from '@sitepulse/shared/schemas';

export const uptimeRouter = router({
  stats: protectedProcedure
    .input(uptimeStatsSchema)
    .query(async ({ ctx, input }) => {
      const project = await projectsQueries.getById(ctx.env.DB, input.projectId, ctx.user.id);
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });
      return uptimeQueries.getStats(ctx.env.DB, input.projectId, input.range);
    }),

  incidents: protectedProcedure
    .input(uptimeStatsSchema)
    .query(async ({ ctx, input }) => {
      const project = await projectsQueries.getById(ctx.env.DB, input.projectId, ctx.user.id);
      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });
      return uptimeQueries.listIncidents(ctx.env.DB, input.projectId, { limit: 100 });
    }),
});
