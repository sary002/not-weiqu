// src/lib/ai/cache.test.ts
// v2.0.7.2 Router 缓存层单元测试
import { describe, it, expect, beforeEach } from 'vitest';
import { cacheGet, cacheSet, cacheKey, cacheStats, isCacheable } from '@/lib/ai/cache';
import type { UnifiedOutput } from '@/lib/ai/prompts/unified';

const MOCK_FREE: UnifiedOutput = {
  intent: 'free_dialogue',
  brief: 'test',
  reply: { acknowledge: '听见了', name_it: '嗯' },
};
const MOCK_CRISIS: UnifiedOutput = {
  intent: 'crisis',
  brief: 'rule_crisis_hit',
  reply: { acknowledge: '我们现在不太好', name_it: '愿意说就不容易' },
};
const MOCK_DRILL: UnifiedOutput = {
  intent: 'drill',
  brief: '演练',
  reply: { reply: '今晚我有安排', hint: '' },
};

describe('Router cache', () => {
  beforeEach(() => {
    // 清空 cache
    for (let i = 0; i < 1000; i++) {
      cacheGet('') ?? null;
    }
    // 由于 cache 是 module-level Map，没法直接清。改用唯一 key 隔离
  });

  it('cacheKey 相同输入生成相同 key', () => {
    const k1 = cacheKey('你好', 1, true);
    const k2 = cacheKey('你好', 1, true);
    expect(k1).toBe(k2);
  });

  it('cacheKey turn_count 不同生成不同 key', () => {
    expect(cacheKey('你好', 1, true)).not.toBe(cacheKey('你好', 2, true));
  });

  it('cacheKey is_first 不同生成不同 key', () => {
    expect(cacheKey('你好', 1, true)).not.toBe(cacheKey('你好', 1, false));
  });

  it('set + get 命中', () => {
    const k = cacheKey('测试-命中', 1, true);
    cacheSet(k, MOCK_FREE);
    const got = cacheGet(k);
    expect(got).toEqual(MOCK_FREE);
  });

  it('未 set 返回 null', () => {
    const got = cacheGet('绝对不存在-' + Date.now());
    expect(got).toBeNull();
  });

  it('isCacheable: free_dialogue 可缓存', () => {
    expect(isCacheable(MOCK_FREE)).toBe(true);
  });

  it('isCacheable: crisis 不可缓存', () => {
    expect(isCacheable(MOCK_CRISIS)).toBe(false);
  });

  it('isCacheable: drill 不可缓存（每次要新话术）', () => {
    expect(isCacheable(MOCK_DRILL)).toBe(false);
  });

  it('stats 返回 size', () => {
    const before = cacheStats();
    const k = cacheKey('stats-test-' + Date.now(), 1, true);
    cacheSet(k, MOCK_FREE);
    const after = cacheStats();
    expect(after.size).toBe(before.size + 1);
  });
});
