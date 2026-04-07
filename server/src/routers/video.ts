import { router, publicProcedure, z, TRPCError } from '../trpc.js';
import { analyzeVideoFrames } from '../services/ai.js';

const modelEnum = z.enum([
  'haiku', 'sonnet', 'opus',
  'gpt4o-mini', 'gpt4o', 'o3-mini',
  'gemini-flash', 'gemini-pro',
  'best',
]);

export const videoRouter = router({
  analyzeVideo: publicProcedure
    .input(
      z.object({
        frames: z.array(z.string()).min(1).max(10),
        description: z.string().optional(),
        model: modelEnum.default('best'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const analysis = await analyzeVideoFrames({
          frames: input.frames,
          model: input.model,
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
