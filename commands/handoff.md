# /handoff — Agent 之间的接力

> 让产出从一个 Agent 平滑交给另一个 Agent，不丢上下文。

## 触发
`/handoff <from-agent> -> <to-agent> <artifact>`

## 行为
1. C 读取 `<artifact>` 与上下文
2. 生成 **Handoff 卡片**：
   - 我（前手）是谁，做了什么
   - 我留下什么、未决什么
   - 给你的输入 / 期望的输出
   - 时间窗与阻塞条件
3. 落盘到 `tasks/<id>/handoff-<from>-to-<to>.md`
4. 通知目标 Agent 开工

## 适用 Agent
Coordinator

## 必要性
- PE → Q：把提示词 + 评测集一起交接
- KE → PE：把知识块 + 标签一起交接
- A → BE：把架构 + ADR 一起交接
- 任何 Agent → C：异常 / 阻塞 / 升级请求

## 不该做的事
- 没有 handoff 卡片就让下游直接开干
- 在 handoff 中夹带私货（如「顺便改一下 X」）
