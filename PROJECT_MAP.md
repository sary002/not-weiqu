# PROJECT_MAP · 不委屈（Not委屈）

> **目的**：本文件是 claude 启动任何任务前的 **preflight 必读**。读完本文件即可知道项目是什么、关键文件在哪、不能踩什么坑，**无需再扫项目结构**。
> **维护**：当目录结构 / 关键文件 / 红线变化时更新；其它变化写 `CHANGELOG.md`。
> **不要**：每次都重新跑 `find` / `ls -R` 扫项目结构。

---

## 0. Preflight 清单（任何任务开始前）

1. 读本文（≤ 200 行，~3K token，1 次读入）
2. 读 `plans/daily/今日.md`（如有）→ 知道今天已做什么
3. 读 `plans/progress.md` 头部 → 当前阶段 + 关键风险
4. 才开始具体任务

> 4 步总计 ≤ 5K token。**比扫整个项目省 10 倍**。

---

## 1. 身份（5 行）

| 项 | 值 |
| --- | --- |
| 项目名 | 不委屈（Not委屈） |
| 使命 | 帮善良的人学会有锋芒 |
| 形态 | AI 成长平台（Web / Mobile） |
| 当前阶段 | M1 完成 / M2 PoC 准备中 |
| Dev URL | `http://localhost:3000`（如被占则 :3001）|

---

## 2. 技术栈

| 层 | 技术 |
| --- | --- |
| 框架 | Next.js 15 + TypeScript + App Router |
| UI | TailwindCSS + Shadcn UI + Lucide Icons |
| 后端 | Next.js API Routes + Supabase（待 M2 接入） |
| LLM | MiniMax-M3（OpenAI 兼容协议，`LLM_PROVIDER=openai`） |
| 测试 | Vitest（4 文件 / 22 测试，**跑前必过**） |
| 命令 | `npm run dev` / `npm test` / `npm run typecheck` |

---

## 3. 目录结构（角色 + 关键文件）

### `src/`（应用代码）

| 路径 | 角色 | 关键文件 |
| --- | --- | --- |
| `src/app/page.tsx` | 根重定向（→ `/onboarding`） | — |
| `src/app/(app)/today/` | 技能树主页（v2.0 形态） | `page.tsx` |
| `src/app/(app)/drill/` | 12 步演练（v2.0.5 全选择题） | `page.tsx` |
| `src/app/(app)/conversation/` | 自由对话入口 | `page.tsx` |
| `src/app/(app)/scripts/` | 我的剧本 | `page.tsx` |
| `src/app/(app)/progress/` | 进度（5 段旅程地图） | `page.tsx` |
| `src/app/(app)/settings/` | 设置（LPM / 今日投入 / 推送） | `page.tsx` |
| `src/app/(app)/onboarding/` | 4 步入门 | `page.tsx` |
| `src/app/(app)/crisis/` | 危机兜底页 | `page.tsx` |
| `src/app/api/conversations/` | 自由对话 + 演练 API | `route.ts` / `[id]/messages/route.ts` |
| `src/app/api/scripts/` | 剧本 CRUD | `route.ts` / `[id]/route.ts` |
| `src/app/api/profiles/` | 用户档案 | `route.ts` / `me/route.ts` |
| `src/app/api/progress/` | 进度自报 | `route.ts` |
| `src/app/api/{health,scenarios,milestones,data-requests}/` | 辅助端点 | `route.ts` |

### `src/components/`（共享组件）

| 路径 | 角色 |
| --- | --- |
| `layout/GlobalHeader.tsx` | 顶部：Logo + LPM 入口（默认 ON） |
| `layout/BottomNav.tsx` | 4 Tab 底部：今日 / 自由对话 / 我的剧本 / 我 |
| `layout/ExitPauseBar.tsx` | 演练暂停条 |
| `layout/GlobalFooter.tsx` | 底部"不替代专业" |
| `skilltree/SkillNode.tsx` | 技能节点 6 态（locked/available/in_progress/mastered_basic/mastered_deep/recommended） |
| `conversation/Composer.tsx` | 输入框 |
| `conversation/ChatBubble.tsx` | 消息气泡 |
| `crisis/CrisisBanner.tsx` | 危机兜底 UI |
| `drill/ScenarioCard.tsx` | 场景卡（v2.0.5 后基本不用） |
| `ui/button.tsx` | Shadcn button 包装 |

### `src/lib/`（核心模块）

| 路径 | 角色 | 关键文件 |
| --- | --- | --- |
| `src/lib/ai/orchestrator.ts` | **v2.0.7.1** Router+Skill 合并，1 次 LLM | — |
| `src/lib/ai/cache.ts` | Router 5min 缓存（crisis/drill 不缓存） | — |
| `src/lib/ai/llm-client.ts` | OpenAI 兼容客户端 + failover | — |
| `src/lib/ai/schemas.ts` | Zod schemas + fallback 枚举 | — |
| `src/lib/ai/prompts/unified.ts` | **当前使用的唯一 system prompt** | — |
| `src/lib/ai/prompts/{router,skill-drill,skill-free-dialogue,skill-crisis}.ts` | 备用 prompt（hot-swap 兜底） | — |
| `src/lib/ai/prompts/{analyze,reply}.ts` | ⚠️ **v2.0.7 废弃**（0 引用） | — |
| `src/lib/safety/crisis-detector.ts` | L0 规则层危机检测 | — |
| `src/lib/kb/search.ts` | RAG 占位（标签匹配，生产换 pgvector） | — |
| `src/lib/scenarios-data.ts` | 7 个场景 + StepOptions（PE+KE 签字） | — |
| `src/lib/scripts-store.ts` | 剧本内存 Map（globalThis 共享） | — |
| `src/lib/supabase/` | Supabase client 占位 | — |
| `src/lib/utils/{cn,error,id,ratelimit}.ts` | 工具 | — |

### `prompts/`（v1.0 文档，已不引用）

| 路径 | 状态 |
| --- | --- |
| `prompts/{analyze,reply,journal-summary,growth-report}.md` | ⚠️ 历史文档（6 份，0 引用） |
| `prompts/{coach-not-judging,persona-fewshots}.md` | 备用 |

### `docs/`（按触发条件更新）

| 路径 | 角色 | 触发更新 |
| --- | --- | --- |
| `docs/01-PRD.md` | 产品需求 | 关键节点 / 阶段 |
| `docs/02-Prototype.md` | 原型 + 交互（v2.0.1） | 大版本（v2.0 → v2.0.1）|
| `docs/03-System-Architecture.md` | 架构 | 重大技术决策 |
| `docs/04-Database-Design.md` | schema | schema 变更 |
| `docs/05-API-Design.md` | API 契约 | 端点 / schema 变更 |
| `docs/06-Development-Plan.md` | 研发 WBS | 里程碑切换 |
| `docs/07-Test-Plan.md` | 测试方案 | 新模块上线前 |
| `docs/08-Deployment-Plan.md` | 部署 | 部署环境变化 |
| `docs/09-Roadmap.md` | 路线图 | 里程碑 / 假设验证 |
| `docs/demo-v2.md` | v2 demo 报告（一次性） | 不再更新 |
| `docs/design-review-jobs.md` | Jobs 哲学审查（一次性） | 不再更新 |
| `docs/token-audit.md` | Token 审计（一次性） | 不再更新 |
| `docs/v2.0.7-llm-architecture.md` | v2.0.7 LLM 架构 | 不再更新 |

### `plans/`（规划 + 每日）

| 路径 | 角色 | 更新规则 |
| --- | --- | --- |
| `plans/progress.md` | 整体进度跟踪 | **每个模块完成后** |
| `plans/m2-poc.md` | M2 PoC 详细计划 | 状态机翻转时 |
| `plans/daily/YYYY-MM-DD.md` | 每日 standup | **每个工作日结束前** |
| `plans/daily/README.md` | 每日格式规则 | 格式变化时 |

### `tasks/`（epic 任务）

| 路径 | 状态 | 角色 |
| --- | --- | --- |
| `tasks/epic-01-foundation.md` | 大部分 ✅ | 基础平台 |
| `tasks/epic-02-ai-analysis.md` | 进行中 | AI 分析 |
| `tasks/epic-03-journal.md` | 进行中 | 日记 / 剧本 |
| `tasks/epic-04-growth-report.md` | 进行中 | 成长报告 |

### `knowledge/`（内容库，**不进 LLM 上下文**）

| 路径 | 角色 |
| --- | --- |
| `knowledge/cases/` | 真实场景案例 |
| `knowledge/chunks/` | 知识块（KB） |
| `knowledge/books/` | 心理学书摘 |
| `knowledge/tags/` | 标签体系 |
| `knowledge/prompts/` | 标签分类 / 抽取 prompt |

---

## 4. 治理文档（read once，记住规则）

| 文件 | 必读 | 关键约束 |
| --- | --- | --- |
| `CLAUDE.md` | ✅ 必读 | 8 Agent / 5 阶段工作流 / 红线 |
| `rules/safety.md` | ✅ 必读 | S-1 ~ S-8 安全规则 |
| `rules/governance.md` | ✅ 必读 | 治理原则 |
| `rules/workflow.md` | ✅ 必读 | 5 阶段工作流 |
| `rules/quality.md` | ✅ 必读 | 质量规范 |
| `CHANGELOG.md` | ✅ 必读 | 重要变更历史 |
| `agents/{8 个}.md` | 按需 | 各自 Agent 职责 |

---

## 5. 红线（绝对不能踩）

1. ❌ 心数 / 宝石 / 排行榜 / 打卡天数 / 付费修复 / 催促型推送
2. ❌ "你太软弱 / 你应该 / 你连这都…"
3. ❌ 在危机路径给"怎么办"建议
4. ❌ KB 全文注入 LLM（只传 id）
5. ❌ 完整 history 注入 LLM（用 summary）
6. ❌ 多 Agent 重复消费上下文
7. ❌ 不做安全评审就上线情绪功能
8. ❌ 显示用户 PII（姓名 / 手机 / 身份证）

> 详见 `docs/02-Prototype.md` §16.3 拒绝清单 + `docs/07-Test-Plan.md` §19.6 grep 自检

---

## 6. 常用命令速查

```bash
# 开发
npm run dev              # 起 dev server（:3000 或 :3001）
npm test                 # 跑 22 个测试（必过）
npx tsc --noEmit         # 类型检查

# 拒绝清单自检（CI 必跑）
grep -rEn "heart|lives|gem|coin|leaderboard|league|streak.repair|checkin|失去|丢失|再不来就|你快没了|坚持.*天|打卡" src/ --include="*.ts" --include="*.tsx"

# token 预算监控
grep -E "^export const \w+_SYSTEM" src/lib/ai/prompts/*.ts
```

---

## 7. 不需要看的文件

- `src/.next/` — Next.js 编译产物
- `node_modules/` — 依赖
- `tsconfig.tsbuildinfo` — TS 缓存
- `supabase/migrations/*.sql` — schema 迁移（除非做 BE 工作）
- `prompts/*.md` — v1.0 文档（已不引用）
- `src/lib/ai/prompts/{analyze,reply}.ts` — 已废弃

---

## 8. 任务起点决策树

```
用户给任务
  ↓
1. 读 PROJECT_MAP.md（你正在读）
2. 读 plans/daily/今日.md
3. 读 plans/progress.md 头部
  ↓
判断任务类型
├─ 改 UI → src/app/(app)/<page>/page.tsx + 验证页面 200
├─ 改 API → src/app/api/<endpoint>/route.ts + curl 测
├─ 改 AI → src/lib/ai/orchestrator.ts 或 prompts/unified.ts
├─ 改测试 → src/lib/ai/orchestrator.test.ts + npm test
├─ 改文档 → docs/0X-*.md 或 plans/ 或 CHANGELOG.md
└─ 改 KB → knowledge/（不进 LLM）
  ↓
4. 做完 → 更新 plans/progress.md
5. 重要变更 → 更新 CHANGELOG.md
6. 决策 → 写 docs/decisions/adr-NNN-*.md
7. EOD → 写 plans/daily/今日.md
```

---

> **最后**：每完成一步想"我下次扫什么可以避免？" → 写进 `PROJECT_MAP.md`，让这份地图越来越准。
