// src/lib/ai/prompts/skill-crisis.ts
// v2.0.7 Skill Agent — crisis (危机话术)
// ~200 tokens：纯本地，无 LLM 调用

import type { RouterOutput } from './router';
import type { SkillFreeDialogueOutput } from './skill-free-dialogue';

/**
 * 危机话术：纯本地模板，不调 LLM
 * 输入：检测到的危机信号列表
 * 输出：固定安全话术 + 转介资源
 */
export interface SkillCrisisOutput extends SkillFreeDialogueOutput {
  crisis_resources: Array<{ kind: string; label: string; value: string }>;
  action_hint: 'show_crisis_resources';
}

const CRISIS_RESOURCES = [
  { kind: 'hotline', label: '24 小时心理援助热线', value: '010-82951332' },
  { kind: 'hotline_name', label: '热线', value: '北京心理危机研究与干预中心' },
  { kind: 'suggestion', label: '建议', value: '拨打热线 / 联系你信任的人 / 就近医院精神科' },
];

export function buildCrisisResponse(brief: string): SkillCrisisOutput {
  return {
    acknowledge: '我们现在不太好。',
    name_it: '你愿意说出来，这件事本身就不容易。',
    need: '',
    try_this: '',
    next_step: '',
    crisis_resources: CRISIS_RESOURCES,
    action_hint: 'show_crisis_resources',
  };
}

// 类型守卫
export function isCrisisIntent(o: RouterOutput): o is RouterOutput {
  return o.intent === 'crisis';
}