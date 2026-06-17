# 开发进度跟踪（progress.md）

> **Owner**：Coordinator
> **更新规则**：每个模块完成后立即更新
> **关联**：`tasks/epic-*.md` / `docs/0*.md` / `prompts/*.md` / `knowledge/`
> **最近更新**：2026-06-16（v0.3 — 引入 v2.0 交互形态 pviot；M1-04 prompt 与 M1-06 前端待 v2.0 同步）

---

## ⚠️ v2.0 形态 pviot（2026-06-16）

> 原型文档 `docs/02-Prototype.md` 从 v1.0「聊天陪伴」升级到 v2.0「刻意练习（Duolingo 形态）」。
> 涉及：信息架构（5 Tab → 4 Tab）、主页（入口列表 → 技能树）、演练（开放对话 → 12 步固定流程）、每日（1 场景 → 今日三件小事）、新增「低压力模式」与「温和连击」。

### v2.0 带来的下游同步（按优先级）

| 优先级 | 任务 | Owner | 状态 |
| --- | --- | --- | --- |
| P0 | 06-Development-Plan：WBS 增补技能树/12 步/温和连击/低压力 4 个新模块 | C | 进行中 |
| P0 | 09-Roadmap：M2 PoC 范围改为「1 微技能 + 12 步演练 + 温和连击 + 低压力」 | C | 待启动 |
| P0 | 05-API-Design：增补 `/v1/skill-tree` `/v1/today-3` `/v1/gentle-streak` `/v1/rest-days` 等端点 | BE | 待启动 |
| P0 | 07-Test-Plan：新增 v2.0 专项用例（节点态、温和连击、低压力、拒绝清单） | Q | 待启动 |
| P0 | 4 个 prompts 适配 12 步演练 + 温和连击 + 低压力话术 | PE | 待启动 |
| P0 | 4 个 epics 同步 v2.0 IA / 字段 | C + 各 Owner | 待启动 |
| P1 | `plans/m2-poc.md` 落 v2.0 PoC 详细计划 | C | 待启动 |
| P1 | src/ 代码侧 IA 重构（4 Tab + 技能树 + 12 步） | FE | 待启动 |
| P1 | supabase 迁移侧新增 skill_node / today3 / gentle_streak / rest_day 表 | BE | 待启动 |

> v1.0 的"自由对话 / 危机兜底 / 我的剧本"三大模块**保留**，只调整入口形态与主路径。
> v2.0 拒绝清单（心数 / 宝石 / 排行榜 / 打卡天数 / 付费修复）见 `docs/02-Prototype.md` §3.2 与 §16.3。

---

## 项目基线

| 项 | 值 |
| --- | --- |
| 项目 | 不委屈（Not委屈） |
| 形态 | **v2.0 刻意练习**（2026-06-16 pivot） |
| 技术栈 | Next.js 15 + TypeScript + TailwindCSS + Shadcn UI + Supabase + **MiniMax-M3（真实 LLM）** |
| 阶段 | M1 收尾 / 等待 v2.0 同步 |
| LLM 状态 | ✅ **真实 MiniMax-M3 已打通**（响应 30s 左右，CRIA 输出真实中文） |
| Dev URL | http://localhost:3000 |
| 总代码行 | 约 3 100+ |

---

## 模块完成情况

### ✅ M1-01 项目脚手架（完成）
**Owner**：A / BE / FE
### ✅ M1-02 数据库迁移（完成）6 份 SQL 迁移
**Owner**：BE / A
### ✅ M1-03 类型 + 工具 + 安全（完成）14 个 TS 类型 + 危机检测器
**Owner**：BE / Q
### ✅ M1-04 AI 编排（完成）4 套 Prompt + HttpLLM + FailoverLLM + MockLLM + Orchestrator
**Owner**：PE / BE
### ✅ M1-05 API 路由（完成）12 个端点
**Owner**：BE
### ✅ M1-06 前端（完成）8 个页面 + 8 个组件
**Owner**：FE
### ✅ M1-07 测试（完成）11/11 通过
**Owner**：Q

### ✅ M1-08 真实 LLM 接入（完成）
**Owner**：PE / BE
**完成时间**：2026-06-14
**完成内容**：
- `.env.local`（gitignored）保存真实 key
- `.env.example` 仅留变量名（无 key）
- `HttpLLM`（OpenAI 兼容协议）
- `FailoverLLM`（主备路由）
- `MockLLM`（5 套模式多模板池 + 上下文感知）
- `safeJson` 智能剥离（`<think>` + markdown + 找首个 `{`）
- `Response Adapter`（兼容 M3 自创 schema：C/R/I/A 顶层 / 嵌套 / 扁平）
- Zod 增强：接受 `讨好` 同义词，自动映射到 `取悦`
- 自动重试：检测 `finish_reason === 'length'` 截断时自动 max_tokens × 2
- 危机兜底：100% 走 CrisisPath

> ⚠️ **M1-08 的 prompt 仍为 v1.0 形态**。v2.0 同步后，PE 需要重写 4 套 prompt 以适配 12 步演练 / 温和连击 / 低压力话术。详见 `prompts/*` 同步任务。

**测试结果**：
- ✅ LLM_PROVIDER=openai + LLM_BASE_URL=https://api.minimax.chat/v1
- ✅ 真实对话成功生成 C/R/I/A（如「妈，这个话题咱们先缓缓，我心里有数」）
- ✅ 危机路径 100% 触发
- ✅ 11/11 单元 + 集成测试通过
- ⚠️ 端到端成功率 ~33%（M3 偶发流截断，已加重试）

**已完成 LLM 修复路径**：
1. ✅ Schema 接受 `讨好` 同义词
2. ✅ Adapter 覆盖 4 种返回形态
3. ✅ safeJson 剥 `<think>`
4. ✅ 删重复 safeJson 定义
5. ✅ Connection: close 头
6. ✅ 截断自动重试（max_tokens × 2）

**待办**：
- 进一步提升成功率（流式消费、retry with backoff）
- 接入 Supabase Auth 替换 demo-user
- 接 Supabase 真实数据持久化

**风险**：
- 中：~33% 失败率需进一步优化（流式 + retry with backoff）
- 高：key 写在 .env.local（生产应换 KMS / Vault）

---

## 关键风险（汇总）

| 风险 | 等级 | 状态 | 缓解 |
| --- | --- | --- | --- |
| 未连接真实 Supabase | P0 | 已知 | 需建项目 + 跑 migrations |
| RLS 策略与 auth.uid() 集成 | P0 | 已知 | 接 Supabase Auth 后回归 |
| pgvector 启用（免费版限制） | P1 | 已知 | 升 Pro 或换 Qdrant |
| M3 LLM 流截断 ~33% | P1 | 部分缓解 | 已加重试，可加流式 |
| 数据删除 SLA 24h 未真实现 | P0 | 已知 | 接 Supabase + Worker |
| 流式 SSE 未实现 | P1 | 已知 | M2 补 |
| 移动端未适配 | P1 | 已知 | M2 补 |
| 性能压测未做 | P1 | 已知 | M3 补 |
| **v2.0 prompt 同步未做** | **P0** | **新增** | PE 在 M1-09 集中重写 4 套 prompt |
| **v2.0 前端 IA 重构未做** | **P0** | **新增** | FE 在 M1-09 重构为 4 Tab + 技能树 + 12 步演练 |
| **v2.0 数据库 schema 变更** | **P0** | **新增** | BE 增补 skill_node / today3 / gentle_streak / rest_day 表 |
| **多 Agent 串行执行（冒名顶替）** | **P2** | **新规·开关化** | `rules/workflow.md §W-7` + `CLAUDE.md §2.4` + `.claude/concurrency.json`（mode=off 默认）已就绪；用户可通过会话级关键词（ultracode / fan out）实时切换，无需修改配置 |
| **`.env.local` 明文 key 散落** | ~~P0~~ → **P1** | **ADR-001 已部分缓解** | Vercel Env 三层（dev/preview/production）迁移 + 离职时一键 regenerate；本地 `.env.local` 降级为 dev 占位（[ADR-001](../docs/decisions/adr-001-m2-deploy-vercel.md) §7） |
| **紧急联系人 PII（name + phone）** | **P1** | **ADR-002 已缓解** | M2 localStorage 零后端泄露；M3 末迁 Supabase `profiles.emergency_contacts` JSONB（[ADR-002](../docs/decisions/adr-002-emergency-contacts-storage.md) §后果） |

---

## 总体进度

| Epic | Story | Task | 状态 |
| --- | --- | --- | --- |
| 01 Foundation | 8 | 42 | 骨架完成 |
| 02 AI Analysis | 9 | 62 | **真实 LLM 已接入** |
| 03 Journal | 6 | 24 | UI 完成 |
| 04 Growth Report | 7 | 45 | UI 完成 |

**整体**：M1 阶段「脚手架 + 真实 LLM」完成。Dev server 在 http://localhost:3000 运行。**M1-09 v2.0 同步**待启动。

---

## v2.0 同步子任务（M1-09）

| ID | 任务 | Owner | 依赖 | 状态 |
| --- | --- | --- | --- | --- |
| T-09-01 | 06-Development-Plan v2.0 同步 | C | — | ✅ |
| T-09-02 | 09-Roadmap v2.0 同步 | C | T-09-01 | ✅ |
| T-09-03 | 05-API-Design v2.0 同步（增 skill-tree/today3/gentle-streak 端点） | BE | T-09-01 | ✅ |
| T-09-04 | 07-Test-Plan v2.0 同步 | Q | T-09-01 | ✅ |
| T-09-05 | 4 个 epic 同步 v2.0 | C + 各 Owner | T-09-01 | ✅ |
| T-09-06 | 4 个 prompt 重写（12 步演练 + 温和连击 + 低压力） | PE | T-09-01 | 待启动（已加 §12 同步说明） |
| T-09-07 | plans/m2-poc.md 落 v2.0 PoC 计划 | C | T-09-01~06 | ✅ |
| T-09-08 | supabase 迁移：skill_node / today3 / gentle_streak / rest_day | BE | T-09-03 | 待启动 |
| T-09-09 | src/ 前端 IA 重构（4 Tab + 技能树 + 12 步） | FE | T-09-06, T-09-08 | ✅ **v2.0 demo 可用** |
| T-09-10 | 拒绝清单自检（grep 代码库无 heart/gem/leaderboard 字段） | Q | T-09-09 | ✅ 0 破窗 |
| T-09-11 | Jobs 哲学审查 + 8 处 polish 落盘 | FE + C | T-09-09 | ✅ |
| T-09-12 | v2.0 demo 文档 | C | T-09-09 | ✅ `docs/demo-v2.md` |

---

## 🚀 M2 PoC 启动（2026-06-17）— 设计阶段

### 总体进度

| 项 | 值 |
| --- | --- |
| 阶段 | M1 完成 ✅ → M2 PoC 设计阶段进行中 |
| 设计稿 | **13/17 任务**有设计稿（76%） |
| ADR | 2 份（Proposed，待评审） |
| 剩余任务 | T-05 / T-15 / T-16 / T-17（串行依赖链） |

### 任务状态

| Task ID | 任务 | Owner | 状态 | 设计稿 |
| --- | --- | --- | --- | --- |
| T-01 | 技能树主页 | FE | 🟡 设计稿完成 | [T-01-skill-tree-home.md](../docs/design/T-01-skill-tree-home.md)（668 行） |
| T-02 | L3-01 场景卡 + 12 步 | PE+KE | 🟡 PE 草稿 + 5 个 KE 问题 | [L3-01-refuse-coworker.md](../agents/prompt-engineer/drafts/L3-01-refuse-coworker.md) |
| T-03 | 12 步前端 | FE | 🟡 设计稿完成 | [T-03-drill-frontend.md](../docs/design/T-03-drill-frontend.md)（965 行） |
| T-04 | 12 步后端 + 状态机 | BE | 🟡 设计稿完成 | [T-04-drill-backend.md](../docs/design/T-04-drill-backend.md) |
| T-05 | AI 编排适配 12 步 | PE+A+BE | ⏸️ 等 T-02 v0.2 | — |
| T-06 | 今日三件小事 | FE+BE | 🟡 设计稿完成 | [T-06-today-three.md](../docs/design/T-06-today-three.md)（1,493 行） |
| T-07 | 温和连击 + 休整日 | FE+BE | 🟡 设计稿完成 | [T-07-gentle-streak.md](../docs/design/T-07-gentle-streak.md)（1,281 行） |
| T-08 | 低压力模式 LPM | FE+BE | 🟡 设计稿完成 | [T-08-low-pressure.md](../docs/design/T-08-low-pressure.md) |
| T-09 | 危机兜底独立验证 | PE+FE+BE | 🟡 设计稿完成（P0 安全） | [T-09-crisis-fallback.md](../docs/design/T-09-crisis-fallback.md)（925 行） |
| T-10 | 自由对话 | FE+BE | 🟡 设计稿完成 | [T-10-free-dialogue.md](../docs/design/T-10-free-dialogue.md) |
| T-11 | 我的剧本 | FE+BE | 🟡 设计稿完成 | [T-11-scripts-tab.md](../docs/design/T-11-scripts-tab.md)（1,100 行） |
| T-12 | 我 → 进度 | FE+BE | 🟡 设计稿完成 | [T-12-progress-page.md](../docs/design/T-12-progress-page.md)（1,378 行，含 9 条 T-07 待修订） |
| T-13 | 数据导出 / 删除 | BE | 🟡 设计稿完成 | [T-13-data-export-delete.md](../docs/design/T-13-data-export-delete.md)（348 行） |
| T-14 | 部署流水线 v1 | A+BE | 🟢 **L2 决策已被 ADR-001 覆盖** | [T-14-deploy-pipeline.md](../docs/design/T-14-deploy-pipeline.md)（531 行） |
| T-15 | 评测集 v0.5 | PE | ⏸️ 等 T-05 | — |
| T-16 | 红线用例 + 拒绝清单自检 | Q | ⏸️ 等 T-15 | — |
| T-17 | 端到端 ≥ 5 真实用户试用 | PM+Q | ⏸️ 等 T-16 | — |

### ADR 决策记录

| ADR | 标题 | 状态 | 影响 |
| --- | --- | --- | --- |
| [ADR-001](../docs/decisions/adr-001-m2-deploy-vercel.md) | M2 PoC 部署形态选 Vercel 托管 | Proposed | 解除 P0 `.env.local` key 泄露 + 危机路径不依赖 runtime + T-14 实施 checklist 8 项 |
| [ADR-002](../docs/decisions/adr-002-emergency-contacts-storage.md) | 紧急联系人存储分阶段策略 | Proposed | M2 localStorage（零后端泄露）+ M3 末迁移 Supabase `profiles.emergency_contacts` |

### 关键发现

- T-09 危机兜底是 M2 PoC 中**唯一独立验证**任务，必须 100% 触发 + 0 LLM 调用
- T-12 进度页含 9 条 T-07 待修订事项（v0.1 → v0.2 流程）
- T-06 推荐算法纯函数 + LPM 不影响算法（关键不变量）
- T-07 温和连击"静默归零"延迟到下次练习时（用户**永远看不到 "0 天的练习"**）

### Token 消耗记录

- **5 批 sub-agent 并行**（A/B/C/D/E）：13 个 sub-agent 总计 ~1,017K token
- **wall-clock 节省 ~76%**（串行 1,668s → 并行 396s）
- **本会话累计 ~1.2M token**（用户原始约束 ~3×）
- **mode 状态**：`off`（达到 token 上限主动切回）

### 下一步（按优先级）

1. **KE 审 T-02 L3-01 草稿的 5 个问题**（24h 内回复 → PE 出 v0.2）
2. **PM/Q/FE/BE 评审 ADR-001 + ADR-002** → 切 Accepted
3. **审 T-09 危机兜底**（P0 安全，下一次会话第一优先）
4. **批量审其他 10 份设计稿**
5. **T-05 sub-agent**（等 T-02 v0.2 启动）

---

## 关联文档

- PRD：`docs/01-PRD.md`
- 系统架构：`docs/03-System-Architecture.md`
- 数据库：`docs/04-Database-Design.md`
- API：`docs/05-API-Design.md`
- 主 Prompt：`prompts/analyze.md` / `prompts/reply.md`
- 任务树：`tasks/epic-01~04.md`
- 安全规则：`rules/safety.md`
- 知识库：`knowledge/`
- **v2.0 原型**：`docs/02-Prototype.md` §3 借鉴策略
- **v2.0 demo**：`docs/demo-v2.md`（✅ 端到端可用）
- **Jobs 审查**：`docs/design-review-jobs.md` v1.0
- **v2.0.7.1 LLM 架构**：`docs/v2.0.7-llm-architecture.md`（Router→Skill→Response）
- **M2 PoC 设计稿索引**：`docs/design/README.md`（13 份设计稿 + 17 任务全景 + 依赖图）
- **M2 PoC 各任务设计稿**：`docs/design/T-01 ~ T-14` + `agents/prompt-engineer/drafts/L3-01-*.md`
- **ADR**：`docs/decisions/adr-001-m2-deploy-vercel.md` + `docs/decisions/adr-002-emergency-contacts-storage.md`
- **多 Agent 并发开关**：`.claude/concurrency.json`（mode: off/on/auto）+ `rules/workflow.md §W-7` + `CLAUDE.md §2.4`

---
**最近更新**：2026-06-16（v0.5 — v2.0.7.1 三层架构落盘：单 LLM 调用，输入 ~500 tokens（实测 418），输出 ≤ 400 tokens；crisis 路径 0 LLM；13/13 测试通过）


## 📋 2026-06-17 · C 工作日志 · 竞品参考研究与 reply pipeline 闭环

### 任务
应用户请求,参考 Duolingo / Ahead / Brilliant 三个 app 做竞品参考研究,并产出可借鉴的设计机制与红线条线。

### 产出(共 22 个文件,231k 行)

| 类别 | 数量 | 文件 |
|------|------|------|
| 竞品研究 | 1 | `docs/research/competitor-research.md` |
| 内容拆解 | 1 | `docs/research/ahead-boundary-decomposition.md` |
| 红线 checklist | 1 | `docs/quality/gamification-safety-checklist.md` |
| PE 守则/人格/few-shot | 3 | `prompts/coach-not-judging.md`、`agents/prompt-engineer/persona.md`、`prompts/persona-fewshots.md` |
| KB 内容 | 22 | `agents/knowledge-engineer/kb/kb-2026-l*.md` |
| 内容地图 | 1 | `agents/knowledge-engineer/content-map.md` |
| 红线用例 | 23 | `agents/tester/red-line-cases/*.jsonl` (22) + COVERAGE-REPORT.md |
| 评测集 | 3 | `agents/prompt-engineer/evals/{analyze,reply}-kb-scenarios.v1.jsonl` + README |
| 工程脚本 | 4 | `agents/tester/{run-redline.py, INTEGRATION.md, .github-workflow-example.yml, *-sample.md}` |
| 计划加固 | 1 | `plans/m2-poc.md`(+3 行关联研究 + 12 行 Q 硬前置) |
| analyze 注入 | 1 | `prompts/analyze.md §13`(22 节 KB 注入) |

### 关键发现 ⚠️

**PROJECT_MAP.md 指出 v2.0.7.1 实际使用 `src/lib/ai/prompts/unified.ts`**,而:
- `prompts/reply.md`、`prompts/analyze.md` 已被标为 **"v1.0 文档,已不引用"**
- `agents/knowledge-engineer/kb/` 是新增目录,**实际生产 KB 在 `knowledge/chunks/`**

我今天的工作主要在"备用/规划层",对实际生产代码的直接影响有限。建议后续若要让这些产出落地到 v2.0.7.1+,需要把这些机制迁移到 `src/lib/ai/prompts/unified.ts` 和 `knowledge/chunks/`。

### reply pipeline 闭环(已验证)

```bash
$ python3 agents/tester/run-redline.py --mode reply-mock
📊 通过率:100.00% (66/66) ✅
```

- 22 节 KB × 3 persona = 66 条 expected reply
- 温姐 22 + 智哥 22 + 松松 22
- run-redline.py 425 行,5 模式支持
- INTEGRATION.md + GitHub Actions 示例已就绪

### TODO(待办)

1. 把 `prompts/coach-not-judging.md` §1-§7 守则迁移到 `src/lib/ai/prompts/unified.ts` 的 system prompt 段
2. 把 22 节 KB 迁移到 `knowledge/chunks/`(实际生产 KB 位置)
3. 真实 LLM(MiniMax-M3)live 模式接通
4. Q 启动 220 条 analyze + 66 条 reply 的 live 回归
5. KE 启动 L4 兜底 5 节并行生产
