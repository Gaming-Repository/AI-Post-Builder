import { GoogleGenAI } from '@google/genai';
import { PLATFORM_CONFIGS, MODEL_CONFIGS, type ModelId } from '../config/platforms.js';
import type { Platform } from '../db/schema.js';
import type { PostMetadata, GeneratedPost, VideoAnalysis } from './ai.js';

export type { PostMetadata, GeneratedPost, VideoAnalysis };

const getClient = () =>
  new GoogleGenAI({
    apiKey:
      process.env.GEMINI_WORKSHOP_API_KEY ??
      process.env.GOOGLE_API_KEY ??
      '',
  });

// Helper to extract JSON from text
function extractJson(text: string): string {
  const jsonMatch =
    text.match(/```json\s*([\s\S]*?)\s*```/) ??
    text.match(/```\s*([\s\S]*?)\s*```/);
  return jsonMatch ? jsonMatch[1] : text.trim();
}

export async function generatePosts(params: {
  topic: string;
  tone: string;
  audience: string;
  keywords: string[];
  platforms: Platform[];
  model: ModelId;
  videoAnalysis?: VideoAnalysis;
}): Promise<GeneratedPost[]> {
  const client = getClient();
  const modelConfig = MODEL_CONFIGS[params.model];

  const platformDetails = params.platforms
    .map((p) => {
      const cfg = PLATFORM_CONFIGS[p];
      return `- ${cfg.name} (${p}): max ${cfg.charLimit} chars. ${cfg.description}`;
    })
    .join('\n');

  const videoContext = params.videoAnalysis
    ? `\nVideo analysis context:\n- Description: ${params.videoAnalysis.description}\n- Key elements: ${params.videoAnalysis.keyElements.join(', ')}`
    : '';

  const systemInstruction = `You are an expert social media strategist. Generate platform-optimized posts in valid JSON format only. Never exceed platform character limits.`;

  const prompt = `Generate social media posts for the following platforms:
${platformDetails}

Topic: ${params.topic}
Tone: ${params.tone}
Target audience: ${params.audience}
Keywords to include: ${params.keywords.join(', ')}${videoContext}

Requirements:
- Each post MUST stay within its character limit
- Optimize content style for each platform
- Include relevant hashtags where appropriate
- Natural, engaging language
- Clear call-to-action where suitable

Return a JSON object with a "posts" array. Each post must have:
- platform: the platform key (twitter/linkedin/instagram/facebook)
- content: the post text
- metadata: { sentiment, keyTopics[], callToAction, hashtags[], mentions[] }`;

  const response = await client.models.generateContent({
    model: modelConfig.apiId,
    contents: prompt,
    config: {
      systemInstruction,
      maxOutputTokens: 4096,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('No text in Gemini response');
  }

  let parsed: { posts: Array<{ platform: string; content: string; metadata: PostMetadata }> };
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    throw new Error(`Failed to parse Gemini response as JSON: ${text.slice(0, 200)}`);
  }

  return parsed.posts
    .filter((p) => params.platforms.includes(p.platform as Platform))
    .map((p) => {
      const platform = p.platform as Platform;
      const cfg = PLATFORM_CONFIGS[platform];
      return {
        platform,
        content: p.content,
        characterCount: p.content.length,
        withinLimit: p.content.length <= cfg.charLimit,
        metadata: p.metadata,
      };
    });
}

export async function generateSinglePost(params: {
  topic: string;
  tone: string;
  audience: string;
  keywords: string[];
  platform: Platform;
  model: ModelId;
  previousPosts?: GeneratedPost[];
  videoAnalysis?: VideoAnalysis;
}): Promise<GeneratedPost> {
  const posts = await generatePosts({
    topic: params.topic,
    tone: params.tone,
    audience: params.audience,
    keywords: params.keywords,
    platforms: [params.platform],
    model: params.model,
    videoAnalysis: params.videoAnalysis,
  });
  const post = posts[0];
  if (!post) throw new Error(`No post generated for platform: ${params.platform}`);
  return post;
}

export async function analyzeVideoFrames(params: {
  frames: string[];
  model: ModelId;
  description?: string;
}): Promise<VideoAnalysis> {
  const client = getClient();
  const modelConfig = MODEL_CONFIGS[params.model];

  // Fallback to gemini-pro if the specified model doesn't support vision
  const visionModel = modelConfig.supportsVision ? modelConfig.apiId : 'gemini-2.5-pro-preview-05-06';

  const imageParts = params.frames.map((frame) => {
    const base64Data = frame.replace(/^data:image\/[a-z]+;base64,/, '');
    return {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data,
      },
    };
  });

  const prompt = `${params.description ? `Context: ${params.description}\n\n` : ''}Analyze these video frames and return a JSON object with:
- description: brief video summary
- keyElements: array of key visual elements
- suggestedTopic: suggested social media post topic
- suggestedKeywords: array of relevant keywords

Return valid JSON only.`;

  const response = await client.models.generateContent({
    model: visionModel,
    contents: [
      ...imageParts,
      { text: prompt },
    ],
    config: {
      maxOutputTokens: 1024,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('No text in Gemini vision response');
  }

  return JSON.parse(extractJson(text)) as VideoAnalysis;
}

export async function generateImagePrompt(params: {
  postContent: string;
  platform: Platform;
  model: ModelId;
  style?: string;
}): Promise<string> {
  const client = getClient();
  const modelConfig = MODEL_CONFIGS[params.model];

  const prompt = `Create a detailed image generation prompt for this ${params.platform} post:

"${params.postContent.slice(0, 300)}"

${params.style ? `Style preference: ${params.style}\n` : ''}Return only the image prompt, no explanation.`;

  const response = await client.models.generateContent({
    model: modelConfig.apiId,
    contents: prompt,
    config: {
      maxOutputTokens: 256,
    },
  });

  return response.text?.trim() ?? '';
}