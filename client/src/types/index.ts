export type Platform = 'twitter' | 'linkedin' | 'instagram' | 'facebook';
export type Provider = 'anthropic' | 'openai' | 'gemini' | 'best';

// Extended ModelId includes all providers + best mode
export type ModelId =
  // Anthropic
  | 'haiku' | 'sonnet' | 'opus'
  // OpenAI
  | 'gpt4o-mini' | 'gpt4o' | 'o3-mini'
  // Gemini
  | 'gemini-flash' | 'gemini-pro'
  // Best mode auto-selection
  | 'best';

export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface PostMetadata {
  sentiment: Sentiment;
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

export interface SessionData {
  id: string;
  topic: string;
  tone: string;
  audience: string;
  keywords: string[];
  platforms: Platform[];
  model: ModelId;
  provider: Provider;
  posts: GeneratedPost[];
  timestamp: string;
  postCount: number;
}

export interface PlatformConfig {
  name: string;
  charLimit: number;
  hashtags: boolean;
  mentions: boolean;
  links: boolean;
  emojis: boolean;
  lineBreaks: boolean;
  description: string;
  color: string;
  bg: string;
}

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  twitter: {
    name: 'Twitter / X',
    charLimit: 280,
    hashtags: true,
    mentions: true,
    links: true,
    emojis: true,
    lineBreaks: false,
    description: 'Short-form microblogging',
    color: '#1DA1F2',
    bg: 'rgba(29,161,242,0.08)',
  },
  linkedin: {
    name: 'LinkedIn',
    charLimit: 3000,
    hashtags: true,
    mentions: true,
    links: true,
    emojis: false,
    lineBreaks: true,
    description: 'Professional networking',
    color: '#0A66C2',
    bg: 'rgba(10,102,194,0.08)',
  },
  instagram: {
    name: 'Instagram',
    charLimit: 2200,
    hashtags: true,
    mentions: true,
    links: false,
    emojis: true,
    lineBreaks: true,
    description: 'Visual storytelling',
    color: '#E1306C',
    bg: 'rgba(225,48,108,0.08)',
  },
  facebook: {
    name: 'Facebook',
    charLimit: 63206,
    hashtags: false,
    mentions: true,
    links: true,
    emojis: true,
    lineBreaks: true,
    description: 'Community engagement',
    color: '#1877F2',
    bg: 'rgba(24,119,242,0.08)',
  },
};

export interface ModelConfig {
  name: string;
  provider: Provider;
  description: string;
  speed: 'fast' | 'balanced' | 'slow';
  quality: 'good' | 'better' | 'best';
  costTier: 'low' | 'medium' | 'high';
  color: string;
}

export const MODEL_CONFIGS: Record<ModelId, ModelConfig> = {
  // Anthropic
  haiku: {
    name: 'Haiku',
    provider: 'anthropic',
    description: 'Fast · Cost-effective',
    speed: 'fast',
    quality: 'good',
    costTier: 'low',
    color: '#D4A574',
  },
  sonnet: {
    name: 'Sonnet',
    provider: 'anthropic',
    description: 'Balanced · Default',
    speed: 'balanced',
    quality: 'better',
    costTier: 'medium',
    color: '#D4A574',
  },
  opus: {
    name: 'Opus',
    provider: 'anthropic',
    description: 'Highest quality',
    speed: 'slow',
    quality: 'best',
    costTier: 'high',
    color: '#D4A574',
  },
  // OpenAI
  'gpt4o-mini': {
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Fast · Economical',
    speed: 'fast',
    quality: 'good',
    costTier: 'low',
    color: '#74A57D',
  },
  'gpt4o': {
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Powerful · Multimodal',
    speed: 'balanced',
    quality: 'better',
    costTier: 'medium',
    color: '#74A57D',
  },
  'o3-mini': {
    name: 'o3 Mini',
    provider: 'openai',
    description: 'Reasoning specialist',
    speed: 'balanced',
    quality: 'better',
    costTier: 'medium',
    color: '#74A57D',
  },
  // Gemini
  'gemini-flash': {
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    description: 'Fast · Experimental',
    speed: 'fast',
    quality: 'good',
    costTier: 'low',
    color: '#7494D4',
  },
  'gemini-pro': {
    name: 'Gemini 2.5 Pro',
    provider: 'gemini',
    description: 'Most intelligent',
    speed: 'balanced',
    quality: 'best',
    costTier: 'medium',
    color: '#7494D4',
  },
  // Best Mode
  best: {
    name: 'Best Models Mode',
    provider: 'best',
    description: 'Auto-select optimal AI for each task',
    speed: 'balanced',
    quality: 'best',
    costTier: 'medium',
    color: '#7c6af0',
  },
};

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
