import { router } from '../trpc.js';
import { postsRouter } from './posts.js';
import { videoRouter } from './video.js';
import { imageRouter } from './image.js';

export const appRouter = router({
  posts: postsRouter,
  video: videoRouter,
  image: imageRouter,
});

export type AppRouter = typeof appRouter;
