import { initTRPC, TRPCError } from '@trpc/server';
import type { Context, RawContext } from './context';

const t = initTRPC.context<RawContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } as Context & { user: NonNullable<typeof ctx.user> } });
});

export const protectedProcedure = t.procedure.use(isAuthed);
