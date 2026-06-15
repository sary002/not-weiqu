// src/app/api/scripts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withTrace, withRateLimit } from '@/lib/api/middleware';
import { jsonError } from '@/lib/utils/error';

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
    return NextResponse.json({
      data: { id, ...body, updated_at: new Date().toISOString() },
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
  return new Response(null, { status: 204 });
}
