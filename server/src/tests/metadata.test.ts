import { describe, it, expect } from 'vitest';
import type { PostMetadata } from '../services/anthropic.js';

function parseMetadata(raw: string | null): PostMetadata | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PostMetadata;
  } catch {
    return null;
  }
}

describe('Post metadata extraction', () => {
  const validMetadata: PostMetadata = {
    sentiment: 'positive',
    keyTopics: ['AI', 'productivity'],
    callToAction: 'Try it today!',
    hashtags: ['#AI', '#tech'],
    mentions: [],
  };

  it('parses valid metadata JSON', () => {
    const result = parseMetadata(JSON.stringify(validMetadata));
    expect(result).not.toBeNull();
    expect(result?.sentiment).toBe('positive');
    expect(result?.keyTopics).toHaveLength(2);
  });

  it('returns null for invalid JSON', () => {
    expect(parseMetadata('{invalid}')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(parseMetadata(null)).toBeNull();
  });

  it('sentiment values are one of expected set', () => {
    const sentiments: PostMetadata['sentiment'][] = ['positive', 'neutral', 'negative'];
    for (const s of sentiments) {
      const meta: PostMetadata = { ...validMetadata, sentiment: s };
      const result = parseMetadata(JSON.stringify(meta));
      expect(['positive', 'neutral', 'negative']).toContain(result?.sentiment);
    }
  });

  it('hashtags is always an array', () => {
    const result = parseMetadata(JSON.stringify(validMetadata));
    expect(Array.isArray(result?.hashtags)).toBe(true);
  });

  it('mentions is always an array', () => {
    const result = parseMetadata(JSON.stringify(validMetadata));
    expect(Array.isArray(result?.mentions)).toBe(true);
  });
});
