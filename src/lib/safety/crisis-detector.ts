// src/lib/safety/crisis-detector.ts
// 危机检测器（规则 + 关键词）
// 来自 prompts/analyze.md §4 危机信号识别 + docs/05-API-Design.md §11
// 与 rules/safety.md §S-2 危机响应 对齐

import type { CrisisSeverity, CrisisType } from '../supabase/types';

interface CrisisMatch {
  type: CrisisType;
  severity: CrisisSeverity;
  matched: string[];
}

const RULES: Array<{ type: CrisisType; severity: CrisisSeverity; patterns: RegExp[] }> = [
  {
    type: 'self_harm',
    severity: 'high',
    patterns: [
      /不想活/,
      /不想活了/,
      /想消失/,
      /想死/,
      /自杀/,
      /自残/,
      /撑不下去/,
      /活不下去/,
      /轻生/,
      /了结(自己|此生|生命)/,
    ],
  },
  {
    type: 'harm_others',
    severity: 'high',
    patterns: [
      /想杀(了)?(他|她|你|对方|他们|她们|人)/,
      /想伤害/,
      /想弄死/,
      /要他的命/,
      /想弄死他/,
    ],
  },
  {
    type: 'violence',
    severity: 'high',
    patterns: [
      /他打了我/,
      /她打了我/,
      /家暴/,
      /被跟踪/,
      /被监控/,
      /被跟踪骚扰/,
    ],
  },
  {
    type: 'minor',
    severity: 'high',
    patterns: [
      /我.{0,6}(13|14|15|16|17)\s*岁/,
      /未成年人/,
      /我是小孩/,
      /我还是个孩子/,
    ],
  },
  {
    type: 'perinatal',
    severity: 'med',
    patterns: [
      /怀孕.{0,8}想死/,
      /产后.{0,8}崩溃/,
      /月子.{0,8}抑郁/,
    ],
  },
  {
    type: 'acute_distress',
    severity: 'med',
    patterns: [
      /天天哭.{0,8}停不下来/,
      /一周.{0,4}都睡不好/,
      /惊恐发作/,
      /喘不过气/,
      /胸口发紧.{0,4}(好几天|一周)/,
    ],
  },
];

export interface CrisisDetection {
  is_crisis: boolean;
  severity: CrisisSeverity;
  types: CrisisType[];
  matched: string[];
  detected_by: 'rule' | 'model' | 'hybrid';
}

export function detectCrisis(input: string): CrisisDetection {
  if (!input) {
    return { is_crisis: false, severity: 'low', types: [], matched: [], detected_by: 'rule' };
  }
  const matches: CrisisMatch[] = [];
  for (const rule of RULES) {
    const hit = rule.patterns.filter((p) => p.test(input));
    if (hit.length) {
      matches.push({ type: rule.type, severity: rule.severity, matched: hit.map((p) => p.source) });
    }
  }
  if (matches.length === 0) {
    return { is_crisis: false, severity: 'low', types: [], matched: [], detected_by: 'rule' };
  }
  // 取最高严重度
  const severity: CrisisSeverity = matches.some((m) => m.severity === 'high')
    ? 'high'
    : matches.some((m) => m.severity === 'med')
      ? 'med'
      : 'low';
  const types = Array.from(new Set(matches.map((m) => m.type)));
  const matched = Array.from(new Set(matches.flatMap((m) => m.matched)));
  return { is_crisis: true, severity, types, matched, detected_by: 'rule' };
}

/** 危机兜底资源（公开只读） */
export const CRISIS_RESOURCES = [
  {
    name: '北京心理危机研究与干预中心',
    phone: process.env.NEXT_PUBLIC_CRISIS_HOTLINE_BJ || '010-82951332',
    available: '24 小时',
  },
  {
    name: '全国心理援助热线',
    phone: '400-161-9995',
    available: '24 小时',
  },
] as const;
