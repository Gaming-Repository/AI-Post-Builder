import Anthropic from '@anthropic-ai/sdk';
import { PLATFORM_CONFIGS, MODEL_CONFIGS, type ModelId } from '../config/platforms.js';
import type { Platform } from '../db/schema.js';

const getClient = () =>
  new Anthropic({
    apiKey:
      process.env.WORKSH_ANTHROPIC_API_KEY ??
      process.env.ANTHROPIC_API_KEY ??
      '',
  });

export interface PostMetadata {
  sentiment: 'positive' | 'neutral' | 'negative';
  keyTopics: string[];
  callToAction: string;
  hashtags: string[];
  mentions: string[];
}

export interface GeneratedPost {
  platform: Platform;
  content: string;
  characterCount: number;
  withinLimit: boolean;
  metadata: PostMetadata;
}

export interface VideoAnalysis {
  description: string;
  keyElements: string[];
  suggestedTopic: string;
  suggestedKeywords: string[];
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

  const userPrompt = `Generate social media posts for the following platforms:
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

  const response = await client.messages.create({
    model: modelConfig.apiId,
    max_tokens: 4096,
    system: 'You are an expert social media strategist. Generate platform-optimized posts in valid JSON format only. Never exceed platform character limits.',
    messages: [{ role: 'user', content: userPrompt }],
    // @ts-expect-error – betas may not be typed yet
    betas: ['output-128k-2025-02-19'],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch =
    textBlock.text.match(/```json\s*([\s\S]*?)\s*```/) ??
    textBlock.text.match(/```\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : textBlock.text.trim();

  let parsed: { posts: Array<{ platform: string; content: string; metadata: PostMetadata }> };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${jsonStr.slice(0, 200)}`);
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
  sessionTopic: string;
  sessionTone: string;
  sessionAudience: string;
  sessionKeywords: string[];
  platform: Platform;
  model: ModelId;
}): Promise<GeneratedPost> {
  const posts = await generatePosts({
    topic: params.sessionTopic,
    tone: params.sessionTone,
    audience: params.sessionAudience,
    keywords: params.sessionKeywords,
    platforms: [params.platform],
    model: params.model,
  });
  const post = posts[0];
  if (!post) throw new Error(`No post generated for platform: ${params.platform}`);
  return post;
}

export async function analyzeVideoFrames(params: {
  frames: string[];
  description?: string;
}): Promise<VideoAnalysis> {
  const client = getClient();

  const imageContent: Anthropic.ImageBlockParam[] = params.frames.map((frame) => ({
    type: 'image',
    source: {
      type: 'base64',
      media_type: 'image/jpeg',
      data: frame.replace(/^data:image\/[a-z]+;base64,/, ''),
    },
  }));

  const response = await client.messages.create({
    model: MODEL_CONFIGS.sonnet.apiId,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          ...imageContent,
          {
            type: 'text',
            text: `${params.description ? `Context: ${params.description}\n\n` : ''}Analyze these video frames and return a JSON object with:
- description: brief video summary
- keyElements: array of key visual elements
- suggestedTopic: suggested social media post topic
- suggestedKeywords: array of relevant keywords

Return valid JSON only.`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in vision response');
  }

  const jsonMatch =
    textBlock.text.match(/```json\s*([\s\S]*?)\s*```/) ??
    textBlock.text.match(/```\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : textBlock.text.trim();

  return JSON.parse(jsonStr) as VideoAnalysis;
}

export async function generateImagePrompt(params: {
  postContent: string;
  platform: Platform;
  style?: string;
}): Promise<string> {
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL_CONFIGS.haiku.apiId,
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `Create a detailed image generation prompt for this ${params.platform} post:

"${params.postContent.slice(0, 300)}"

${params.style ? `Style preference: ${params.style}\n` : ''}Return only the image prompt, no explanation.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') return '';
  return textBlock.text.trim();
}
