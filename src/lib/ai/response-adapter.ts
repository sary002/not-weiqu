// src/lib/ai/response-adapter.ts
// 响应适配器：把 LLM 各种"自创 schema"翻译成标准 reply 结构
// 兼容：M3 用 C/R/I/A 嵌套、M3 用 acknowledge 字段、M3 完全跑偏 等

export interface CanonicalReply {
  acknowledge: string;
  name_it: string;
  need: string;
  try_this: string;
  next_step: string;
  tone: 'calm_warm' | 'calm_brief' | 'gentle_firm';
  word_count: number;
  meta: {
    should_continue: boolean;
    fallback: string | null;
    kb_refs: string[];
  };
}

const VALID_TONES = new Set(['calm_warm', 'calm_brief', 'gentle_firm']);

/** 智能适配：把 LLM 任意 JSON 翻译成标准结构 */
export function adaptReply(raw: any): CanonicalReply | null {
  if (!raw || typeof raw !== 'object') return null;

  // 形态 A：M3 标准（acknowledge/name_it/need/try_this/next_step）
  if (hasFields(raw, ['acknowledge', 'try_this'])) {
    return fromStandard(raw);
  }

  // 形态 B：M3 顶层 C/R/I/A（最常见！M3 直接返回顶层）
  if (hasFields(raw, ['C', 'R']) || (raw.C && raw.I) || (raw.C && raw.A)) {
    return fromStandard({
      acknowledge: raw.C ?? raw.acknowledge ?? raw.connect ?? '',
      name_it: raw.R ?? raw.name_it ?? raw.reflect ?? '',
      need: raw.N ?? raw.need ?? '',
      try_this: raw.I ?? raw.try_this ?? raw.invite ?? raw.suggestion ?? '',
      next_step: raw.A ?? raw.next_step ?? raw.ask ?? raw.question ?? '',
      tone: raw.tone,
      word_count: raw.word_count,
      meta: raw.meta ?? {
        should_continue: raw.action !== 'crisis_redirect',
        fallback: raw.action === 'crisis_redirect' ? 'crisis_redirect' : null,
        kb_refs: [],
      },
    });
  }

  // 形态 C：M3 嵌套 C/R/I/A（在 content 下）
  if (raw.content && typeof raw.content === 'object') {
    const c = raw.content;
    return fromStandard({
      acknowledge: c.C ?? c.acknowledge ?? c.connect ?? '',
      name_it: c.R ?? c.name_it ?? c.reflect ?? '',
      need: c.N ?? c.need ?? '',
      try_this: c.I ?? c.try_this ?? c.invite ?? '',
      next_step: c.A ?? c.next_step ?? c.ask ?? '',
      tone: c.tone ?? raw.tone,
      word_count: c.word_count ?? raw.word_count,
      meta: c.meta ?? raw.meta,
    });
  }

  // 形态 D：扁平 key（content / suggestion / question）
  if (raw.content || raw.suggestion) {
    return fromStandard({
      acknowledge: raw.acknowledge ?? raw.content ?? '',
      name_it: raw.name_it ?? raw.reflection ?? '',
      need: raw.need ?? '',
      try_this: raw.try_this ?? raw.suggestion ?? '',
      next_step: raw.next_step ?? raw.question ?? '',
      tone: raw.tone,
      word_count: raw.word_count,
      meta: raw.meta,
    });
  }

  return null;
}

function hasFields(o: any, keys: string[]): boolean {
  return keys.every((k) => k in o);
}

function fromStandard(raw: any): CanonicalReply {
  const acknowledge = String(raw.acknowledge ?? '').trim();
  const name_it = String(raw.name_it ?? '').trim();
  const need = String(raw.need ?? '').trim();
  const try_this = String(raw.try_this ?? '').trim();
  const next_step = String(raw.next_step ?? '').trim();

  let tone: 'calm_warm' | 'calm_brief' | 'gentle_firm' = 'calm_warm';
  if (raw.tone && VALID_TONES.has(raw.tone)) tone = raw.tone;

  // word_count
  const allText = [acknowledge, name_it, need, try_this, next_step].join('');
  let word_count = Number(raw.word_count) || allText.length;
  if (word_count > 150) word_count = 150;

  // meta
  const meta = raw.meta || {};
  return {
    acknowledge,
    name_it,
    need,
    try_this,
    next_step,
    tone,
    word_count,
    meta: {
      should_continue: typeof meta.should_continue === 'boolean' ? meta.should_continue : true,
      fallback: meta.fallback ?? null,
      kb_refs: Array.isArray(meta.kb_refs) ? meta.kb_refs.map(String) : [],
    },
  };
}

/** 智能适配 analyze：M3 有时返回 facts/emotions/... 嵌套、有时直接是 facts 数组 */
export function adaptAnalyze(raw: any): Record<string, any> | null {
  if (!raw || typeof raw !== 'object') return null;
  // 已经是标准结构
  if ('pattern' in raw && 'layer' in raw && 'risk' in raw) {
    return normalizeAnalyze(raw);
  }
  // 嵌套在 content 下
  if (raw.content && typeof raw.content === 'object' && 'pattern' in raw.content) {
    return normalizeAnalyze(raw.content);
  }
  return null;
}

function normalizeAnalyze(raw: any): Record<string, any> {
  return {
    facts: Array.isArray(raw.facts) ? raw.facts : [],
    emotions: Array.isArray(raw.emotions) ? raw.emotions : [],
    needs: Array.isArray(raw.needs) ? raw.needs : [],
    pattern: raw.pattern || '其他',
    layer: raw.layer || 'L1',
    risk: raw.risk || 'low',
    crisis_signals: Array.isArray(raw.crisis_signals) ? raw.crisis_signals : [],
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.5,
    note: raw.note || '',
  };
}
