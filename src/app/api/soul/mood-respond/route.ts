// src/app/api/soul/mood-respond/route.ts
// v2.0.7.6 (ADR-005 灵魂设计) 情绪回应 API
// 来自 docs/decisions/adr-005-soul-design-v2.md §P0
import { NextResponse } from 'next/server';
import { generateMoodResponse } from '@/lib/soul/soul-llm';
import { isMoodId, isPersonaId, DEFAULT_PERSONA } from '@/lib/persona';

export const runtime = 'nodejs';

interface RequestBody {
  mood?: string;
  persona?: string;
}

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', message: '请求体不是合法 JSON' },
      { status: 400 },
    );
  }

  const { mood, persona } = body;

  if (!mood || !isMoodId(mood)) {
    return NextResponse.json(
      { error: 'invalid_mood', message: `mood 必须是 low/normal/good/calm 之一，收到: ${mood}` },
      { status: 400 },
    );
  }

  const personaId = persona && isPersonaId(persona) ? persona : DEFAULT_PERSONA;

  try {
    const response = await generateMoodResponse(mood, personaId);
    return NextResponse.json({
      response,
      mood,
      persona: personaId,
    });
  } catch (e) {
    console.error('[API soul/mood-respond] failed:', (e as Error)?.message);
    return NextResponse.json(
      { error: 'internal_error', message: '生成回应失败' },
      { status: 500 },
    );
  }
}
