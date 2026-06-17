// src/lib/persona.ts
// v2.0.7.5 (ADR-005 灵魂设计 v2) AI 人格定义 + localStorage 工具
// 来自 docs/decisions/adr-005-soul-design-v2.md §P0
// 完整人格守则见 agents/prompt-engineer/persona.md v0.1

export type PersonaId = 'wen' | 'zhi' | 'song';

export interface Persona {
  id: PersonaId;
  name: string;
  emoji: string;
  oneLiner: string;          // 一句话特征
  tone: string;              // 语气描述
  scenario: string;          // 适配场景
  primaryColor: string;      // 主色（tailwind class）
  ringColor: string;         // ring 颜色（tailwind class）
}

export const PERSONAS: Record<PersonaId, Persona> = {
  wen: {
    id: 'wen',
    name: '温姐',
    emoji: '🌸',
    oneLiner: '我会慢慢陪你',
    tone: '温暖、包容、不急',
    scenario: '默认 / 疲惫 / 深夜 / 危机后期',
    primaryColor: 'bg-cactus-flower',
    ringColor: 'ring-cactus-flower',
  },
  zhi: {
    id: 'zhi',
    name: '智哥',
    emoji: '🧠',
    oneLiner: '我会帮你看到模式',
    tone: '清晰、有结构、克制',
    scenario: '愤怒 / 反复越界 / 想要分析',
    primaryColor: 'bg-sky-300',
    ringColor: 'ring-sky-300',
  },
  song: {
    id: 'song',
    name: '松松',
    emoji: '🌻',
    oneLiner: '咱们边聊边练',
    tone: '轻松、有趣、不重',
    scenario: '日常 / 早晨 / 周中 / 想要轻量练习',
    primaryColor: 'bg-sunny-300',
    ringColor: 'ring-sunny-300',
  },
};

// ============ Type guards（API 参数校验用）============

export function isPersonaId(v: unknown): v is PersonaId {
  return typeof v === 'string' && v in PERSONAS;
}

export function isMoodId(v: unknown): v is MoodId {
  return v === 'low' || v === 'normal' || v === 'good' || v === 'calm';
}

export const DEFAULT_PERSONA: PersonaId = 'wen';

export const PERSONA_LIST: Persona[] = Object.values(PERSONAS);

// ============ 情绪类型 ============

export type MoodId = 'low' | 'normal' | 'good' | 'calm';

export interface Mood {
  id: MoodId;
  emoji: string;
  label: string;
  aiResponse: string;        // 选完后 AI 给的回应
}

export const MOODS: Mood[] = [
  {
    id: 'low',
    emoji: '🌧',
    label: '低落',
    aiResponse: '嗯，今天有点累。进来坐坐就好，不一定非要做练习。',
  },
  {
    id: 'normal',
    emoji: '🌤',
    label: '一般',
    aiResponse: '今天是这样的日子。我们走一步看一步？',
  },
  {
    id: 'good',
    emoji: '☀️',
    label: '还不错',
    aiResponse: '听到这个我也开心了一点点。今天想练什么？',
  },
  {
    id: 'calm',
    emoji: '✨',
    label: '平静',
    aiResponse: '嗯，平静也是一种力量。今天想做什么？',
  },
];

// ============ localStorage 工具 ============

const LS_PERSONA = 'nw-persona-pref-v1';
const LS_MOOD = 'nw-mood-checkin-v1';

/** 加载人格偏好 */
export function loadPersonaPref(): PersonaId {
  if (typeof window === 'undefined') return DEFAULT_PERSONA;
  try {
    const raw = localStorage.getItem(LS_PERSONA);
    if (!raw) return DEFAULT_PERSONA;
    const parsed = JSON.parse(raw) as { current?: PersonaId };
    return parsed.current && parsed.current in PERSONAS ? parsed.current : DEFAULT_PERSONA;
  } catch {
    return DEFAULT_PERSONA;
  }
}

/** 保存人格偏好 */
export function savePersonaPref(id: PersonaId): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_PERSONA, JSON.stringify({ version: 1, current: id }));
  } catch {
    /* 静默 */
  }
}

interface MoodStorage {
  version: 1;
  lastShown: string | null;   // YYYY-MM-DD，最近一次弹情境卡的日期
  recent: Array<{ date: string; mood: MoodId }>;  // 最近 30 天
}

const MOOD_DEFAULTS: MoodStorage = { version: 1, lastShown: null, recent: [] };

/** 加载情绪记录 */
export function loadMoodStorage(): MoodStorage {
  if (typeof window === 'undefined') return MOOD_DEFAULTS;
  try {
    const raw = localStorage.getItem(LS_MOOD);
    if (!raw) return MOOD_DEFAULTS;
    return { ...MOOD_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return MOOD_DEFAULTS;
  }
}

/** 7 天内是否应弹情境卡 */
export function shouldShowMoodCheckin(): boolean {
  const data = loadMoodStorage();
  if (!data.lastShown) return true;
  const last = new Date(data.lastShown);
  const now = new Date();
  const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 7;
}

/** 记录今天弹过情境卡 */
export function markMoodCheckinShown(): void {
  if (typeof window === 'undefined') return;
  const data = loadMoodStorage();
  const today = new Date().toISOString().slice(0, 10);
  try {
    localStorage.setItem(LS_MOOD, JSON.stringify({ ...data, lastShown: today }));
  } catch {
    /* 静默 */
  }
}

/** 保存情绪选择 */
export function saveMoodChoice(mood: MoodId): void {
  if (typeof window === 'undefined') return;
  const data = loadMoodStorage();
  const today = new Date().toISOString().slice(0, 10);
  const recent = [{ date: today, mood }, ...data.recent.filter((m) => m.date !== today)].slice(0, 30);
  try {
    localStorage.setItem(LS_MOOD, JSON.stringify({ ...data, recent, lastShown: today }));
  } catch {
    /* 静默 */
  }
}

/** 根据最近 3 次情绪选择推荐人格 */
export function recommendPersona(): PersonaId {
  const data = loadMoodStorage();
  const recent = data.recent.slice(0, 3);
  if (recent.length === 0) return DEFAULT_PERSONA;

  // 连续 2 次"低落" → 推荐温姐
  const lowCount = recent.filter((m) => m.mood === 'low').length;
  if (lowCount >= 2) return 'wen';

  // 大部分"一般" → 推荐智哥（结构化）
  const normalCount = recent.filter((m) => m.mood === 'normal').length;
  if (normalCount >= 2) return 'zhi';

  // 周末 + "平静" → 推荐松松
  const calmCount = recent.filter((m) => m.mood === 'calm').length;
  const isWeekend = [0, 6].includes(new Date().getDay());
  if (isWeekend && calmCount >= 1) return 'song';

  return DEFAULT_PERSONA;
}
