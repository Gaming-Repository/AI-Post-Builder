export type Platform = 'twitter' | 'linkedin' | 'instagram' | 'facebook';
export type ModelId = 'haiku' | 'sonnet' | 'opus';
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

export const MODEL_CONFIGS: Record<ModelId, { name: string; description: string }> = {
  haiku: { name: 'Haiku', description: 'Fast · Cost-effective' },
  sonnet: { name: 'Sonnet', description: 'Balanced · Default' },
  opus: { name: 'Opus', description: 'Highest quality' },
};
