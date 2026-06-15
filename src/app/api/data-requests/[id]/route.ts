// src/app/api/data-requests/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withTrace, withRateLimit } from '@/lib/api/middleware';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('data:status', 60, 60_000);
  if (!rl.ok) return rl.response;
  const { id } = await params;
  return NextResponse.json({
    data: {
      id,
      status: 'pending',
      requested_at: new Date().toISOString(),
      sla_due_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    },
    meta: { trace_id, server_time: new Date().toISOString() },
  });
}
