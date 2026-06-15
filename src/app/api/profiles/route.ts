// src/app/api/profiles/route.ts
// 来自 docs/05-API-Design.md §9.1
import { NextRequest, NextResponse } from 'next/server';
import { withTrace, withRateLimit } from '@/lib/api/middleware';
import { jsonError } from '@/lib/utils/error';

export async function GET(req: NextRequest) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('profile:get', 60, 60_000);
  if (!rl.ok) return rl.response;
  // 简化：返回当前用户档案（生产：取 Supabase）
  return NextResponse.json({
    data: {
      id: 'demo-user',
      display_alias: null,
      preferred_tone: 'calm_warm',
      preferred_scenario: [],
      reduced_motion: false,
      progress_disabled: false,
    },
    meta: { trace_id, server_time: new Date().toISOString() },
  });
}

export async function PATCH(req: NextRequest) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('profile:patch', 60, 60_000);
  if (!rl.ok) return rl.response;

  try {
    const body = await req.json();
    return NextResponse.json({
      data: { ...body, updated_at: new Date().toISOString() },
      meta: { trace_id, server_time: new Date().toISOString() },
    });
  } catch {
    return jsonError('NW-ST-0001', trace_id);
  }
}

export async function DELETE(req: NextRequest) {
  const { trace_id } = withTrace(req);
  return NextResponse.json(
    {
      data: { type: 'delete', status: 'pending', sla_due_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString() },
      meta: { trace_id, server_time: new Date().toISOString() },
    },
    { status: 202 },
  );
}
