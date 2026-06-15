# /plan — 规划一次需求

> 从一句需求出发，产出可执行的任务拆解。

## 触发
`/plan <feature-or-topic>`

## 行为
1. Coordinator 接收需求
2. PM 出一句话目标 + 用户故事 + 验收标准
3. A 评估技术约束与备选
4. PE/KE 标注内容/对话能力依赖
5. C 拆解为 `tasks/<id>/` 下的子任务，登记到 `plans/<feature>.md`

## 产出
- `plans/<feature>.md`：目标 / 范围 / 非目标 / 风险 / 任务清单
- `tasks/<NNN>-<slug>/brief.md`：每个子任务的 brief

## 适用 Agent
Coordinator + PM（主） + A / PE / KE（按需）

## 模板
见 `plans/README.md` 中的「计划模板」段。
