import { router, publicProcedure, z } from '../trpc.js';
import { generateImagePrompt } from '../services/ai.js';
import type { Platform } from '../db/schema.js';

const modelEnum = z.enum([
  // Anthropic
  'haiku', 'sonnet', 'opus',
  // OpenAI
  'gpt4o-mini', 'gpt4o', 'o3-mini',
  // Gemini
  'gemini-flash', 'gemini-pro',
  // Best mode
  'best',
]);

export const imageRouter = router({
  generateImage: publicProcedure
    .input(
      z.object({
        postContent: z.string().min(1),
        platform: z.enum(['twitter', 'linkedin', 'instagram', 'facebook']),
        style: z.string().optional(),
        model: modelEnum.default('best'),
      })
    )
    .mutation(async ({ input }) => {
      // Generate a descriptive image prompt via AI
      const prompt = await generateImagePrompt({
        postContent: input.postContent,
        platform: input.platform as Platform,
        style: input.style,
        model: input.model,
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
