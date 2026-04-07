import { describe, it, expect } from 'vitest';
import { PLATFORM_CONFIGS, MODEL_CONFIGS } from '../config/platforms.js';

describe('Platform configurations', () => {
  const platforms = ['twitter', 'linkedin', 'instagram', 'facebook'] as const;

  it('defines all four platforms', () => {
    for (const p of platforms) {
      expect(PLATFORM_CONFIGS[p]).toBeDefined();
    }
  });

  it('has correct character limits', () => {
    expect(PLATFORM_CONFIGS.twitter.charLimit).toBe(280);
    expect(PLATFORM_CONFIGS.linkedin.charLimit).toBe(3000);
    expect(PLATFORM_CONFIGS.instagram.charLimit).toBe(2200);
    expect(PLATFORM_CONFIGS.facebook.charLimit).toBe(63206);
  });

  it('has required fields on every platform config', () => {
    for (const p of platforms) {
      const cfg = PLATFORM_CONFIGS[p];
      expect(typeof cfg.name).toBe('string');
      expect(typeof cfg.charLimit).toBe('number');
      expect(typeof cfg.hashtags).toBe('boolean');
      expect(typeof cfg.mentions).toBe('boolean');
      expect(typeof cfg.links).toBe('boolean');
      expect(typeof cfg.emojis).toBe('boolean');
      expect(typeof cfg.lineBreaks).toBe('boolean');
      expect(typeof cfg.description).toBe('string');
    }
  });

  it('twitter has correct feature flags', () => {
    const tw = PLATFORM_CONFIGS.twitter;
    expect(tw.hashtags).toBe(true);
    expect(tw.mentions).toBe(true);
    expect(tw.emojis).toBe(true);
    expect(tw.lineBreaks).toBe(false);
  });

  it('instagram does not allow links', () => {
    expect(PLATFORM_CONFIGS.instagram.links).toBe(false);
  });
});

describe('Model configurations', () => {
  const models = ['haiku', 'sonnet', 'opus'] as const;

  it('defines all three models', () => {
    for (const m of models) {
      expect(MODEL_CONFIGS[m]).toBeDefined();
    }
  });

  it('each model has apiId, name, description', () => {
    for (const m of models) {
      const cfg = MODEL_CONFIGS[m];
      expect(typeof cfg.apiId).toBe('string');
      expect(cfg.apiId.length).toBeGreaterThan(0);
      expect(typeof cfg.name).toBe('string');
      expect(typeof cfg.description).toBe('string');
    }
  });
});
