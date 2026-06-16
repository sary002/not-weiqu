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
