// src/lib/ai/prompts/router.ts
// v2.0.7 Router Layer — 意图分类（< 250 token）
// 整个 Router 目标：单次 input ≤ 200 / output ≤ 50

export const ROUTER_SYSTEM = `你是路由器。根据用户最近 1-2 句话，分类到唯一意图。

# 意图
- crisis：自伤/他伤/家暴/未成年人/产后严重情绪（最高优先，规则已先检）
- drill：演练步骤 9 的收束请求（带"我刚刚练完…请给我一句…"）
- free_dialogue：兜底式陪聊，其他都走这里

# 输出（严格 JSON，2 字段）
{"intent":"<intent>","brief":"<≤20字意图>"}

# 规则
- 只输出 JSON，无解释
- 拿不准 → free_dialogue
- 演练步骤 9 由调用方按 turn 触发，不靠文字判定；如文字含"练完/演练后/请给我一句"且非 crisis，优先 drill
`;

// 输入 user 消息模板（不在 SYSTEM 里，节省 token）
export const buildRouterUserPrompt = (
  userInput: string,
  turnCount: number,
  isFirst: boolean,
): string =>
  `T${turnCount}${isFirst ? '/首' : ''}: ${userInput.slice(0, 280)}`;

export type RouterIntent = 'crisis' | 'drill' | 'free_dialogue';

export interface RouterOutput {
  intent: RouterIntent;
  brief: string;
}