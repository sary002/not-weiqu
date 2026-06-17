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

---

<!-- ═══════════════════════════════════════════════════════════════════
     §W-7 多 Agent 并发执行（开关模式）
     ═══════════════════════════════════════════════════════════════════ -->

## W-7 多 Agent 并发执行（开关模式）

> **当前开关**：`off`（详见 `.claude/concurrency.json`）
> **配置文件**：[.claude/concurrency.json](../../.claude/concurrency.json)
> **设计原则**：规则始终可见，开关决定行为；不通过屏蔽规则来禁用。
> **创建**：2026-06-17（v1 草案）

### W-7.1 三种模式

| 模式 | 行为 | 适用场景 |
| --- | --- | --- |
| **`off`**（默认） | 串行执行，禁止 Workflow 工具，禁止同 prompt 触发 ≥ 2 个 sub-agent | token 预算紧张 / 小任务 / 个人调试 |
| **`on`** | 强制多 Agent 并行，跨 ≥ 2 Agent 角色时自动 fan out | 大型任务 / 显式 ultracode / 团队 sprint |
| **`auto`** | 按阈值自动判断：满足条件才并行，否则串行 | 默认推荐（当 token 预算允许时） |

### W-7.2 开关切换方式

**会话级切换**（一句话切换本会话模式）：

| 用户说 | 切换到 |
| --- | --- |
| `ultracode` / `ultracode on` / `fan out` / `parallel` / `多 agent 并行` | `on` |
| `ultracode off` / `一个人做` / `省 token` | `off` |
| `ultracode auto` | `auto` |

**团队级切换**（修改 `.claude/concurrency.json` 的 `mode` 字段）：
- 所有团队成员共享默认模式
- 个人可在 `.claude/concurrency.local.json` 覆盖（gitignored）

### W-7.3 评估时机（`on` / `auto` 模式必做）

C 接到任务后的 **第一动作** 是画依赖图（即使是脑内），不是立刻动手。

| 信号 | 处理 |
| --- | --- |
| 任务跨 ≥ 2 个 Agent 角色 | 必须评估并行 |
| 任务跨 ≥ 3 个 Agent 角色 | `on`/`auto` 模式默认并行，并向用户汇报编排方案 |
| 任务全部在单一 Agent 域内 | 不强制评估 |
| 任务有强数据依赖（A 的产物是 B 的输入） | 串行执行并显式标注依赖链 |

### W-7.4 并行判定三问（`auto` 模式必答）

1. **产出物是否独立？** — 独立则可并行；否则串行
2. **数据依赖方向？** — A → B 强依赖则 A 先做；无依赖则并行
3. **总 token 增量是否 < 2× 单 Agent？** — 是则并行；否则串行或拆分批次

### W-7.5 执行工具

| 模式 | 工具 |
| --- | --- |
| `off` | 仅单 Agent 串行（默认 `Agent` 工具，但每次只 1 个） |
| `on` | `Agent` 工具并行调用（系统上限 16）+ `Workflow`（ultracode 模式） |
| `auto` | 同 `on`，但先按 W-7.4 三问判断后才执行 |

### W-7.6 失败回退

- 任一并行 sub-agent 失败 → C 在 1 个工作回合内决定：重试 / 降级串行 / 升级用户
- 并行总 token 超预算 → 自动降级为串行，并在 `plans/daily/<date>.md` 登记
- 团队默认模式变更 → 必须先写 ADR（`docs/decisions/adr-NNN-default-concurrency.md`），再改 JSON

### W-7.7 反模式（明确禁止）

- ❌ **冒名顶替**：单 Agent 串行产出多 Agent 角色命名的文件
- ❌ **假并行**：开了 N 个 sub-agent 但 prompt 完全相同（应差异化 prompt）
- ❌ **静默串行**：本可并行但悄悄串行完成，不向用户说明
- ❌ **静默并行**：用户已设 `off` 但擅自开 sub-agent，不向用户说明
