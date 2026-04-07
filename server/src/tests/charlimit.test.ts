import { describe, it, expect } from 'vitest';
import { PLATFORM_CONFIGS } from '../config/platforms.js';
import type { Platform } from '../db/schema.js';

function isWithinLimit(content: string, platform: Platform): boolean {
  return content.length <= PLATFORM_CONFIGS[platform].charLimit;
}

function truncateToLimit(content: string, platform: Platform): string {
  const limit = PLATFORM_CONFIGS[platform].charLimit;
  return content.length <= limit ? content : content.slice(0, limit);
}

describe('Character limit enforcement', () => {
  it('twitter: 280 chars passes', () => {
    expect(isWithinLimit('a'.repeat(280), 'twitter')).toBe(true);
  });

  it('twitter: 281 chars fails', () => {
    expect(isWithinLimit('a'.repeat(281), 'twitter')).toBe(false);
  });

  it('linkedin: 3000 chars passes', () => {
    expect(isWithinLimit('a'.repeat(3000), 'linkedin')).toBe(true);
  });

  it('linkedin: 3001 chars fails', () => {
    expect(isWithinLimit('a'.repeat(3001), 'linkedin')).toBe(false);
  });

  it('instagram: 2200 chars passes', () => {
    expect(isWithinLimit('a'.repeat(2200), 'instagram')).toBe(true);
  });

  it('facebook: 63206 chars passes', () => {
    expect(isWithinLimit('a'.repeat(63206), 'facebook')).toBe(true);
  });

  it('truncation respects platform limit', () => {
    const long = 'x'.repeat(500);
    const truncated = truncateToLimit(long, 'twitter');
    expect(truncated.length).toBe(280);
    expect(isWithinLimit(truncated, 'twitter')).toBe(true);
  });

  it('empty string is within all limits', () => {
    const platforms: Platform[] = ['twitter', 'linkedin', 'instagram', 'facebook'];
    for (const p of platforms) {
      expect(isWithinLimit('', p)).toBe(true);
    }
  });
});
