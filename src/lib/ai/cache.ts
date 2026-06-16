// src/lib/ai/cache.ts
// v2.0.7.2 Router 缓存层
// 设计：5 分钟 TTL，同 input 复用 unified 输出
// 不缓存 crisis（每次必走真实路径）
// 不缓存 drill（演练步骤 9 每次都是新的话术，不应复用）

import { createHash } from 'crypto';
import type { UnifiedOutput } from './prompts/unified';

interface CacheEntry {
  value: UnifiedOutput;
  expiresAt: number;
}

const CACHE = new Map<string, CacheEntry>();

/** TTL 默认 5 分钟（300_000 ms），可被 env 覆盖 */
const TTL_MS = Number(process.env.ROUTER_CACHE_TTL ?? 5 * 60 * 1000);

/** 最大容量 500 条，防内存泄漏 */
const MAX_SIZE = 500;

/** 计算缓存 key（仅 user_input + turn_count） */
export function cacheKey(userInput: string, turnCount: number, isFirst: boolean): string {
  return createHash('sha256')
    .update(`${turnCount}|${isFirst ? 1 : 0}|${userInput}`)
    .digest('hex')
    .slice(0, 16);
}

/** 检查是否可缓存：crisis 永不入缓存（必须实跑） */
export function isCacheable(unified: UnifiedOutput): boolean {
  return unified.intent !== 'crisis' && unified.intent !== 'drill';
}

/** 读 */
export function cacheGet(key: string): UnifiedOutput | null {
  const entry = CACHE.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    CACHE.delete(key);
    return null;
  }
  return entry.value;
}

/** 写（含 LRU 容量保护） */
export function cacheSet(key: string, value: UnifiedOutput): void {
  // 容量满：清理过期 → 再清理最旧
  if (CACHE.size >= MAX_SIZE) {
    const now = Date.now();
    for (const [k, e] of CACHE.entries()) {
      if (e.expiresAt < now) CACHE.delete(k);
    }
    if (CACHE.size >= MAX_SIZE) {
      // FIFO 删最旧
      const firstKey = CACHE.keys().next().value;
      if (firstKey) CACHE.delete(firstKey);
    }
  }
  CACHE.set(key, { value, expiresAt: Date.now() + TTL_MS });
}

/** 统计：用于埋点（命中率） */
export function cacheStats(): { size: number; ttlMs: number } {
  return { size: CACHE.size, ttlMs: TTL_MS };
}
