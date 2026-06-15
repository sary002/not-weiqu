// src/app/api/scripts/route.ts
// 来自 docs/05-API-Design.md §9.4
import { NextRequest, NextResponse } from 'next/server';
import { withTrace, withRateLimit } from '@/lib/api/middleware';
import { jsonError } from '@/lib/utils/error';
import { uuid } from '@/lib/utils/id';

// 内存版（生产接 Supabase）
const scripts: Map<string, unknown> = new Map();

export async function POST(req: NextRequest) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('scripts:create', 60, 60_000);
  if (!rl.ok) return rl.response;
  try {
    const body = (await req.json()) as { title: string; scene_tag: string; content: string };
    if (!body.title || !body.content) return jsonError('NW-ST-0001', trace_id);
    const id = uuid();
    const item = { id, ...body, created_at: new Date().toISOString() };
    scripts.set(id, item);
    return NextResponse.json(
      { data: item, meta: { trace_id, server_time: new Date().toISOString() } },
      { status: 201 },
    );
  } catch {
    return jsonError('NW-ST-0001', trace_id);
  }
}

export async function GET(req: NextRequest) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('scripts:list', 60, 60_000);
  if (!rl.ok) return rl.response;
  return NextResponse.json({
    data: Array.from(scripts.values()),
    meta: { trace_id, server_time: new Date().toISOString() },
  });
}
