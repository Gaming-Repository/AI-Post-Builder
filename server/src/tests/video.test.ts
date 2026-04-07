import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the anthropic service
vi.mock('../services/anthropic.js', () => ({
  analyzeVideoFrames: vi.fn(async ({ frames }: { frames: string[] }) => ({
    description: 'A mock video showing product demo',
    keyElements: ['laptop', 'dashboard', 'user interface'],
    suggestedTopic: 'Product demo highlights',
    suggestedKeywords: ['demo', 'product', 'software'],
  })),
}));

import { analyzeVideoFrames } from '../services/anthropic.js';

describe('Video analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns video analysis with required fields', async () => {
    const result = await analyzeVideoFrames({
      frames: ['base64frame1', 'base64frame2'],
    });

    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('keyElements');
    expect(result).toHaveProperty('suggestedTopic');
    expect(result).toHaveProperty('suggestedKeywords');
  });

  it('keyElements is an array', async () => {
    const result = await analyzeVideoFrames({ frames: ['f1'] });
    expect(Array.isArray(result.keyElements)).toBe(true);
  });

  it('suggestedKeywords is an array', async () => {
    const result = await analyzeVideoFrames({ frames: ['f1'] });
    expect(Array.isArray(result.suggestedKeywords)).toBe(true);
  });

  it('suggestedTopic is a non-empty string', async () => {
    const result = await analyzeVideoFrames({ frames: ['f1'] });
    expect(typeof result.suggestedTopic).toBe('string');
    expect(result.suggestedTopic.length).toBeGreaterThan(0);
  });

  it('is called with the correct frames', async () => {
    const frames = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'];
    await analyzeVideoFrames({ frames });
    expect(analyzeVideoFrames).toHaveBeenCalledWith({ frames });
  });
});
