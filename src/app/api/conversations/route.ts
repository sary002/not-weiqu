// src/app/api/conversations/route.ts
// 来自 docs/05-API-Design.md §9.2
import { NextRequest, NextResponse } from 'next/server';
import { withTrace, withRateLimit } from '@/lib/api/middleware';
import { jsonError } from '@/lib/utils/error';
import { uuid } from '@/lib/utils/id';

export async function POST(req: NextRequest) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('conv:create', 60, 60_000);
  if (!rl.ok) return rl.response;

  try {
    const body = (await req.json()) as { scenario_id?: string; type?: 'free' | 'drill' };
    const id = uuid();
    return NextResponse.json(
      {
        data: {
          id,
          user_id: 'demo-user',
          scenario_id: body.scenario_id ?? null,
          type: body.type ?? 'free',
          status: 'active',
          started_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        },
        meta: { trace_id, server_time: new Date().toISOString() },
      },
      { status: 201 },
    );
  } catch {
    return jsonError('NW-ST-0001', trace_id);
  }
}

export async function GET(req: NextRequest) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('conv:list', 60, 60_000);
  if (!rl.ok) return rl.response;

  return NextResponse.json({
    data: [],
    meta: { trace_id, server_time: new Date().toISOString(), next_cursor: null },
  });
}
