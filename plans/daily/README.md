# plans/daily/ · 每日工作日志

> **Owner**：所有 Agent（每个工作日结束时各自写自己的）
> **更新规则**：每个工作日结束（eod）追加当天 standup
> **格式**：文件名 `YYYY-MM-DD.md`（一个工作日一个文件）
> **保留期**：最近 30 天热数据；30 天前压缩到 `plans/daily/_archive/YYYY-MM.md`

## 必填字段

每个 standup 至少包含 4 段：

```markdown
# YYYY-MM-DD · <Agent 名> · <1 句话当日主题>

## 昨天说要做（如果有）
- [ ] 任务 1
- [ ] 任务 2

## 今天做的
- 完成/推进 / 修复 / 决策（带 PR/commit 链接）
- **关键 bug**：是什么 / 怎么修 / 防回归测试加在哪

## 决定 / 阻塞 / 风险
- 决策：选了 X 而不是 Y（理由）
- 阻塞：等谁 / 等什么
- 风险：L2 升档 → 触发跨 Agent 评审

## 明天
- 优先级 1
- 优先级 2

## 进度（plan/状态机相关）
- m2-poc 当前阶段：计划中 → 实施中 → 验收中 → 已完成
- epic-NN 子任务：xx → yy
- 任何模块完成 → 同步 `plans/progress.md`
```

## 不在 standup 里的内容

- 完整 changelog → 走 `CHANGELOG.md`（root）
- 重大决策 → 走 `docs/decisions/adr-NNN-*.md`
- 任务完成 → 走 `tasks/epic-*.md` 翻转状态
- 进度变化 → 走 `plans/progress.md`

## 强制触发条件（任一即写）

| 触发 | 必写内容 |
| --- | --- |
| 完成一个 WBS 任务 | tasks/epic-*.md 状态 + progress.md |
| 修了 P0/P1 bug | 根因 + 修复 + 防回归测试 |
| 改了 system prompt | token 估算 + 评测结果 |
| 触发 L2/L3 决策 | ADR 链接 |
| 跨 Agent 冲突 | 双方观点 + 仲裁结果 |
| 端到端测试 pass/fail | 测试范围 + 失败项 |

## 不强制（但建议）

- 学到了什么（避免下次再踩）
- 工具 / 库的新发现
- 流程改进建议
- 用户反馈（如有）
