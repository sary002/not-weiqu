// src/lib/scenarios-data.ts
// 与 API 端 /scenarios 同步
export interface Scenario {
  code: string;
  title: string;
  one_liner: string;
  layer: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  scene_tags: string[];
  difficulty: number;
}

export const scenarios: Scenario[] = [
  { code: 'workplace-overtime', title: '同事让我加班到很晚', one_liner: '你可以说一句："今晚有安排了。"', layer: 'L3', scene_tags: ['workplace','加班'], difficulty: 2 },
  { code: 'workplace-shifting', title: '同事下班前甩活', one_liner: '你可以说："我自己的活还没收尾。"', layer: 'L3', scene_tags: ['workplace','甩活'], difficulty: 2 },
  { code: 'family-marriage', title: '父母催婚', one_liner: '你可以说："结婚的事我自己有节奏。"', layer: 'L3', scene_tags: ['family','催婚'], difficulty: 3 },
  { code: 'family-money', title: '父母要求上交工资', one_liner: '你可以说："我得开始为自己打算。"', layer: 'L3', scene_tags: ['family','经济控制'], difficulty: 4 },
  { code: 'partner-cold', title: '伴侣冷暴力', one_liner: '你可以说："我需要我们能说出到底怎么了。"', layer: 'L3', scene_tags: ['relationship','冷暴力'], difficulty: 4 },
  { code: 'friend-borrow', title: '朋友借钱不还', one_liner: '你可以说："朋友归朋友，钱归钱。"', layer: 'L3', scene_tags: ['friendship','借钱'], difficulty: 3 },
  { code: 'in-laws', title: '婆媳冲突', one_liner: '你可以说："我需要你跟我站在一起。"', layer: 'L3', scene_tags: ['marriage','婆媳'], difficulty: 4 },
];
