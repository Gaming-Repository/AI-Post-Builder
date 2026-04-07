import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import {
  MODEL_CONFIGS,
  type ModelId,
  resolveModel,
} from '../config/platforms.js';
import type { Platform } from '../db/schema.js';

// Provider clients
const getAnthropicClient = () =>
  new Anthropic({
    apiKey:
      process.env.WORKSH_ANTHROPIC_API_KEY ??
      process.env.ANTHROPIC_API_KEY ??
      '',
  });

const getOpenAIClient = () =>
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? '',
  });

const getGeminiClient = () =>
  new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY ?? '',
  });

// Types
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

// JSON extraction helpers
function extractJson<T>(text: string): T {
  const jsonMatch =
    text.match(/```json\s*([\s\S]*?)\s*```/) ??
    text.match(/```\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text.trim();
  return JSON.parse(jsonStr) as T;
}

// Anthropic provider implementation
async function generatePostsAnthropic(
  params: {
    topic: string;
    tone: string;
    audience: string;
    keywords: string[];
    platforms: Platform[];
    videoAnalysis?: VideoAnalysis;
  },
  modelConfig: (typeof MODEL_CONFIGS)[ModelId]
): Promise<GeneratedPost[]> {
  const client = getAnthropicClient();

  const platformDetails = params.platforms
    .map((p) => {
      const cfg = {
        twitter: { name: 'Twitter/X', charLimit: 280, description: 'Concise, punchy. Max 2-3 hashtags. Strong hook.' },
        linkedin: { name: 'LinkedIn', charLimit: 3000, description: 'Professional. Thought leadership. 3-5 hashtags.' },
        instagram: { name: 'Instagram', charLimit: 2200, description: 'Visual storytelling. 10-15 hashtags. CTA.' },
        facebook: { name: 'Facebook', charLimit: 63206, description: 'Conversational, community-focused.' },
      }[p];
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
    system:
      'You are an expert social media strategist. Generate platform-optimized posts. Return ONLY valid JSON with no markdown formatting.',
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in Anthropic response');
  }

  const data = extractJson<{ posts: Array<{
    platform: Platform;
    content: string;
    metadata: PostMetadata;
  }> }>(textBlock.text);

  return data.posts.map((post) => {
    const platformConfigs = {
      twitter: 280,
      linkedin: 3000,
      instagram: 2200,
      facebook: 63206,
    };
    const charLimit = platformConfigs[post.platform];
    const charCount = post.content.length;
    return {
      ...post,
      characterCount: charCount,
      withinLimit: charCount <= charLimit,
    };
  });
}

async function generateSinglePostAnthropic(
  params: {
    topic: string;
    tone: string;
    audience: string;
    keywords: string[];
    platform: Platform;
    videoAnalysis?: VideoAnalysis;
  },
  modelConfig: (typeof MODEL_CONFIGS)[ModelId]
): Promise<GeneratedPost> {
  const client = getAnthropicClient();

  const platformConfigs: Record<Platform, { name: string; charLimit: number; description: string }> = {
    twitter: { name: 'Twitter/X', charLimit: 280, description: 'Concise, punchy. Max 2-3 hashtags.' },
    linkedin: { name: 'LinkedIn', charLimit: 3000, description: 'Professional tone. 3-5 hashtags.' },
    instagram: { name: 'Instagram', charLimit: 2200, description: 'Visual storytelling. 10-15 hashtags.' },
    facebook: { name: 'Facebook', charLimit: 63206, description: 'Conversational, community-focused.' },
  };

  const cfg = platformConfigs[params.platform];

  const videoContext = params.videoAnalysis
    ? `\nVideo analysis context:\n- Description: ${params.videoAnalysis.description}\n- Key elements: ${params.videoAnalysis.keyElements.join(', ')}`
    : '';

  const userPrompt = `Generate a social media post for ${cfg.name}.
Max ${cfg.charLimit} characters. ${cfg.description}

Topic: ${params.topic}
Tone: ${params.tone}
Target audience: ${params.audience}
Keywords: ${params.keywords.join(', ')}${videoContext}

Return JSON with:
- platform: "${params.platform}"
- content: the post text
- metadata: { sentiment, keyTopics[], callToAction, hashtags[], mentions[] }`;

  const response = await client.messages.create({
    model: modelConfig.apiId,
    max_tokens: 2048,
    system:
      'You are an expert social media strategist. Generate ONE platform-optimized post. Return ONLY valid JSON.',
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in Anthropic response');
  }

  const data = extractJson<{
    platform: Platform;
    content: string;
    metadata: PostMetadata;
  }>(textBlock.text);

  const charCount = data.content.length;
  return {
    ...data,
    characterCount: charCount,
    withinLimit: charCount <= cfg.charLimit,
  };
}

async function analyzeVideoFramesAnthropic(params: {
  frames: string[];
  description?: string;
}): Promise<VideoAnalysis> {
  const client = getAnthropicClient();

  const imageContent: Anthropic.ImageBlockParam[] = params.frames.map((frame) => ({
    type: 'image',
    source: {
      type: 'base64',
      media_type: 'image/jpeg',
      data: frame.replace(/^data:image\/[a-z]+;base64,/, ''),
    },
  }));

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
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

  return extractJson<VideoAnalysis>(textBlock.text);
}

// OpenAI provider implementation
async function generatePostsOpenAI(
  params: {
    topic: string;
    tone: string;
    audience: string;
    keywords: string[];
    platforms: Platform[];
    videoAnalysis?: VideoAnalysis;
  },
  modelConfig: (typeof MODEL_CONFIGS)[ModelId]
): Promise<GeneratedPost[]> {
  const client = getOpenAIClient();

  const platformDetails = params.platforms
    .map((p) => {
      const cfg = {
        twitter: { name: 'Twitter/X', charLimit: 280, description: 'Concise, punchy. Max 2-3 hashtags.' },
        linkedin: { name: 'LinkedIn', charLimit: 3000, description: 'Professional. Thought leadership. 3-5 hashtags.' },
        instagram: { name: 'Instagram', charLimit: 2200, description: 'Visual storytelling. 10-15 hashtags. CTA.' },
        facebook: { name: 'Facebook', charLimit: 63206, description: 'Conversational, community-focused.' },
      }[p];
      return `- ${cfg.name} (${p}): max ${cfg.charLimit} chars. ${cfg.description}`;
    })
    .join('\n');

  const videoContext = params.videoAnalysis
    ? `\nVideo analysis context:\n- Description: ${params.videoAnalysis.description}\n- Key elements: ${params.videoAnalysis.keyElements.join(', ')}`
    : '';

  const systemPrompt = 'You are an expert social media strategist. Generate platform-optimized posts. Return ONLY valid JSON with no markdown formatting.';
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

  const response = await client.chat.completions.create({
    model: modelConfig.apiId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content in OpenAI response');
  }

  const data = JSON.parse(content) as { posts: Array<{
    platform: Platform;
    content: string;
    metadata: PostMetadata;
  }> };

  return data.posts.map((post) => {
    const platformConfigs = {
      twitter: 280,
      linkedin: 3000,
      instagram: 2200,
      facebook: 63206,
    };
    const charLimit = platformConfigs[post.platform];
    const charCount = post.content.length;
    return {
      ...post,
      characterCount: charCount,
      withinLimit: charCount <= charLimit,
    };
  });
}

async function generateSinglePostOpenAI(
  params: {
    topic: string;
    tone: string;
    audience: string;
    keywords: string[];
    platform: Platform;
    videoAnalysis?: VideoAnalysis;
  },
  modelConfig: (typeof MODEL_CONFIGS)[ModelId]
): Promise<GeneratedPost> {
  const client = getOpenAIClient();

  const platformConfigs: Record<Platform, { name: string; charLimit: number; description: string }> = {
    twitter: { name: 'Twitter/X', charLimit: 280, description: 'Concise, punchy. Max 2-3 hashtags.' },
    linkedin: { name: 'LinkedIn', charLimit: 3000, description: 'Professional tone. 3-5 hashtags.' },
    instagram: { name: 'Instagram', charLimit: 2200, description: 'Visual storytelling. 10-15 hashtags.' },
    facebook: { name: 'Facebook', charLimit: 63206, description: 'Conversational, community-focused.' },
  };

  const cfg = platformConfigs[params.platform];

  const videoContext = params.videoAnalysis
    ? `\nVideo analysis context:\n- Description: ${params.videoAnalysis.description}\n- Key elements: ${params.videoAnalysis.keyElements.join(', ')}`
    : '';

  const systemPrompt = 'You are an expert social media strategist. Generate ONE platform-optimized post. Return ONLY valid JSON.';
  const userPrompt = `Generate a social media post for ${cfg.name}.
Max ${cfg.charLimit} characters. ${cfg.description}

Topic: ${params.topic}
Tone: ${params.tone}
Target audience: ${params.audience}
Keywords: ${params.keywords.join(', ')}${videoContext}

Return JSON with:
- platform: "${params.platform}"
- content: the post text
- metadata: { sentiment, keyTopics[], callToAction, hashtags[], mentions[] }`;

  const response = await client.chat.completions.create({
    model: modelConfig.apiId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 2048,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content in OpenAI response');
  }

  const data = JSON.parse(content) as {
    platform: Platform;
    content: string;
    metadata: PostMetadata;
  };

  const charCount = data.content.length;
  return {
    ...data,
    characterCount: charCount,
    withinLimit: charCount <= cfg.charLimit,
  };
}

async function analyzeVideoFramesOpenAI(params: {
  frames: string[];
  description?: string;
}): Promise<VideoAnalysis> {
  const client = getOpenAIClient();

  const imageContents = params.frames.map((frame) => ({
    type: 'image_url' as const,
    image_url: {
      url: frame.startsWith('data:') ? frame : `data:image/jpeg;base64,${frame}`,
    },
  }));

  const systemPrompt = 'You are an expert video analyst. Analyze the video frames and return structured JSON.';
  const userPrompt = `${params.description ? `Context: ${params.description}\n\n` : ''}Analyze these video frames and return a JSON object with:
- description: brief video summary
- keyElements: array of key visual elements
- suggestedTopic: suggested social media post topic
- suggestedKeywords: array of relevant keywords

Return valid JSON only.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          ...imageContents,
        ],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content in OpenAI vision response');
  }

  return JSON.parse(content) as VideoAnalysis;
}

async function generateImagePromptOpenAI(params: {
  postContent: string;
  platform: Platform;
  style?: string;
}): Promise<string> {
  const client = getOpenAIClient();

  const systemPrompt = 'You are an expert at writing image generation prompts. Create detailed, descriptive prompts.';
  const userPrompt = `Create a detailed image generation prompt for this ${params.platform} post:

"${params.postContent.slice(0, 300)}"

${params.style ? `Style preference: ${params.style}\n` : ''}Return only the image prompt, no explanation.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 256,
  });

  const content = response.choices[0]?.message?.content;
  return content?.trim() ?? '';
}

// Gemini provider implementation
async function generatePostsGemini(
  params: {
    topic: string;
    tone: string;
    audience: string;
    keywords: string[];
    platforms: Platform[];
    videoAnalysis?: VideoAnalysis;
  },
  modelConfig: (typeof MODEL_CONFIGS)[ModelId]
): Promise<GeneratedPost[]> {
  const client = getGeminiClient();

  const platformDetails = params.platforms
    .map((p) => {
      const cfg = {
        twitter: { name: 'Twitter/X', charLimit: 280, description: 'Concise, punchy. Max 2-3 hashtags.' },
        linkedin: { name: 'LinkedIn', charLimit: 3000, description: 'Professional. Thought leadership. 3-5 hashtags.' },
        instagram: { name: 'Instagram', charLimit: 2200, description: 'Visual storytelling. 10-15 hashtags. CTA.' },
        facebook: { name: 'Facebook', charLimit: 63206, description: 'Conversational, community-focused.' },
      }[p];
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

  const response = await client.models.generateContent({
    model: modelConfig.apiId,
    contents: userPrompt,
    config: {
      responseMimeType: 'application/json',
      maxOutputTokens: 4096,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('No text content in Gemini response');
  }

  const data = extractJson<{ posts: Array<{
    platform: Platform;
    content: string;
    metadata: PostMetadata;
  }> }>(text);

  return data.posts.map((post) => {
    const platformConfigs = {
      twitter: 280,
      linkedin: 3000,
      instagram: 2200,
      facebook: 63206,
    };
    const charLimit = platformConfigs[post.platform];
    const charCount = post.content.length;
    return {
      ...post,
      characterCount: charCount,
      withinLimit: charCount <= charLimit,
    };
  });
}

async function generateSinglePostGemini(
  params: {
    topic: string;
    tone: string;
    audience: string;
    keywords: string[];
    platform: Platform;
    videoAnalysis?: VideoAnalysis;
  },
  modelConfig: (typeof MODEL_CONFIGS)[ModelId]
): Promise<GeneratedPost> {
  const client = getGeminiClient();

  const platformConfigs: Record<Platform, { name: string; charLimit: number; description: string }> = {
    twitter: { name: 'Twitter/X', charLimit: 280, description: 'Concise, punchy. Max 2-3 hashtags.' },
    linkedin: { name: 'LinkedIn', charLimit: 3000, description: 'Professional tone. 3-5 hashtags.' },
    instagram: { name: 'Instagram', charLimit: 2200, description: 'Visual storytelling. 10-15 hashtags.' },
    facebook: { name: 'Facebook', charLimit: 63206, description: 'Conversational, community-focused.' },
  };

  const cfg = platformConfigs[params.platform];

  const videoContext = params.videoAnalysis
    ? `\nVideo analysis context:\n- Description: ${params.videoAnalysis.description}\n- Key elements: ${params.videoAnalysis.keyElements.join(', ')}`
    : '';

  const userPrompt = `Generate a social media post for ${cfg.name}.
Max ${cfg.charLimit} characters. ${cfg.description}

Topic: ${params.topic}
Tone: ${params.tone}
Target audience: ${params.audience}
Keywords: ${params.keywords.join(', ')}${videoContext}

Return JSON with:
- platform: "${params.platform}"
- content: the post text
- metadata: { sentiment, keyTopics[], callToAction, hashtags[], mentions[] }`;

  const response = await client.models.generateContent({
    model: modelConfig.apiId,
    contents: userPrompt,
    config: {
      responseMimeType: 'application/json',
      maxOutputTokens: 2048,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('No text content in Gemini response');
  }

  const data = extractJson<{
    platform: Platform;
    content: string;
    metadata: PostMetadata;
  }>(text);

  const charCount = data.content.length;
  return {
    ...data,
    characterCount: charCount,
    withinLimit: charCount <= cfg.charLimit,
  };
}

async function analyzeVideoFramesGemini(params: {
  frames: string[];
  description?: string;
}): Promise<VideoAnalysis> {
  const client = getGeminiClient();

  const imageParts = params.frames.map((frame) => {
    const base64Data = frame.replace(/^data:image\/[a-z]+;base64,/, '');
    return {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data,
      },
    };
  });

  const userPrompt = `${params.description ? `Context: ${params.description}\n\n` : ''}Analyze these video frames and return a JSON object with:
- description: brief video summary
- keyElements: array of key visual elements
- suggestedTopic: suggested social media post topic
- suggestedKeywords: array of relevant keywords

Return valid JSON only.`;

  const response = await client.models.generateContent({
    model: 'gemini-2.5-pro-preview-05-06',
    contents: [
      ...imageParts,
      { text: userPrompt },
    ],
    config: {
      responseMimeType: 'application/json',
      maxOutputTokens: 1024,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('No text content in Gemini vision response');
  }

  return extractJson<VideoAnalysis>(text);
}

async function generateImagePromptGemini(params: {
  postContent: string;
  platform: Platform;
  style?: string;
}): Promise<string> {
  const client = getGeminiClient();

  const userPrompt = `Create a detailed image generation prompt for this ${params.platform} post:

"${params.postContent.slice(0, 300)}"

${params.style ? `Style preference: ${params.style}\n` : ''}Return only the image prompt, no explanation.`;

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash-preview-05-20',
    contents: userPrompt,
    config: {
      maxOutputTokens: 256,
    },
  });

  return response.text?.trim() ?? '';
}

// Main exported functions with provider routing
export async function generatePosts(params: {
  topic: string;
  tone: string;
  audience: string;
  keywords: string[];
  platforms: Platform[];
  model: ModelId | 'best';
  videoAnalysis?: VideoAnalysis;
}): Promise<GeneratedPost[]> {
  const resolvedModel = resolveModel(params.model, 'textGeneration');
  const modelConfig = MODEL_CONFIGS[resolvedModel];

  switch (modelConfig.provider) {
    case 'anthropic':
      return generatePostsAnthropic(params, modelConfig);
    case 'openai':
      return generatePostsOpenAI(params, modelConfig);
    case 'gemini':
      return generatePostsGemini(params, modelConfig);
    default:
      throw new Error(`Unknown provider: ${modelConfig.provider}`);
  }
}

export async function generateSinglePost(params: {
  topic: string;
  tone: string;
  audience: string;
  keywords: string[];
  platform: Platform;
  model: ModelId | 'best';
  videoAnalysis?: VideoAnalysis;
}): Promise<GeneratedPost> {
  const resolvedModel = resolveModel(params.model, 'regeneration');
  const modelConfig = MODEL_CONFIGS[resolvedModel];

  switch (modelConfig.provider) {
    case 'anthropic':
      return generateSinglePostAnthropic(params, modelConfig);
    case 'openai':
      return generateSinglePostOpenAI(params, modelConfig);
    case 'gemini':
      return generateSinglePostGemini(params, modelConfig);
    default:
      throw new Error(`Unknown provider: ${modelConfig.provider}`);
  }
}

export async function analyzeVideoFrames(params: {
  frames: string[];
  description?: string;
  model?: ModelId | 'best';
}): Promise<VideoAnalysis> {
  const resolvedModel = params.model ? resolveModel(params.model, 'videoAnalysis') : 'gpt4o';
  const _modelConfig = MODEL_CONFIGS[resolvedModel];

  // Video analysis routes based on provider preference
  // Currently defaults to OpenAI GPT-4o for most reliable vision + JSON output
  switch (_modelConfig.provider) {
    case 'anthropic':
      return analyzeVideoFramesAnthropic(params);
    case 'openai':
    default:
      return analyzeVideoFramesOpenAI(params);
    case 'gemini':
      return analyzeVideoFramesGemini(params);
  }
}

export async function generateImagePrompt(params: {
  postContent: string;
  platform: Platform;
  style?: string;
  model?: ModelId | 'best';
}): Promise<string> {
  const resolvedModel = params.model ? resolveModel(params.model, 'imagePrompt') : 'gpt4o-mini';
  const modelConfig = MODEL_CONFIGS[resolvedModel];

  switch (modelConfig.provider) {
    case 'anthropic':
      return generateImagePromptAnthropicLegacy(params);
    case 'openai':
      return generateImagePromptOpenAI(params);
    case 'gemini':
      return generateImagePromptGemini(params);
    default:
      throw new Error(`Unknown provider: ${modelConfig.provider}`);
  }
}

// Legacy anthropic image prompt for backward compatibility
async function generateImagePromptAnthropicLegacy(params: {
  postContent: string;
  platform: Platform;
  style?: string;
}): Promise<string> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
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

// Types already exported above - no re-export needed
