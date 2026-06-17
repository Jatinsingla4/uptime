import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { usersQueries } from '@sitepulse/db/queries/users';
import { ulid } from '@sitepulse/shared/ulid';

export const authRouter = router({
  me: protectedProcedure.query(({ ctx }) => ctx.user),

  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1).max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await usersQueries.getByEmail(ctx.env.DB, input.email);
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Email already registered' });
      }
      return usersQueries.create(ctx.env.DB, {
        id: ulid(),
        email: input.email,
        name: input.name ?? null,
      });
    }),

  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100).optional() }))
    .mutation(async ({ ctx, input }) => {
      const updateData: Parameters<typeof usersQueries.update>[2] = {};
      if (input.name !== undefined) updateData.name = input.name;
      await usersQueries.update(ctx.env.DB, ctx.user.id, updateData);
      return usersQueries.getById(ctx.env.DB, ctx.user.id);
    }),
});
