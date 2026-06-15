# /start — 项目冷启动

> 进入项目第一件事。Coordinator 跑一遍「项目体检」并给出「从这里开始」。

## 触发
`/start`

## 行为
1. 读 `CLAUDE.md`
2. 读 `agents/*.md`（8 份）
3. 读 `rules/*.md`（4 份）
4. 读 `docs/product/vision.md`、`docs/product/personas.md`
5. 读 `docs/architecture/overview.md`
6. 扫一眼 `plans/`、`tasks/`、`docs/decisions/`
7. 输出 **C-Status 卡片**：
   - 当前阶段
   - 已沉淀资产
   - 缺失资产
   - 建议下一步（≤3 件事）

## 适用 Agent
Coordinator

## 不该做的事
- 不要在这一步进入业务实现
- 不要在缺失文档时强行补设计
