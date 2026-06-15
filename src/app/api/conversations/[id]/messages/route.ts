// src/app/api/conversations/[id]/messages/route.ts
// 来自 docs/05-API-Design.md §10.1（流式 SSE 占位 + 普通 JSON）
import { NextRequest, NextResponse } from 'next/server';
import { withTrace, withRateLimit } from '@/lib/api/middleware';
import { jsonError } from '@/lib/utils/error';
import { process } from '@/lib/ai/orchestrator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('msg:send', 20, 60_000);
  if (!rl.ok) return rl.response;

  const { id: conversationId } = await params;

  try {
    const body = (await req.json()) as {
      content: string;
      client_msg_id?: string;
    };
    if (!body.content || body.content.length > 2000) {
      return jsonError('NW-CO-0001', trace_id);
    }

    const out = await process({
      user_id: 'demo-user',
      conversation_id: conversationId,
      user_input: body.content,
      context: {
        user_id: 'demo-user',
        conversation_id: conversationId,
        recent_messages: [],
        turn_count: 1,
        is_first_message: true,
      },
    });

    // 危机场景：返回 200 + action_hint，前端渲染兜底页
    if (out.analyze.risk === 'crisis') {
      return NextResponse.json({
        data: {
          crisis: true,
          analyze: out.analyze,
          reply: out.reply,
        },
        meta: { trace_id, server_time: new Date().toISOString() },
      });
    }

    return NextResponse.json({
      data: {
        analyze: out.analyze,
        reply: out.reply,
        kb_refs: out.kb_refs,
      },
      meta: { trace_id, server_time: new Date().toISOString() },
    });
  } catch (e) {
    console.error('msg:send error', e);
    return jsonError('NW-ST-0001', trace_id);
  }
}
