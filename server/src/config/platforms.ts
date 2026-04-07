import type { Platform } from '../db/schema.js';

export interface PlatformConfig {
  name: string;
  charLimit: number;
  hashtags: boolean;
  mentions: boolean;
  links: boolean;
  emojis: boolean;
  lineBreaks: boolean;
  description: string;
}

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  twitter: {
    name: 'Twitter/X',
    charLimit: 280,
    hashtags: true,
    mentions: true,
    links: true,
    emojis: true,
    lineBreaks: false,
    description: 'Concise, punchy content. Max 2-3 hashtags. Strong hook in first line.',
  },
  linkedin: {
    name: 'LinkedIn',
    charLimit: 3000,
    hashtags: true,
    mentions: true,
    links: true,
    emojis: false,
    lineBreaks: true,
    description: 'Professional tone. Thought leadership. Use line breaks for readability. 3-5 hashtags at end.',
  },
  instagram: {
    name: 'Instagram',
    charLimit: 2200,
    hashtags: true,
    mentions: true,
    links: false,
    emojis: true,
    lineBreaks: true,
    description: 'Visual storytelling. Engaging caption. 10-15 hashtags. Strong call-to-action.',
  },
  facebook: {
    name: 'Facebook',
    charLimit: 63206,
    hashtags: false,
    mentions: true,
    links: true,
    emojis: true,
    lineBreaks: true,
    description: 'Conversational and community-focused. Longer format allowed. Encourage engagement.',
  },
};

export type Provider = 'anthropic' | 'openai' | 'gemini' | 'best';

export type ModelId =
  // Anthropic models
  | 'haiku' | 'sonnet' | 'opus'
  // OpenAI models
  | 'gpt4o-mini' | 'gpt4o' | 'o3-mini'
  // Gemini models
  | 'gemini-flash' | 'gemini-pro';

export interface ModelConfig {
  name: string;
  provider: Provider;
  apiId: string;
  description: string;
  supportsVision: boolean;
  supportsJson: boolean;
  speed: 'fast' | 'balanced' | 'slow';
  quality: 'good' | 'better' | 'best';
  costTier: 'low' | 'medium' | 'high';
}

export const MODEL_CONFIGS: Record<ModelId, ModelConfig> = {
  // Anthropic
  haiku: {
    name: 'Claude Haiku',
    provider: 'anthropic',
    apiId: 'claude-haiku-4-5-20251001',
    description: 'Fast & cost-effective',
    supportsVision: true,
    supportsJson: true,
    speed: 'fast',
    quality: 'good',
    costTier: 'low',
  },
  sonnet: {
    name: 'Claude Sonnet',
    provider: 'anthropic',
    apiId: 'claude-sonnet-4-5-20250929',
    description: 'Balanced quality & speed',
    supportsVision: true,
    supportsJson: true,
    speed: 'balanced',
    quality: 'better',
    costTier: 'medium',
  },
  opus: {
    name: 'Claude Opus',
    provider: 'anthropic',
    apiId: 'claude-opus-4-5',
    description: 'Highest quality output',
    supportsVision: true,
    supportsJson: true,
    speed: 'slow',
    quality: 'best',
    costTier: 'high',
  },
  // OpenAI
  'gpt4o-mini': {
    name: 'GPT-4o Mini',
    provider: 'openai',
    apiId: 'gpt-4o-mini',
    description: 'Fast & economical',
    supportsVision: true,
    supportsJson: true,
    speed: 'fast',
    quality: 'good',
    costTier: 'low',
  },
  'gpt4o': {
    name: 'GPT-4o',
    provider: 'openai',
    apiId: 'gpt-4o',
    description: 'Powerful multimodal model',
    supportsVision: true,
    supportsJson: true,
    speed: 'balanced',
    quality: 'better',
    costTier: 'medium',
  },
  'o3-mini': {
    name: 'o3 Mini',
    provider: 'openai',
    apiId: 'o3-mini',
    description: 'Reasoning specialist',
    supportsVision: false,
    supportsJson: true,
    speed: 'balanced',
    quality: 'better',
    costTier: 'medium',
  },
  // Gemini
  'gemini-flash': {
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    apiId: 'gemini-2.5-flash-preview-05-20',
    description: 'Fast experimental model',
    supportsVision: true,
    supportsJson: true,
    speed: 'fast',
    quality: 'good',
    costTier: 'low',
  },
  'gemini-pro': {
    name: 'Gemini 2.5 Pro',
    provider: 'gemini',
    apiId: 'gemini-2.5-pro-preview-05-06',
    description: 'Gemini\'s most intelligent model',
    supportsVision: true,
    supportsJson: true,
    speed: 'balanced',
    quality: 'best',
    costTier: 'medium',
  },
};

// Best Models Mode: automatically selects optimal model for each task
export interface BestModelSelection {
  textGeneration: ModelId;
  videoAnalysis: ModelId;
  imagePrompt: ModelId;
  regeneration: ModelId;
}

export function getBestModels(): BestModelSelection {
  return {
    textGeneration: 'gemini-pro',     // Best overall quality for creative writing
    videoAnalysis: 'gpt4o',           // Strong vision + reliable JSON
    imagePrompt: 'gpt4o-mini',        // Fast & good enough for prompt generation
    regeneration: 'sonnet',           // Reliable quality for single platform
  };
}

export function resolveModel(model: ModelId | 'best', task: keyof BestModelSelection): ModelId {
  if (model === 'best') {
    return getBestModels()[task];
  }
  return model;
}

// Provider metadata for UI
export const PROVIDER_CONFIGS: Record<Exclude<Provider, 'best'>, { name: string; color: string; models: ModelId[] }> = {
  anthropic: {
    name: 'Anthropic',
    color: '#D4A574',
    models: ['haiku', 'sonnet', 'opus'],
  },
  openai: {
    name: 'OpenAI',
    color: '#74A57D',
    models: ['gpt4o-mini', 'gpt4o', 'o3-mini'],
  },
  gemini: {
    name: 'Google Gemini',
    color: '#7494D4',
    models: ['gemini-flash', 'gemini-pro'],
  },
};
