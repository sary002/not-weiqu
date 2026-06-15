// src/app/api/progress/route.ts
// 来自 docs/05-API-Design.md §9.5
import { NextRequest, NextResponse } from 'next/server';
import { withTrace, withRateLimit } from '@/lib/api/middleware';

const BUCKETS = ['said_no', 'no_apology', 'set_boundary', 'named_need', 'paused_drill'];

export async function GET(req: NextRequest) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('progress:get', 60, 60_000);
  if (!rl.ok) return rl.response;
  return NextResponse.json({
    data: {
      buckets: BUCKETS.map((b) => ({ bucket: b, count: 0, last_at: null })),
      progress_disabled: false,
    },
    meta: { trace_id, server_time: new Date().toISOString() },
  });
}

export async function POST(req: NextRequest) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('progress:inc', 60, 60_000);
  if (!rl.ok) return rl.response;
  try {
    const body = (await req.json()) as { bucket: string; count?: number; happened_at?: string };
    return NextResponse.json({
      data: { bucket: body.bucket, count: body.count ?? 1, last_at: new Date().toISOString() },
      meta: { trace_id, server_time: new Date().toISOString() },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'NW-ST-0001', message: '解析失败' } },
      { status: 500 },
    );
  }
}
