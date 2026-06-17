import { router } from './trpc';
import { authRouter } from './routers/auth';
import { projectsRouter } from './routers/projects';
import { crawlsRouter } from './routers/crawls';
import { uptimeRouter } from './routers/uptime';

export const appRouter = router({
  auth:     authRouter,
  projects: projectsRouter,
  crawls:   crawlsRouter,
  uptime:   uptimeRouter,
});

export type AppRouter = typeof appRouter;
