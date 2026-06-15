# 开发进度跟踪（progress.md）

> **Owner**：Coordinator
> **更新规则**：每个模块完成后立即更新
> **关联**：`tasks/epic-*.md` / `docs/0*.md` / `prompts/*.md` / `knowledge/`

---

## 项目基线

| 项 | 值 |
| --- | --- |
| 项目 | 不委屈（Not委屈） |
| 技术栈 | Next.js 15 + TypeScript + TailwindCSS + Shadcn UI + Supabase + **MiniMax-M3（真实 LLM）** |
| 阶段 | M1（脚手架 + 后端 + 前端 + LLM 接入） |
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

---

## 总体进度

| Epic | Story | Task | 状态 |
| --- | --- | --- | --- |
| 01 Foundation | 8 | 42 | 骨架完成 |
| 02 AI Analysis | 9 | 62 | **真实 LLM 已接入** |
| 03 Journal | 6 | 24 | UI 完成 |
| 04 Growth Report | 7 | 45 | UI 完成 |

**整体**：M1 阶段「脚手架 + 真实 LLM」完成。Dev server 在 http://localhost:3000 运行。

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

---
**最近更新**：2026-06-14（v0.2 — 真实 LLM 接入完成）
