// src/app/api/data-requests/route.ts
// 来自 docs/05-API-Design.md §9.6
import { NextRequest, NextResponse } from 'next/server';
import { withTrace, withRateLimit } from '@/lib/api/middleware';
import { uuid } from '@/lib/utils/id';

export async function POST(req: NextRequest) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('data:request', 2, 24 * 3600 * 1000); // 每天 2 次
  if (!rl.ok) return rl.response;
  try {
    const body = (await req.json()) as { type: 'export' | 'delete' };
    const id = uuid();
    const item = {
      id,
      type: body.type,
      status: 'pending',
      requested_at: new Date().toISOString(),
      sla_due_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    };
    return NextResponse.json(
      { data: item, meta: { trace_id, server_time: new Date().toISOString() } },
      { status: 202 },
    );
  } catch {
    return NextResponse.json(
      { error: { code: 'NW-ST-0001', message: '解析失败' } },
      { status: 500 },
    );
  }
}
