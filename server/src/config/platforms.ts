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

export type ModelId = 'haiku' | 'sonnet' | 'opus';

export interface ModelConfig {
  name: string;
  apiId: string;
  description: string;
}

export const MODEL_CONFIGS: Record<ModelId, ModelConfig> = {
  haiku: {
    name: 'Claude Haiku',
    apiId: 'claude-haiku-4-5-20251001',
    description: 'Fast & cost-effective',
  },
  sonnet: {
    name: 'Claude Sonnet',
    apiId: 'claude-sonnet-4-5-20250929',
    description: 'Balanced quality & speed',
  },
  opus: {
    name: 'Claude Opus',
    apiId: 'claude-opus-4-5',
    description: 'Highest quality output',
  },
};
