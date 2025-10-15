import { t } from './trpc_init';
import { videoRouter } from './routes/video';

export const appRouter = t.router({
  video: videoRouter
});

export type AppRouter = typeof appRouter;
