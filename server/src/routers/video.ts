import { router, publicProcedure, z, TRPCError } from '../trpc.js';
import { analyzeVideoFrames } from '../services/anthropic.js';

export const videoRouter = router({
  analyzeVideo: publicProcedure
    .input(
      z.object({
        frames: z.array(z.string()).min(1).max(10),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const analysis = await analyzeVideoFrames({
          frames: input.frames,
          description: input.description,
        });
        return analysis;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Video analysis failed',
        });
      }
    }),
});
