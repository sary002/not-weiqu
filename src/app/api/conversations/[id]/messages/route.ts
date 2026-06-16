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
      turn_count?: number;
      scenario?: string;
      // v2.0.7.1 fix: 调用方可显式指定 intent（演练步骤 9 → 'drill'），跳过 Router
      intent_override?: 'crisis' | 'drill' | 'free_dialogue';
    };

    // v2.0.4 fix: 校验顺序与错误码分离——空内容 ≠ 会话不存在
    // 1) 内容不能为空 → NW-CO-0010 (400, 文案"想说的话还没打出来")
    if (body.content === undefined || body.content === null || body.content.trim() === '') {
      return jsonError('NW-CO-0010', trace_id);
    }
    // 2) 内容长度 ≤ 2000 → NW-CO-0011 (422, 文案"先说最想说的那一段")
    if (body.content.length > 2000) {
      return jsonError('NW-CO-0011', trace_id);
    }

    // v2.0.3 fix: turn_count 由前端传过来（前端从 messages state 计算）
    const turnCount = Math.max(1, body.turn_count ?? 1);

    const out = await process({
      user_id: 'demo-user',
      conversation_id: conversationId,
      user_input: body.content,
      context: {
        user_id: 'demo-user',
        conversation_id: conversationId,
        recent_messages: [],
        turn_count: turnCount,
        is_first_message: turnCount === 1,
        hour_local: new Date().getHours(),
        scenario: body.scenario,
      },
      intent_override: body.intent_override,
    });

    // 危机场景：返回 200 + action_hint，前端渲染兜底页
    if (out.analyze.risk === 'crisis') {
      return NextResponse.json({
        data: {
          crisis: true,
          analyze: out.analyze,
          reply: out.reply,
          routing: out.routing,
        },
        meta: { trace_id, server_time: new Date().toISOString() },
      });
    }

    return NextResponse.json({
      data: {
        analyze: out.analyze,
        reply: out.reply,
        kb_refs: out.kb_refs,
        routing: out.routing,
      },
      meta: { trace_id, server_time: new Date().toISOString() },
    });
  } catch (e) {
    console.error('msg:send error', e);
    return jsonError('NW-ST-0001', trace_id);
  }
}
