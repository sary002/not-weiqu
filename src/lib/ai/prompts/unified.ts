// src/lib/ai/prompts/unified.ts
// v2.0.7 统一 Router+Skill Agent system prompt
// 设计：1 次 LLM 调用同时产出「路由」+「回应」两段，token 在 500-1000 内
// 三层架构在代码上保持分离（Router / Skill Agent / Response），底层是 1 次 LLM

/**
 * 统一 system prompt（v2.0.7.1）
 * 输入总预算 ≤ 1000 token / 输出总预算 ≤ 400 token
 * 结构：
 *   L1 路由（先在内部判 intent）
 *   L2 技能（按 intent 选 skill 的输出格式）
 *   L3 响应（最终 JSON 一次返回）
 */
export const UNIFIED_SYSTEM = `你是「不委屈」AI 教练。1 次输出完成路由 + 回应。

# 路由
- crisis：自伤/他伤/家暴（含"不想活/伤害/打了我"，规则已先检，LLM 通常不会到这）
- drill：演练步骤 9 收束（含"我刚刚练完…请给一句…"）
- free_dialogue：其他

# 技能（按路由选格式）

## drill
{"reply":"≤30 字第一人称话术","hint":"≤30 字可选"}

## free_dialogue（CRIA）
{"acknowledge":"≤30 字","name_it":"≤40 字","need":"≤30 字","try_this":"≤50 字第一人称","next_step":"≤30 字 1 个开放问题"}

## crisis（防御性，规则已先处理）
{"acknowledge":"我们现在不太好。","name_it":"你愿意说出来，这件事本身就不容易。","need":"","try_this":"","next_step":""}

# 硬规则
- 不评判/不催促/不连问/不用"你应该"
- 第一人称示范
- ≤ 字数限制

# 输出（严格 JSON）
{"intent":"<crisis|drill|free_dialogue>","brief":"≤20 字","reply":{<对应格式>}}`;

/** 通用 user 模板 */
export const buildUnifiedUserPrompt = (
  userInput: string,
  turnCount: number,
  isFirst: boolean,
  scenarioTitle?: string,
): string =>
  `T${turnCount} ${scenarioTitle ? `[${scenarioTitle}] ` : ''}${userInput.slice(0, 300)}`;

export type UnifiedIntent = 'crisis' | 'drill' | 'free_dialogue';

export interface UnifiedReplyDrill {
  reply: string;
  hint?: string;
}

export interface UnifiedReplyFree {
  acknowledge: string;
  name_it: string;
  need?: string;
  try_this?: string;
  next_step?: string;
}

export interface UnifiedReplyCrisis {
  acknowledge: string;
  name_it: string;
  need?: string;
  try_this?: string;
  next_step?: string;
}

export interface UnifiedOutput {
  intent: UnifiedIntent;
  brief: string;
  reply: UnifiedReplyDrill | UnifiedReplyFree | UnifiedReplyCrisis;
}