import { router, publicProcedure, z } from '../trpc.js';
import { generateImagePrompt } from '../services/anthropic.js';
import type { Platform } from '../db/schema.js';

export const imageRouter = router({
  generateImage: publicProcedure
    .input(
      z.object({
        postContent: z.string().min(1),
        platform: z.enum(['twitter', 'linkedin', 'instagram', 'facebook']),
        style: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Generate a descriptive image prompt via Claude
      const prompt = await generateImagePrompt({
        postContent: input.postContent,
        platform: input.platform as Platform,
        style: input.style,
      });

      // Return the prompt — in production, pass to an image generation service
      // (e.g., fal.ai, Replicate, or DALL-E) to get an actual imageUrl
      return {
        platform: input.platform,
        imageUrl: null as string | null,
        prompt,
      };
    }),
});
