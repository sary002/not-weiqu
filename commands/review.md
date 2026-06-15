# /review — 评审一个产出

> 拉上相关 Agent，对一份产出做交叉评审。

## 触发
`/review <artifact-path>`

## 行为
1. C 解析：被评审的是什么？
2. 召集相关 Agent（自动按 artifact 类型路由）：
   - PRD → PM 主审，PE/KE/FE 旁审
   - 提示词 → PE 主审，KE/Q 旁审
   - 架构图 → A 主审，BE/PM 旁审
   - UI 稿 → FE 主审，PM/Q 旁审
3. 输出 **Review 报告**：
   - 共识项
   - 异议项 + 各自理由
   - 阻塞项
   - 建议项

## 产出
- `tasks/<id>/review-<round>.md`

## 适用 Agent
Coordinator + 评审团

## 不该做的事
- 越界评审（如 PE 不该替 A 拍板技术选型）
- 在没有产品上下文的情况下硬评
