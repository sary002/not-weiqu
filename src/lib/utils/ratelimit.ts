// src/lib/utils/ratelimit.ts
// 内存限流（生产应替换为 Redis / Upstash）
// 来自 docs/05-API-Design.md §8.1

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export function rateLimit({ key, limit, windowMs }: RateLimitOptions): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const b = store.get(key);
  if (!b || b.resetAt < now) {
    const next = { count: 1, resetAt: now + windowMs };
    store.set(key, next);
    return { ok: true, remaining: limit - 1, resetAt: next.resetAt };
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0, resetAt: b.resetAt };
  }
  b.count += 1;
  return { ok: true, remaining: limit - b.count, resetAt: b.resetAt };
}
