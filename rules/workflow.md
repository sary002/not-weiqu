# 规则：工作流（Workflow）

> 「一个需求从诞生到上线」的标准动线。

## W-1 五阶段
```
需求（PM） → 方案（A+PM） → 设计（PE/KE/FE/BE） → 计划（C） → 验收（Q）
```

## W-2 阶段准入
| 进入下一阶段必须满足 |
| --- |
| 上一阶段产出物已落盘到 `docs/` 或 `plans/` |
| 上一阶段自检清单已全部勾选 |
| 所有阻塞项已升级到 C |

## W-3 阶段产出
| 阶段 | 必出 | 路径 |
| --- | --- | --- |
| 需求 | PRD 草稿 + 假设 | `docs/product/prd-<feature>.md` |
| 方案 | 架构草图 + 选型表 + ADR（如有） | `docs/architecture/`、`docs/decisions/` |
| 设计 | 对话脚本 / 线框 / 知识块清单 / API 草稿 | `plans/<feature>/design/` |
| 计划 | 任务拆解 + 依赖图 + 里程碑 | `plans/<feature>.md` + `tasks/<NNN>-*/brief.md` |
| 验收 | 验收用例 + 回归报告 + 风险登记 | `tasks/<NNN>-*/acceptance.md` |

## W-4 并行与串行
- **可并行**：需求 ↔ 知识库调研；设计 ↔ API 草案
- **必须串行**：PRD 定稿 → 才出方案；提示词定稿 → 才进评测

## W-5 异常路径
- **阻塞**：下游写 `tasks/<id>/blocker.md`，C 在 1 个工作回合内升级或重派
- **回滚**：任一阶段发现上游假设错误，回退到对应阶段并写复盘
- **跳级**：仅在 Coordinator 标注「紧急安全补丁」时允许，但事后必须补全流程

## W-6 收尾
- 验收通过后，C 在 `plans/<feature>.md` 末尾追加「验收结果 + 假设验证情况」。
- 未验证的假设回流到 `docs/product/hypothesis-backlog.md`。
