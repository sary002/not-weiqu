// src/app/api/milestones/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withTrace, withRateLimit } from '@/lib/api/middleware';
import { uuid } from '@/lib/utils/id';

const milestones: unknown[] = [];

export async function POST(req: NextRequest) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('milestones:create', 60, 60_000);
  if (!rl.ok) return rl.response;
  try {
    const body = (await req.json()) as { title: string; happened_at: string };
    const item = { id: uuid(), ...body, created_at: new Date().toISOString() };
    milestones.push(item);
    return NextResponse.json(
      { data: item, meta: { trace_id, server_time: new Date().toISOString() } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: { code: 'NW-ST-0001', message: '解析失败' } },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('milestones:list', 60, 60_000);
  if (!rl.ok) return rl.response;
  return NextResponse.json({
    data: milestones,
    meta: { trace_id, server_time: new Date().toISOString() },
  });
}
