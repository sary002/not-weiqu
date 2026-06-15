// src/lib/ai/orchestrator.ts
// AI 编排器：analyze → reply → RAG → 兜底
// 来自 docs/03-System-Architecture.md §6

import { makeLLM, type LLMResponse, type LLMOptions, safeJson as importedSafeJson } from './llm-client';
import { ANALYZE_SYSTEM } from './prompts/analyze';
import { REPLY_SYSTEM } from './prompts/reply';
import { detectCrisis } from '../safety/crisis-detector';
import { uuid } from '../utils/id';
import { searchKB, type KBRef } from '../kb/search';
import { analyzeOutputSchema, replyOutputSchema, type AnalyzeOutput, type ReplyOutput } from './schemas';
import { adaptReply, adaptAnalyze } from './response-adapter';

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
}

export interface ProcessOutput {
  trace_id: string;
  analyze: AnalyzeOutput;
  reply: ReplyOutput;
  kb_refs: KBRef[];
  crisis: ReturnType<typeof detectCrisis>;
  tokens: { in: number; out: number };
}

/** 编排主流程：analyze → crisis check → RAG → reply */
export async function process(input: ProcessInput): Promise<ProcessOutput> {
  const trace_id = uuid();
  const llm = makeLLM();

  // 1. analyze（含规则层危机检测）
  const ruleCrisis = detectCrisis(input.user_input);
  const analyzeResult = await runAnalyze(llm, input, trace_id, ruleCrisis);

  // 2. 若 rule 已检测到 crisis，强制升级（不依赖 LLM）
  if (ruleCrisis.is_crisis) {
    analyzeResult.risk = 'crisis';
    analyzeResult.crisis_signals = ruleCrisis.matched;
  }

  // 3. RAG（仅非危机时召回，crisis 禁召）
  let kb_refs: KBRef[] = [];
  if (analyzeResult.risk !== 'crisis') {
    kb_refs = await searchKB({
      query: input.user_input,
      layer: analyzeResult.layer,
      pattern: analyzeResult.pattern,
      emotions: analyzeResult.emotions,
      top_k: 5,
    });
  }

  // 4. reply
  const replyResult = await runReply(llm, input, analyzeResult, kb_refs, trace_id);

  return {
    trace_id,
    analyze: analyzeResult,
    reply: replyResult,
    kb_refs,
    crisis: ruleCrisis,
    tokens: { in: input.user_input.length, out: 0 },
  };
}

async function runAnalyze(
  llm: ReturnType<typeof makeLLM>,
  input: ProcessInput,
  trace_id: string,
  ruleCrisis: ReturnType<typeof detectCrisis>,
): Promise<AnalyzeOutput> {
  const opts: LLMOptions = {
    prompt_id: 'NW-PE-ANALYZE-001',
    prompt_version: 'v1.0',
    json_mode: true,
    trace_id,
  };
  let res: LLMResponse;
  try {
    res = await llm.chat(
      [
        { role: 'system', content: ANALYZE_SYSTEM },
        // 用更直白的人类语言而不是 JSON，避免 API 拒绝
        { role: 'user', content:
          `用户输入：${input.user_input}\n\n` +
          `上下文：turn=${input.context.turn_count ?? 1}，hour=${input.context.hour_local ?? 'unknown'}\n\n` +
          `规则检测：${ruleCrisis.is_crisis ? '危机信号命中' : '无危机信号'}\n\n` +
          `请输出严格 JSON。`
        },
      ],
      opts,
    );
  } catch (e: any) {
    console.error('[Orchestrator] analyze LLM failed, using rule-based fallback:', e?.message ?? e);
    return ruleBasedAnalyze(input.user_input, ruleCrisis);
  }
  const parsed = analyzeOutputSchema.safeParse(safeJson(res.content));
  if (!parsed.success) {
    // 尝试智能适配
    const adapted = adaptAnalyze(safeJson(res.content));
    if (adapted) {
      const reParsed = analyzeOutputSchema.safeParse(adapted);
      if (reParsed.success) return reParsed.data;
    }
    return ruleBasedAnalyze(input.user_input, ruleCrisis);
  }
  return parsed.data;
}

async function runReply(
  llm: ReturnType<typeof makeLLM>,
  input: ProcessInput,
  analyze: AnalyzeOutput,
  kb_refs: KBRef[],
  trace_id: string,
): Promise<ReplyOutput> {
  if (analyze.risk === 'crisis') {
    return {
      acknowledge: '',
      name_it: '',
      need: '',
      try_this: '',
      next_step: '',
      tone: 'calm_warm',
      word_count: 0,
      meta: { should_continue: false, fallback: 'crisis_redirect', kb_refs: [] },
    };
  }

  const opts: LLMOptions = {
    prompt_id: 'NW-PE-REPLY-001',
    prompt_version: 'v1.0',
    json_mode: true,
    trace_id,
  };
  let res: LLMResponse;
  try {
    res = await llm.chat(
      [
        { role: 'system', content: REPLY_SYSTEM },
        {
          role: 'user',
          content: JSON.stringify({
            analyze,
            context: input.context,
            kb_refs,
          }),
        },
      ],
      opts,
    );
  } catch (e: any) {
    console.error('[Orchestrator] reply LLM failed, returning calm fallback:', e?.message ?? e);
    return {
      acknowledge: '我在这。',
      name_it: '我听到你了。',
      need: '',
      try_this: '',
      next_step: '想从哪开始都行。',
      tone: 'calm_warm',
      word_count: 24,
      meta: { should_continue: true, fallback: 'model_timeout', kb_refs: [] },
    };
  }
  const parsed = replyOutputSchema.safeParse(safeJson(res.content));
  if (!parsed.success) {
    // 智能适配：把 LLM 自创的 schema 翻译成我们的
    const adapted = adaptReply(safeJson(res.content));
    if (adapted) {
      const reParsed = replyOutputSchema.safeParse(adapted);
      if (reParsed.success) return reParsed.data;
    }
    return {
      acknowledge: '我在这。',
      name_it: '我听到你了。',
      need: '',
      try_this: '',
      next_step: '想从哪开始都行。',
      tone: 'calm_warm',
      word_count: 24,
      meta: { should_continue: true, fallback: 'model_timeout', kb_refs: [] },
    };
  }
  return parsed.data;
}

/** 规则兜底 analyze（无 LLM 时使用） */
function ruleBasedAnalyze(input: string, ruleCrisis: ReturnType<typeof detectCrisis>): AnalyzeOutput {
  if (ruleCrisis.is_crisis) {
    return {
      facts: ['用户表达危机信号'],
      emotions: ['绝望', '无力'],
      needs: ['安全感', '被接住'],
      pattern: '危机',
      layer: 'L4',
      risk: 'crisis',
      crisis_signals: ruleCrisis.matched,
      confidence: 0.9,
      note: '规则兜底：危机信号命中',
    };
  }
  if (/又让我|又要我|又让我帮|甩活|加班|催/.test(input)) {
    return {
      facts: ['用户被请求 / 越界'],
      emotions: ['委屈', '内疚'],
      needs: ['被尊重的时间', '拒绝的空间'],
      pattern: '取悦',
      layer: 'L3',
      risk: 'low',
      crisis_signals: [],
      confidence: 0.8,
      note: '规则兜底：取悦模式',
    };
  }
  return {
    facts: [],
    emotions: ['unknown'],
    needs: ['unknown'],
    pattern: '其他',
    layer: 'L1',
    risk: 'low',
    crisis_signals: [],
    confidence: 0.4,
    note: '规则兜底：输入不明确',
  };
}

function safeJson(text: string): unknown {
  // 重导出：使用 llm-client 中的智能版本（剥 <think> + markdown + 找首个 {）
  return importedSafeJson(text);
}

// 保留同名校验：避免开发误用旧版
function _ensureSafeJsonImported() {
  if (typeof importedSafeJson !== 'function') throw new Error('safeJson import missing');
}
_ensureSafeJsonImported();
