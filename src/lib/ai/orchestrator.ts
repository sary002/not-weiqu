// src/lib/ai/orchestrator.ts
// v2.0.7.1 三层架构（代码层）+ 1 次 LLM（runtime 层）
// Router → Skill Agent → Response
// 三层职责清晰，但底层用 1 次 LLM 调用（function-calling 模式）
// 单次输入 ≤ 1000 token / 输出 ≤ 400 token / 0 次 KB 全文注入

import { makeLLM, safeJson, type LLMResponse, type LLMOptions } from './llm-client';
import { detectCrisis } from '../safety/crisis-detector';
import { uuid } from '../utils/id';
import { searchKB, type KBRef } from '../kb/search';
import { cacheGet, cacheSet, cacheKey, cacheStats, isCacheable } from './cache';
import {
  UNIFIED_SYSTEM,
  buildUnifiedUserPrompt,
  type UnifiedIntent,
  type UnifiedOutput,
  type UnifiedReplyDrill,
  type UnifiedReplyFree,
} from './prompts/unified';
import { analyzeOutputSchema, replyOutputSchema, type AnalyzeOutput, type ReplyOutput } from './schemas';
import { z } from 'zod';

// ============ 公共类型（向后兼容）============
export interface ConversationContext {
  user_id: string;
  conversation_id: string;
  recent_messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  scenario?: string;
  user_tone?: string;
  reduced_motion?: boolean;
  is_first_message?: boolean;
  turn_count?: number;
  hour_local?: number;
}

export interface ProcessInput {
  user_id: string;
  conversation_id: string;
  user_input: string;
  context: ConversationContext;
  /**
   * v2.0.7.1: 调用方显式指定意图（跳过 Router）
   * 演练步骤 9 由前端传 'drill'；危机由规则层覆盖；其他情况可省
   */
  intent_override?: 'crisis' | 'drill' | 'free_dialogue';
}

export interface ProcessOutput {
  trace_id: string;
  analyze: AnalyzeOutput;
  reply: ReplyOutput;
  kb_refs: KBRef[];
  crisis: ReturnType<typeof detectCrisis>;
  tokens: { in: number; out: number };
  routing?: {
    intent: UnifiedIntent;
    brief: string;
    skill_called: string;
    calls_used: number;
  };
}

// ============ Zod schema for unified output ============
const drillReplySchema = z.object({
  reply: z.string().min(2).max(200),
  hint: z.string().max(200).optional(),
});
const freeReplySchema = z.object({
  acknowledge: z.string().min(2).max(120),
  name_it: z.string().min(2).max(200),
  need: z.string().max(120).optional().default(''),
  try_this: z.string().max(200).optional().default(''),
  next_step: z.string().max(120).optional().default(''),
});
const crisisReplySchema = z.object({
  acknowledge: z.string().max(120),
  name_it: z.string().max(200),
  need: z.string().optional().default(''),
  try_this: z.string().optional().default(''),
  next_step: z.string().optional().default(''),
});

const unifiedOutputSchema = z.object({
  intent: z.enum(['crisis', 'drill', 'free_dialogue']),
  brief: z.string().max(60),
  reply: z.union([drillReplySchema, freeReplySchema, crisisReplySchema]),
});

// ============ L0: 规则层（0 token）============
function buildAnalyzeStub(routing: UnifiedOutput | null, ruleCrisis: ReturnType<typeof detectCrisis>): AnalyzeOutput {
  return {
    facts: routing ? [routing.brief] : [],
    emotions: [],
    needs: [],
    pattern: '其他',
    layer: 'L1',
    risk: ruleCrisis.is_crisis ? 'crisis' : 'low',
    crisis_signals: ruleCrisis.matched,
    confidence: 0.5,
    note: `v2.0.7.1 router:${routing?.intent ?? 'crisis_local'}`,
  };
}

// ============ 危机本地兜底（不调 LLM）============
function buildCrisisLocal(): UnifiedOutput {
  return {
    intent: 'crisis',
    brief: 'rule_crisis_hit',
    reply: {
      acknowledge: '我们现在不太好。',
      name_it: '你愿意说出来，这件事本身就不容易。',
      need: '',
      try_this: '',
      next_step: '',
    },
  };
}

// ============ 自由对话 fallback（不调 LLM）============
function buildFreeDialogueFallback(userInput: string, turnCount: number): UnifiedOutput {
  const turn = Math.max(1, turnCount);
  const snippet = userInput.slice(0, 20);
  const pools = [
    {
      acknowledge: '听到了。',
      name_it: snippet ? `你刚才说的「${snippet}」，我想再听一点。` : '你愿意再多说一句吗？',
    },
    {
      acknowledge: '嗯。',
      name_it: snippet ? `你刚才那句「${snippet}」——能再具体说说吗？` : '能多说一点吗？',
    },
    {
      acknowledge: '我在听。',
      name_it: snippet ? `你那句「${snippet}」，我想确认我听对了。` : '你说慢一点也行。',
    },
  ];
  const pick = pools[Math.min(turn - 1, pools.length - 1)];
  return {
    intent: 'free_dialogue',
    brief: snippet || '情绪聊天',
    reply: {
      acknowledge: pick.acknowledge,
      name_it: pick.name_it,
      need: '',
      try_this: '',
      next_step: '',
    },
  };
}

// ============ Drill fallback（不调 LLM）============
function buildDrillFallback(userInput: string): UnifiedOutput {
  // 尝试从 user_input 提取"我刚说"的内容（支持中文/英文冒号 + 引号）
  // 兼容："我刚说"今晚..."、"我刚说: ...、"我刚说：..."
  const m = userInput.match(/我刚说\s*[:：]?\s*[""'']?([^""''\n，。；]+)[""'']?/);
  const opener = m?.[1]?.trim() || '今晚有安排了。';
  return {
    intent: 'drill',
    brief: '演练T9 收束',
    reply: { reply: opener, hint: '' },
  };
}

// ============ 1 次 LLM 调用：Router + Skill 合并 ============
async function callUnified(
  input: ProcessInput,
  traceId: string,
): Promise<UnifiedOutput> {
  return callUnifiedInternal(input, undefined, traceId);
}

/**
 * v2.0.7.1: 显式 intent 跳过 Router，直接调 Skill
 * 调用方传 intent_override 时走这条路径
 */
async function callUnifiedWithIntent(
  input: ProcessInput,
  intent: 'crisis' | 'drill' | 'free_dialogue',
  traceId: string,
): Promise<UnifiedOutput> {
  return callUnifiedInternal(input, intent, traceId);
}

async function callUnifiedInternal(
  input: ProcessInput,
  preRoutedIntent: 'crisis' | 'drill' | 'free_dialogue' | undefined,
  traceId: string,
): Promise<UnifiedOutput> {
  const llm = makeLLM();
  const opts: LLMOptions = {
    prompt_id: 'NW-PE-UNIFIED-001',
    prompt_version: 'v2.0.7.1',
    json_mode: true,
    trace_id: traceId,
  };
  const userPrompt = buildUnifiedUserPrompt(
    input.user_input,
    input.context.turn_count ?? 1,
    !!input.context.is_first_message,
    input.context.scenario,
  );
  try {
    const res: LLMResponse = await llm.chat(
      [
        { role: 'system', content: UNIFIED_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      opts,
    );
    const parsed = unifiedOutputSchema.safeParse(safeJson(res.content));
    if (parsed.success) {
      // 如果 preRoutedIntent 给定但 LLM 误判，强制修正（避免 router 误分类）
      if (preRoutedIntent && parsed.data.intent !== preRoutedIntent) {
        return { ...parsed.data, intent: preRoutedIntent };
      }
      return parsed.data;
    }
    return preRoutedIntent
      ? fallbackForIntent(preRoutedIntent, input.user_input, input.context.turn_count ?? 1)
      : buildFreeDialogueFallback(input.user_input, input.context.turn_count ?? 1);
  } catch (e) {
    console.error('[Unified] LLM failed, fallback:', (e as Error)?.message);
    return preRoutedIntent
      ? fallbackForIntent(preRoutedIntent, input.user_input, input.context.turn_count ?? 1)
      : buildFreeDialogueFallback(input.user_input, input.context.turn_count ?? 1);
  }
}

function fallbackForIntent(
  intent: 'crisis' | 'drill' | 'free_dialogue',
  userInput: string,
  turnCount: number,
): UnifiedOutput {
  if (intent === 'crisis') return buildCrisisLocal();
  if (intent === 'drill') return buildDrillFallback(userInput);
  return buildFreeDialogueFallback(userInput, turnCount);
}

// ============ 2) Skill Agent 适配器（按 intent 转 ReplyOutput）============
function adaptToReplyOutput(
  unified: UnifiedOutput,
  ruleCrisis: ReturnType<typeof detectCrisis>,
): ReplyOutput {
  if (unified.intent === 'crisis') {
    const r = unified.reply as { acknowledge?: string; name_it?: string };
    return {
      acknowledge: r.acknowledge ?? '我们现在不太好。',
      name_it: r.name_it ?? '你愿意说出来，这件事本身就不容易。',
      need: '',
      try_this: '',
      next_step: '',
      tone: 'calm_warm',
      word_count: (r.acknowledge?.length ?? 0) + (r.name_it?.length ?? 0),
      meta: {
        should_continue: false,
        fallback: 'crisis_redirect',
        kb_refs: [],
        action_hint: 'show_crisis_resources',
      },
    };
  }
  if (unified.intent === 'drill') {
    const r = unified.reply as UnifiedReplyDrill;
    return {
      acknowledge: '',
      name_it: '',
      need: '',
      try_this: r.reply,
      next_step: r.hint ?? '',
      tone: 'calm_warm',
      word_count: r.reply.length,
      meta: {
        should_continue: false,
        fallback: 'skill_drill_ok',
        kb_refs: [],
      },
    };
  }
  // free_dialogue
  const r = unified.reply as UnifiedReplyFree;
  return {
    acknowledge: r.acknowledge,
    name_it: r.name_it,
    need: r.need ?? '',
    try_this: r.try_this ?? '',
    next_step: r.next_step ?? '',
    tone: 'calm_warm',
    word_count:
      (r.acknowledge?.length ?? 0) +
      (r.name_it?.length ?? 0) +
      (r.need?.length ?? 0) +
      (r.try_this?.length ?? 0) +
      (r.next_step?.length ?? 0),
    meta: {
      should_continue: !ruleCrisis.is_crisis,
      fallback: 'skill_fd_ok',
      kb_refs: [],
    },
  };
}

// ============ 3) Response 合成 + 主入口 ============
export async function process(input: ProcessInput): Promise<ProcessOutput> {
  const traceId = uuid();
  const ruleCrisis = detectCrisis(input.user_input);
  let callsUsed = 0;
  let totalIn = 0;
  let totalOut = 0;

  let unified: UnifiedOutput;

  if (ruleCrisis.is_crisis) {
    // ============ L0 规则层命中 → 不调 LLM ============
    unified = buildCrisisLocal();
  } else if (input.intent_override) {
    // ============ v2.0.7.1: 调用方显式 intent → 跳过 Router，但仍调 1 次 LLM 完成 skill ============
    callsUsed = 1;
    unified = await callUnifiedWithIntent(input, input.intent_override, traceId);
  } else {
    // ============ L1 Router + L2 Skill 合并为 1 次 LLM ============
    // v2.0.7.2: 先查 cache（5 分钟内同输入复用）
    const key = cacheKey(
      input.user_input,
      input.context.turn_count ?? 1,
      !!input.context.is_first_message,
    );
    const cached = cacheGet(key);
    if (cached && isCacheable(cached)) {
      callsUsed = 0;
      unified = cached;
    } else {
      callsUsed = 1;
      unified = await callUnified(input, traceId);
      if (isCacheable(unified)) cacheSet(key, unified);
    }
  }

  // KB 召回（仅 free_dialogue，且只在需要时）
  let kbRefs: KBRef[] = [];
  if (unified.intent === 'free_dialogue' && !ruleCrisis.is_crisis) {
    kbRefs = await searchKB({
      query: input.user_input.slice(0, 100),
      top_k: 3,
    });
  }

  // ============ L3 Response 合成 ============
  const reply = adaptToReplyOutput(unified, ruleCrisis);
  const analyze = buildAnalyzeStub(unified, ruleCrisis);

  return {
    trace_id: traceId,
    analyze,
    reply,
    kb_refs: kbRefs,
    crisis: ruleCrisis,
    tokens: { in: totalIn, out: totalOut },
    routing: {
      intent: unified.intent,
      brief: unified.brief,
      skill_called: ruleCrisis.is_crisis
        ? 'skill-crisis (local)'
        : callsUsed === 0
          ? 'cache-hit'
          : unified.intent === 'drill'
            ? 'skill-drill (llm)'
            : 'skill-free-dialogue (llm)',
      calls_used: callsUsed,
    },
  };
}