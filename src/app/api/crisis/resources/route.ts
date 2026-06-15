// src/app/api/crisis/resources/route.ts
// 来自 docs/05-API-Design.md §11
// 公开只读，无鉴权
import { NextRequest, NextResponse } from 'next/server';
import { CRISIS_RESOURCES } from '@/lib/safety/crisis-detector';
import { withTrace } from '@/lib/api/middleware';

export async function GET(req: NextRequest) {
  const { trace_id } = withTrace(req);
  return NextResponse.json({
    data: CRISIS_RESOURCES,
    meta: { trace_id, server_time: new Date().toISOString() },
  });
}
