# /design — 落地一个设计

> 把方案翻译成 UI 线框 / 对话脚本 / 内容大纲 / 数据模型。

## 触发
`/design <feature>`

## 行为
1. 读 `plans/<feature>.md` 取输入
2. FE 出信息架构 + 状态机
3. PE 出对话脚本 + 提示词草稿
4. KE 出所需知识块清单
5. BE 出 API 契约 + 数据模型
6. A 汇总，画模块图

## 产出
- `plans/<feature>/design/` 下分角色文件
- 由 C 评审后再进入实施

## 适用 Agent
FE / PE / KE / BE（主） + A（统筹）

## 红线
- 设计稿不替代 Q 验收
- 任何含情绪触点的设计，必须经 Q 红线用例自检
