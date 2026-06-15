// src/lib/kb/search.test.ts
import { describe, it, expect } from 'vitest';
import { searchKB } from '@/lib/kb/search';

describe('RAG search', () => {
  it('职场 + boundary/time 召回相关 chunk', async () => {
    const r = await searchKB({
      query: '领导让我周末加班',
      layer: 'L3',
      pattern: '取悦',
      emotions: ['委屈', '愤怒'],
      top_k: 5,
    });
    expect(r.length).toBeGreaterThan(0);
    expect(r.some((c) => c.tags.includes('workplace/*'))).toBe(true);
  });

  it('空查询返回空', async () => {
    const r = await searchKB({ query: '' });
    expect(r).toEqual([]);
  });
});
