import { router, publicProcedure, z, TRPCError } from '../trpc.js';
import { getDb } from '../db/index.js';
import { sessions, posts } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import {
  generatePosts,
  generateSinglePost,
  type VideoAnalysis,
} from '../services/ai.js';
import type { Platform } from '../db/schema.js';
import type { ModelId } from '../config/platforms.js';

const platformEnum = z.enum(['twitter', 'linkedin', 'instagram', 'facebook']);
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

const videoAnalysisSchema = z.object({
  description: z.string(),
  keyElements: z.array(z.string()),
  suggestedTopic: z.string(),
  suggestedKeywords: z.array(z.string()),
});

export const postsRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        topic: z.string().min(1),
        tone: z.string().default('professional'),
        audience: z.string().default('general'),
        keywords: z.array(z.string()).default([]),
        platforms: z.array(platformEnum).min(1),
        model: modelEnum.default('sonnet'),
        videoAnalysis: videoAnalysisSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const sessionId = nanoid();

      // Save session
      await db.insert(sessions).values({
        id: sessionId,
        userId: 1,
        topic: input.topic,
        tone: input.tone,
        audience: input.audience,
        keywords: input.keywords.join(','),
        model: input.model,
        videoAnalysisData: input.videoAnalysis
          ? JSON.stringify(input.videoAnalysis)
          : null,
      });

      // Generate posts via Claude
      const generatedPosts = await generatePosts({
        topic: input.topic,
        tone: input.tone,
        audience: input.audience,
        keywords: input.keywords,
        platforms: input.platforms as Platform[],
        model: input.model as ModelId,
        videoAnalysis: input.videoAnalysis as VideoAnalysis | undefined,
      });

      // Save posts to DB
      for (const post of generatedPosts) {
        await db.insert(posts).values({
          userId: 1,
          sessionId,
          platform: post.platform,
          content: post.content,
          topic: input.topic,
          tone: input.tone,
          audience: input.audience,
          keywords: input.keywords.join(','),
          model: input.model,
          characterCount: post.characterCount,
          metadata: JSON.stringify(post.metadata),
        });
      }

      return {
        posts: generatedPosts,
        sessionId,
        model: input.model,
        timestamp: new Date().toISOString(),
      };
    }),

  regenerate: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        platform: platformEnum,
        model: modelEnum.default('sonnet'),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const session = await db.query.sessions.findFirst({
        where: eq(sessions.id, input.sessionId),
      });

      if (!session) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
      }

      const videoAnalysis = session.videoAnalysisData
        ? JSON.parse(session.videoAnalysisData) as VideoAnalysis
        : undefined;

      const post = await generateSinglePost({
        topic: session.topic ?? '',
        tone: session.tone ?? 'professional',
        audience: session.audience ?? 'general',
        keywords: session.keywords ? session.keywords.split(',').filter(Boolean) : [],
        platform: input.platform as Platform,
        model: input.model as ModelId | 'best',
        videoAnalysis,
      });

      // Upsert post
      const existing = await db.query.posts.findFirst({
        where: and(
          eq(posts.sessionId, input.sessionId),
          eq(posts.platform, input.platform)
        ),
      });

      if (existing) {
        await db
          .update(posts)
          .set({
            content: post.content,
            characterCount: post.characterCount,
            model: input.model,
            metadata: JSON.stringify(post.metadata),
          })
          .where(eq(posts.id, existing.id));
      } else {
        await db.insert(posts).values({
          userId: 1,
          sessionId: input.sessionId,
          platform: post.platform,
          content: post.content,
          topic: session.topic,
          tone: session.tone,
          audience: session.audience,
          keywords: session.keywords,
          model: input.model,
          characterCount: post.characterCount,
          metadata: JSON.stringify(post.metadata),
        });
      }

      return {
        platform: post.platform,
        content: post.content,
        characterCount: post.characterCount,
        withinLimit: post.withinLimit,
        metadata: post.metadata,
      };
    }),
});
