// src/lib/api/middleware.ts
// 通用 API 中间件：trace_id、限流、鉴权
import { NextRequest } from 'next/server';
import { uuid } from '../utils/id';
import { rateLimit } from '../utils/ratelimit';
import { jsonError, type ApiErrorCode } from '../utils/error';

export function withTrace(req: NextRequest): { trace_id: string } {
  const trace_id = req.headers.get('x-trace-id') || uuid();
  return { trace_id };
}

export function withRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; response: Response } {
  const r = rateLimit({ key, limit, windowMs });
  if (!r.ok) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error: {
            code: 'NW-AU-0002',
            message: '请求太频繁',
            user_message: '慢一点，再试。',
            trace_id: '',
          },
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      ),
    };
  }
  return { ok: true };
}

export function getUserIdFromRequest(req: NextRequest): string | null {
  // 简化：从 Authorization / cookie 取；生产接 Supabase Auth
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export function requireUser(userId: string | null, trace_id: string): Response | null {
  if (!userId) return jsonError('NW-AU-0001', trace_id);
  return null;
}
