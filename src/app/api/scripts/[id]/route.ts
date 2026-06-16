// src/app/api/scripts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withTrace, withRateLimit } from '@/lib/api/middleware';
import { jsonError } from '@/lib/utils/error';
import { scriptsStore } from '@/lib/scripts-store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('scripts:get', 60, 60_000);
  if (!rl.ok) return rl.response;
  const { id } = await params;
  const item = scriptsStore.get(id);
  if (!item) return jsonError('NW-ST-0002', trace_id, 404);
  return NextResponse.json({
    data: item,
    meta: { trace_id, server_time: new Date().toISOString() },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('scripts:patch', 60, 60_000);
  if (!rl.ok) return rl.response;
  const { id } = await params;
  try {
    const body = await req.json();
    const existing = scriptsStore.get(id) as Record<string, unknown> | undefined;
    const item = { ...(existing ?? {}), ...body, id, updated_at: new Date().toISOString() };
    scriptsStore.set(id, item);
    return NextResponse.json({
      data: item,
      meta: { trace_id, server_time: new Date().toISOString() },
    });
  } catch {
    return jsonError('NW-ST-0001', trace_id);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { trace_id } = withTrace(_req);
  const { id } = await params;
  scriptsStore.delete(id);
  return new Response(null, { status: 204 });
}
