# M2 PoC 设计稿索引 · docs/design/

> **维护者**：Coordinator（C）
> **更新规则**：每个设计稿完成后立即更新；每个 ADR 完成后立即追加
> **创建**：2026-06-17（M2 PoC 设计阶段启动日）
> **最后更新**：2026-06-17

---

## 0. 阅读须知

本目录收录 M2 PoC 期间产出的**调研 + 设计稿**（不修改 `src/` 源代码）。每个设计稿独立成文件，按 M2 PoC 任务编号命名（`T-XX-*.md`）。

| 类型 | 命名 | 数量 | 路径 |
| --- | --- | --- | --- |
| 设计稿 | `T-XX-<topic>.md` | 13 | `docs/design/` |
| 场景内容草稿（PE） | `L<N>-<topic>.md` | 1 | `agents/prompt-engineer/drafts/` |
| ADR（架构决策） | `adr-NNN-<topic>.md` | 2 | `docs/decisions/` |

**设计稿状态机**：

```
pending → in-progress (设计稿) → pending (审) → approved (实施)
                                                       ↓
                                              superseded by ADR-NNN
```

---

## 1. M2 PoC 任务全景

> 来源：`plans/m2-poc.md` §任务清单（17 个子任务）

| Task ID | 任务 | Owner | 设计稿路径 | 行数 | 状态 | 依赖设计稿 |
| --- | --- | --- | --- | --- | --- | --- |
| T-01 | 技能树主页（5 段骨架 + 节点 6 态组件） | FE | [T-01-skill-tree-home.md](./T-01-skill-tree-home.md) | 668 | 🟡 待审 | — |
| T-02 | L3-01 场景卡 + 12 步内容 | PE+KE | [L3-01-refuse-coworker.md](../../agents/prompt-engineer/drafts/L3-01-refuse-coworker.md) + [review-questions.md](../../agents/prompt-engineer/drafts/L3-01-review-questions.md) | — | 🟡 KE 待审 5 个问题 | — |
| T-03 | 12 步演练前端组件 | FE | [T-03-drill-frontend.md](./T-03-drill-frontend.md) | 965 | 🟡 待审 | T-01, T-09 |
| T-04 | 12 步演练后端 + 状态机 | BE | [T-04-drill-backend.md](./T-04-drill-backend.md) | ~800 | 🟡 待审 | T-01, T-09 |
| T-05 | AI 编排适配 12 步（每步人格注入） | PE+A+BE | ⏸️ **未启动**（等 T-02 v0.2） | — | ⏸️ blocked | T-02 v0.2 |
| T-06 | 今日三件小事前端 + 后端 | FE+BE | [T-06-today-three.md](./T-06-today-three.md) | 1,493 | 🟡 待审 | T-01, T-03, T-04 |
| T-07 | 温和连击 + 休整日后端 + 前端 | FE+BE | [T-07-gentle-streak.md](./T-07-gentle-streak.md) | 1,281 | 🟡 待审 | T-06 |
| T-08 | 低压力模式开关 + 推送控制 | FE+BE | [T-08-low-pressure.md](./T-08-low-pressure.md) | 11 章 | 🟡 待审 | T-06 |
| T-09 | 危机兜底（v1.0 路径独立验证） | PE+FE+BE | [T-09-crisis-fallback.md](./T-09-crisis-fallback.md) | 925 | 🟡 待审（**P0 安全**） | — |
| T-10 | 自由对话（v1.0 兜底式陪聊保留） | FE+BE | [T-10-free-dialogue.md](./T-10-free-dialogue.md) | — | 🟡 待审 | T-09 |
| T-11 | 我的剧本（v1.0 保留 + 提升为底部 Tab） | FE+BE | [T-11-scripts-tab.md](./T-11-scripts-tab.md) | 1,100 | 🟡 待审 | T-03 |
| T-12 | 我 → 进度 | FE+BE | [T-12-progress-page.md](./T-12-progress-page.md) | 1,378 | 🟡 待审（含 9 条 T-07 待修订） | T-07, T-11 |
| T-13 | 数据导出 / 删除 | BE | [T-13-data-export-delete.md](./T-13-data-export-delete.md) | 348 | 🟡 待审 | — |
| T-14 | 部署流水线 v1 | A+BE | [T-14-deploy-pipeline.md](./T-14-deploy-pipeline.md) | 531 | 🟢 **L2 决策已被 ADR-001 覆盖** | ADR-001 |
| T-15 | 评测集 v0.5（含温和连击 / 低压力话术） | PE | ⏸️ **未启动**（等 T-05） | — | ⏸️ blocked | T-05 |
| T-16 | 红线用例 + 拒绝清单自检 | Q | ⏸️ **未启动**（等 T-15） | — | ⏸️ blocked | T-15 |
| T-17 | 端到端跑通（≥ 5 真实用户） | PM+Q | ⏸️ **未启动**（等 T-16） | — | ⏸️ blocked | T-16 |

**进度**：13/17 任务有设计稿/草稿（76%），2 个任务由 ADR 覆盖。

---

## 2. ADR 索引

> 来源：`docs/decisions/`

| ADR | 标题 | 状态 | 关键决策 | 影响 |
| --- | --- | --- | --- | --- |
| [ADR-001](./../decisions/adr-001-m2-deploy-vercel.md) | M2 PoC 部署形态选 Vercel 托管 | Proposed | Vercel 托管 + GitHub Actions CI + Vercel Env 三层分层 | T-14 实施 checklist 8 项 |
| [ADR-002](./../decisions/adr-002-emergency-contacts-storage.md) | 紧急联系人存储分阶段策略 | Proposed | M2 localStorage + M3 末迁移 Supabase `profiles.emergency_contacts` | T-09 §3.4 紧急联系人实装 + M3 schema 追加 |

**ADR 评审流程**：Proposed → C 召集 PM / Q / FE / BE / PE / KE 评审 → Accepted → 实施。

---

## 3. 跨设计稿依赖图

```
[T-01 技能树主页]
    │
    ├─→ [T-03 12 步前端]
    │       │
    │       ├─→ [T-06 今日三件小事] ←── [T-08 LPM] (默认 ON)
    │       │       │
    │       │       └─→ [T-07 温和连击]
    │       │               │
    │       │               └─→ [T-12 我 → 进度] ←── [T-11 我的剧本]
    │       │                                               ↑
    │       └───────────────────────────────────────────────┘
    │
    └─→ [T-04 12 步后端 + 状态机]
            │
            └─→ (T-05 AI 编排 ⏸️) → (T-15 评测集 ⏸️) → (T-16 红线 ⏸️) → (T-17 端到端 ⏸️)

[T-09 危机兜底] ──→ [T-10 自由对话] ──→ T-03 / T-04
       │
       └─→ 紧急联系人 → ADR-002 (M2 localStorage / M3 Supabase)

[T-13 数据导出/删除] ── 独立
[T-14 部署流水线] ── 独立 → ADR-001 (Vercel 托管)
```

**关键不变量**：

- T-09 危机兜底是 P0 安全，所有页面前端必须按 T-09 §3.3 线框实现
- T-12 进度页明确标注「9 条 T-07 待修订事项」（T-07 设计稿完成后才能修订 v0.2）
- T-06 / T-07 / T-08 / T-12 四份都依赖 T-01 SkillNode 6 态契约（不可擅改）

---

## 4. 累计 follow-up 待办汇总

> 各设计稿 §follow-up 汇总（去重后）

### 🔴 P0 · 安全 / L2 决策

| 来源 | 项 | 建议 Owner |
| --- | --- | --- |
| T-09 F-1 | 紧急联系人 localStorage → Supabase 迁移 ADR | **✅ 已完成（ADR-002）** |
| T-14 FU-3 | `.env.local` 真实 key 全部迁 Vercel | BE + C |
| T-09 F-4 | Q 审计平台占位（trace_id 当前仅 console.log） | BE |

### 🟡 P1 · 设计稿审阅 + 跨任务协调

| 来源 | 项 | 建议 Owner |
| --- | --- | --- |
| T-01 §8.4 | 7 条源代码差异（锁定 hover / 推荐去文字 / 双金冠 / 连接线等） | C 拍板是否 M2 必做 |
| T-03 §14 Q1-Q3 | 3 个开放问题（退出策略 / 步骤 12 跳转 / 隐藏 BottomNav） | C |
| T-04 §13 Q1-Q3 | 3 个开放问题（step 路由 / 步骤 11 fetch / 草稿 TTL） | C |
| T-06 §14 Q1-Q3 | 3 个开放问题（推荐唯一性 / "今日 X/3" 永远显示 / M2 是否实做 `POST /rest`） | C |
| T-07 §12 Q1-Q3 | 3 个开放问题（休整按钮位置 / 一次确认 / 进度页是否显示"天的练习"） | C |
| T-08 §11 Q1-Q3 | 3 个开放问题（按钮等宽 / `/settings` 二次确认 / `prefers-reduced-motion` 叠加） | C |
| T-09 §11 F-2~F-10 | 7 个 follow-up（紧急联系人设置页 / 暗示型漏报 / localStorage→Supabase / "我想继续聊"真实链路 / origin 路径 / 评测集补 ≥ 20 条 crisis 用例） | 多 Owner |
| T-11 §14 Q1-Q4 | 4 个开放问题（chip 筛选 / 搜索排序 / PATCH UI / 新增错误码） | C |
| T-12 §13 Q1-Q3 | 3 个开放问题（"你在这里"取最近 / `in_progress` 是否计入 / 进度页"导出/删除"范围） | C |
| T-12 §9 | **9 条 T-07 待修订事项**（v0.1 → v0.2 流程） | C 跟踪 |
| T-13 §12 | 7 个 follow-up（路径迁移 / 错误码增量 / Worker 选型 / 对象存储 / 审计日志 / 跨设备 / Q 用例扩展） | BE |
| T-14 §12.4 FU-1~10 | 10 个 follow-up（CI yaml / Vercel Project / key 迁移 / 飞书告警 / LLM metrics 表 / ICP 备案 / 回滚演练 / 离职审计 / M3 形态评估） | 多 Owner |

### 🟢 P2 · 后续 sub-agent

| 来源 | 项 | 建议 Owner |
| --- | --- | --- |
| — | T-05 AI 编排 sub-agent | PE+A+BE（待 T-02 v0.2） |
| — | T-15 评测集 sub-agent | PE（待 T-05） |
| — | T-16 红线用例 sub-agent | Q（待 T-15） |
| — | T-17 端到端试用（≥ 5 真实用户） | PM+Q（待 T-16） |

---

## 5. 阅读建议（按优先级）

| 优先级 | 顺序 | 设计稿 | 理由 |
| --- | --- | --- | --- |
| 🔴 P0 | 1 | [T-09 危机兜底](./T-09-crisis-fallback.md) | 安全相关，独立验证唯一任务 |
| 🔴 P0 | 2 | [ADR-001 Vercel 部署](./../decisions/adr-001-m2-deploy-vercel.md) | L2 决策，M2 PoC 跑通前提 |
| 🔴 P0 | 3 | [ADR-002 紧急联系人](./../decisions/adr-002-emergency-contacts-storage.md) | PII 决策，影响 M3 schema |
| 🟡 P1 | 4 | [T-01 技能树主页](./T-01-skill-tree-home.md) | 信息架构基础（其他设计稿依赖） |
| 🟡 P1 | 5 | [T-06 今日三件小事](./T-06-today-three.md) | 推荐算法 + LPM 集成（最高频交互） |
| 🟡 P1 | 6 | [T-03 12 步前端](./T-03-drill-frontend.md) + [T-04 12 步后端](./T-04-drill-backend.md) | S-PoC-01 主路径 |
| 🟡 P1 | 7 | [T-07 温和连击](./T-07-gentle-streak.md) + [T-08 LPM](./T-08-low-pressure.md) + [T-12 进度页](./T-12-progress-page.md) | 5 段旅程地图三件套 |
| 🟢 P2 | 8 | [T-10 自由对话](./T-10-free-dialogue.md) + [T-11 我的剧本](./T-11-scripts-tab.md) + [T-13 数据导出](./T-13-data-export-delete.md) + [T-14 部署流水线](./T-14-deploy-pipeline.md) | 辅助功能 + 基础设施 |

---

## 6. 设计稿与 PRD / 任务关联

| 任务 | 来源 PRD | 来源原型 | 关联规则 |
| --- | --- | --- | --- |
| 全部 | `docs/01-PRD.md` | `docs/02-Prototype.md` v2.0 | `rules/safety.md` S-1~S-8 |
| T-06 / T-07 / T-08 | — | `docs/02-Prototype.md` §6 拒绝清单 | `docs/quality/gamification-safety-checklist.md` |
| T-09 | `plans/m2-poc.md` S-PoC-04 | `docs/02-Prototype.md` §6.8 + §7.5 | `rules/safety.md` S-3 危机路径 |
| T-14 | `docs/08-Deployment-Plan.md` v1.0 | — | `rules/safety.md` S-3 crisis 路径独立 |

---

> **最后**：每次设计稿状态变更（pending → in-progress → 审 → approved）请同步更新本文件。
