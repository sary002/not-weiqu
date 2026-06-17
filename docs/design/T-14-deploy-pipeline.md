# T-14 · 部署流水线 v1（Deployment Pipeline v1）

> **Owner**：Architect（A）+ Backend（BE）联合
> **Reviewer**：PM、Q、C、FE、PE、KE
> **版本**：v0.1（2026-06-17）
> **状态**：调研 + 设计稿（M2 PoC 准备中）
> **关联**：`plans/m2-poc.md` T-14、`docs/08-Deployment-Plan.md` v1.0、`docs/03-System-Architecture.md`、`docs/07-Test-Plan.md` §19.6、`rules/safety.md`
> **约束**：本设计稿不修改 `src/` 下任何源代码；本阶段仅交付 markdown 设计 + 关键 yaml 草案。

---

## 目录

1. [现状分析](#1-现状分析)
2. [候选方案对比](#2-候选方案对比)
3. [推荐方案 + 理由](#3-推荐方案--理由)
4. [环境分层](#4-环境分层-dev--staging--production)
5. [CI 流水线](#5-ci-流水线github-actions)
6. [CD 流水线](#6-cd-流水线)
7. [Secrets 管理](#7-secrets-管理)
8. [监控方案](#8-监控方案)
9. [部署 checklist（11 项）](#9-部署-checklist11-项)
10. [关键脚本片段](#10-关键脚本片段github-actions-yaml--100-行)
11. [风险点](#11-风险点)
12. [附录：术语 / 决策追溯](#12-附录)

---

## 1. 现状分析

### 1.1 当前部署形态

| 项 | 现状 |
| --- | --- |
| 运行形态 | **本地 `npm run dev` only**（dev 单机） |
| CI/CD | **无**（仓库 `.github/` 不存在，无 `workflows/`） |
| 容器化 | **无 Dockerfile / docker-compose** |
| 生产域名 | **无**（仅 `http://localhost:3000`） |
| 数据库 | Supabase 占位（`src/lib/supabase/`），未实际接入生产实例 |
| 监控 | **无** |
| Secrets 管理 | **`.env.local` 明文 key**（被 `.gitignore` 忽略，但本地裸存，**无集中托管**） |
| 测试 | Vitest 4 文件 / 22 测试（`npm test` 本地可跑） |

### 1.2 关键事实

- `package.json` 提供 `dev / build / start / lint / typecheck / test / db:migrate` 七条命令。
- `next.config.js` 仅设置安全响应头（X-Frame / X-Content-Type / Referrer-Policy / Permissions-Policy），无 `output: 'standalone'`、无 `images`、无 `rewrites`。
- `.env.example` 暴露 8 类变量：`NEXT_PUBLIC_SUPABASE_*`、`SUPABASE_SERVICE_ROLE_KEY`、`LLM_PROVIDER / LLM_API_KEY / LLM_BASE_URL / LLM_MODEL`、`LLM_API_KEY_BACKUP / LLM_BASE_URL_BACKUP`、`NEXT_PUBLIC_CRISIS_HOTLINE_BJ`、`NEXT_PUBLIC_APP_URL`。
- 真正敏感的只有 `LLM_API_KEY` / `LLM_API_KEY_BACKUP` / `SUPABASE_SERVICE_ROLE_KEY`；其余 `NEXT_PUBLIC_*` 本质公开但需走 build 注入。
- 红线用例 `docs/07-Test-Plan.md §19.6` 的 `grep` 拒绝清单**目前仅靠人工本地执行**，没有 CI 阻断。
- 当前仓库存在 `8e95428 feat: 竞品参考研究 + reply pipeline 全链路闭环` 等提交，处于**多 Agent 并行 PoC 阶段**，需要 CI 来兜底质量。

### 1.3 痛点

| 痛点 | 影响 |
| --- | --- |
| 任何人本地 push 都可能未跑 lint/typecheck/test | 红线用例静默流入 main |
| `.env.local` 明文 key 散落在工程师本机 | **P0 风险**：离职 / 机器丢失 → key 泄露 |
| 无 preview 环境 | 5 人封闭试用阶段无隔离 |
| 无镜像构建 → 部署形态未定型 | M3 接入真实用户前必堵 |
| 无监控 → LLM 调用失败 / 危机路径失败无人感知 | **直接踩红线 S-3「危机兜底必须可达」** |

---

## 2. 候选方案对比

### 2.1 三个候选

| 维度 | A. Vercel（托管） | B. 自托管 Docker（VPC） | C. 混合（Vercel 跑 Web + 自托管跑 LLM 编排） |
| --- | --- | --- | --- |
| **匹配 M2 需求** | 完美（PoC 体量） | 重 | 较重 |
| **接入成本（人日）** | 1~2 | 8~15 | 10~18 |
| **CI/CD 内置** | ✅ 内置 Git 集成 | 需自建 | 需自建（Web 部分可走 Vercel） |
| **Preview 环境** | ✅ 每个 PR 自动 preview URL | 需自建（ngrok / tunnel） | ✅ Web preview 自动 |
| **Secrets 管理** | ✅ Vercel Env（按 env 分层） | ❌ 需自建 KMS / Vault | ✅ Web 走 Vercel，BE 走 KMS |
| **VPC / 数据驻留** | ❌ Vercel 默认海外 region | ✅ 完全可控 | ✅ BE 部分可控 |
| **镜像供应链** | ❌ 黑盒 | ✅ Trivy / cosign 可控 | ⚠️ 半控 |
| **危机路径独立部署** | ❌ 与主应用共享 runtime | ✅ 独立 namespace | ✅ BE 部分独立 |
| **监控** | ✅ Vercel Analytics 内置 | ❌ 需自建 | ⚠️ 混合 |
| **合规（中国大陆）** | ⚠️ 需 Enterprise ICP | ✅ 完全可控 | ⚠️ 混合 |
| **回滚** | ✅ 一键回滚 | 需脚本 | 需脚本（Web 部分一键） |
| **月费估算（M2 PoC）** | $0（hobby 免费层够用） | $30~80（单台 VPS） | $30~80 + Vercel 免费层 |

### 2.2 评分矩阵（满分 5）

| 维度（权重） | A. Vercel | B. 自托管 Docker | C. 混合 |
| --- | --- | --- | --- |
| M2 接入速度（30%） | **5** | 1 | 2 |
| 满足 `08-Deployment-Plan.md` 长期目标（20%） | 2 | **5** | 4 |
| Secrets 安全（15%） | **5** | 3 | 4 |
| 危机路径隔离（15%） | 2 | **5** | 4 |
| 可观测（10%） | **5** | 3 | 3 |
| 成本（M2）（10%） | **5** | 3 | 3 |
| **加权总分** | **4.10** | 3.15 | 2.95 |

### 2.3 长期收敛

- `docs/08-Deployment-Plan.md` v1.0 描述的是**生产级目标态**（KMS + 多 AZ + cosign + 季度演练），与 M2 PoC 体量差距大。
- M2 阶段选 A，M3 末视用户量与合规需求向 C / B 迁移；**所有 CI 步骤与 secrets 抽象按 B 的形态设计**，从 A 迁移到 B 时只换 runtime，不换 pipeline。

---

## 3. 推荐方案 + 理由

### 3.1 推荐：**A. Vercel（托管）作为 M2 PoC 部署形态**

**结论**：M2 PoC 阶段全量采用 Vercel（Web + API Routes + Edge Middleware），**自托管只跑危机路径本地兜底文案**（静态 JSON，不带 LLM）。

### 3.2 理由

1. **接入成本极低**：1~2 人日可上线，匹配 50 人日预算。
2. **天然 Preview URL**：5 人封闭试用阶段每人独立 URL，互不污染状态。
3. **Secrets 集中**：`.env.local` 明文 key → Vercel Project Env（按 dev / preview / production 分层），**一次性解决 P0 key 泄露风险**。
4. **内置 Analytics**：足够支撑监控章节「基础（PV / Web Vitals）」部分。
5. **危机路径兜底文案可走静态资源**：`/crisis` 页面与 hotline 文案打成 build artifact，不依赖任何 runtime key，**满足 S-3「危机路径独立」最小形态**。
6. **回滚一键**：每次部署即一个 immutable deployment，回滚 = 切回前一个 deployment（30 秒内完成）。

### 3.3 不选 B / C 的原因

- **B 自托管 Docker**：M2 阶段 8~15 人日投入 ROI 极低；`docs/08-Deployment-Plan.md` 的多 AZ / KMS / cosign 等能力 M3+ 再做。
- **C 混合**：复杂度 ≈ B 的 1.5 倍，但收益与 A 几乎重合（Vercel 已覆盖 preview / 监控 / 一键回滚），M2 不划算。

### 3.4 未来迁移路径（M3+ 占位）

```
A (M2) → A+C (M3 接入真实用户) → B (M4 合规 / 独立部署)
   │            │                          │
Vercel     + 自托管 LLM 编排          全量自托管 Docker
           (KMS + cosign)
```

---

## 4. 环境分层：dev / staging / production

### 4.1 三层模型（M2 PoC）

| 环境 | 形态 | URL | 数据 | 谁触发 | 谁能访问 |
| --- | --- | --- | --- | --- | --- |
| **dev** | 工程师本机 `npm run dev` | `http://localhost:3000` | 合成 / mock LLM | 工程师本地 | 工程师 |
| **staging**（= Vercel Preview） | Vercel Preview Deployment | `https://not-wei-qu-git-<branch>.vercel.app` | Supabase staging project（独立 project）+ LLM 真实 key | PR / push to 非 main | PM + Q + 封闭试用 5 人 |
| **production** | Vercel Production Deployment | `https://notwei.quotwait.me`（占位，待 PM 定） | Supabase production project + LLM production key | 合并 main 后**手动审批** | 所有真实用户 |

> 备注：staging 与 production **必须使用不同的 Supabase project 与不同的 LLM API key**，防止 staging 测试污染 prod 数据 / 跑爆 LLM 配额。

### 4.2 环境边界硬规则

| 规则 | 说明 |
| --- | --- |
| R-ENV-1 | staging 不得调用 production 任何外部服务 |
| R-ENV-2 | production 任何配置变更走 PR + 双人 Review |
| R-ENV-3 | 危机路径兜底文案（hotline / 医院 / 紧急联系人）每个环境独立维护 |
| R-ENV-4 | `NEXT_PUBLIC_APP_URL` 在三个环境必须不同（避免 CORS 与回调错位） |
| R-ENV-5 | `LLM_TIMEOUT_MS` 在 staging 设 10s（fail-fast），production 设 30s |

### 4.3 与 `08-Deployment-Plan.md` v1.0 的差异

- M2 跳过 `canary` 灰度层（Vercel 无原生按租户灰度，M3+ 走 `LaunchDarkly` 或自建 Feature Flag）。
- M2 跳过 `ci` 独立环境（Vercel 的 build = ci）。
- M2 `staging = preview`，与 v1.0 文档语义一致但实现路径不同。

---

## 5. CI 流水线（GitHub Actions）

### 5.1 触发矩阵

| 事件 | 触发 job | 阻断条件 |
| --- | --- | --- |
| `pull_request`（任意分支） | `lint` / `typecheck` / `test` / `security-grep` | 任一失败 → PR 红 ×，不可 merge |
| `pull_request`（含 `src/lib/ai/**`） | 增跑 `prompt-eval`（评测集 v0.5） | 失败 → 标 ⚠️ 但不阻断（PE 决策） |
| `push` to `main` | `build` + `deploy-staging` | 失败 → main 标红，立即回滚 PR |
| `workflow_dispatch` + 标签 `deploy-prod` | `deploy-production` | 必须含 `inputs.approver`（手动审批） |

### 5.2 强制执行的 5 步

| # | 步骤 | 命令 | 阻断？ |
| --- | --- | --- | --- |
| 1 | Lint | `npm run lint` | ✅ 红线 |
| 2 | Typecheck | `npm run typecheck` | ✅ 红线 |
| 3 | Test | `npm test` | ✅ 红线 |
| 4 | Build | `npm run build` | ✅ 红线 |
| 5 | **拒绝清单 grep** | 见下方 | ✅ **P0 红线** |

**拒绝清单 grep（5 类）**：

```bash
# 1. 红线词汇（必须 0 命中）
grep -rEn "heart|lives|gem|coin|leaderboard|league|streak.repair|checkin|失去|丢失|再不来就|你快没了|坚持.*天|打卡" src/ --include="*.ts" --include="*.tsx"

# 2. 刺激性 / 评判性话术
grep -rEn "你太软弱|你应该|你连这都|你怎么还不|你必须|你就不能" src/

# 3. PII 字段（姓名 / 手机 / 身份证 / 真实邮箱正则）
grep -rEn "idCard|身份证|实名|真实姓名|realName" src/

# 4. KB 全文注入（KB 块必须只传 id）
grep -rEn "knowledge/chunks/.*\.md" src/lib/ai/

# 5. 明文 API key（兜底防 .env.local 误提交）
grep -rEn "sk-[a-zA-Z0-9]{20,}|sk-or-[a-zA-Z0-9]{20,}" src/
```

任一命中 → CI 红 ×，PR 不可 merge。

### 5.3 并行与缓存策略

```yaml
strategy:
  matrix: { step: [lint, typecheck, test, build] }
  fail-fast: true
cache:
  key: ${{ hashFiles('package-lock.json') }}
  path: ~/.npm
```

5 步并发执行（除 `build` 依赖前 3 步绿灯），目标：**单 PR 端到端 CI ≤ 6 分钟**。

---

## 6. CD 流水线

### 6.1 staging 自动部署（Vercel Git Integration）

```
PR merged to main
    │
    ▼
Vercel 自动 build + 部署到 staging URL
    │
    ▼
自动跑 Vercel 上的 Build Output（npm test 由 GitHub Actions 跑，不重复）
    │
    ▼
PM / Q 在 staging URL 做 5 人封闭试用前的 smoke test
```

- 触发：Vercel 检测到 main 分支变更 → 自动部署。
- 不需要 GitHub Actions 介入（Vercel Git Integration 接管）。
- 若 staging smoke test 失败 → 回滚 staging → main revert PR → 红 × 邮件通知。

### 6.2 production 手动审批

```
PM / C 在 GitHub 上创建 manual dispatch
    │
    ▼
必须填入 inputs.approver（≥ 1 人）
    │
    ▼
GitHub Environment "production" 配置 required reviewers ≥ 1
    │
    ▼
Reviewer 在 GitHub UI 点 Approve
    │
    ▼
GitHub Actions 触发 Vercel Deploy Hook（带环境变量 production）
    │
    ▼
部署完成后自动跑「9. 部署 checklist」第 1~3 项
```

**关键控制点**：
- Vercel **Deploy Hook** URL 存为 GitHub Secret `VERCEL_DEPLOY_HOOK_PROD`。
- production 部署**不直接走 git push 触发**，避免 main 任意 push 都自动上 prod。
- 每次 production 部署必须填 `CHANGELOG.md` 条目（由 PM 验收）。

### 6.3 回滚预案

| 触发场景 | 操作 | SLA |
| --- | --- | --- |
| staging 烟雾测试失败 | Vercel UI 一键回滚到上一 deployment | ≤ 2 min |
| production LLM 全挂 | Vercel UI 一键回滚 + 触发 Feature Flag「关闭 AI 输出」 | ≤ 5 min |
| production 危机路径失败 | Vercel UI 一键回滚 + 立即 P0 告警 | ≤ 1 min |
| 任意 production 数据污染 | staging 演练 → 修复 → production 重新部署（不回滚数据） | ≤ 1h |

---

## 7. Secrets 管理

### 7.1 三种方案对比

| 维度 | A. Vercel Env | B. GitHub Secrets | C. Vault（自建 KMS） |
| --- | --- | --- | --- |
| 接入成本 | 极低（UI 配置） | 低（UI + yaml `${{ secrets.X }}`） | 高（自建 / 部署 Vault server） |
| 加密 | Vercel 托管 KMS | GitHub 托管 KMS | 自管 AES-256 |
| 分层（dev/preview/prod） | ✅ 天然支持 | ⚠️ 需手动分组 | ✅ policy 灵活 |
| 轮转 | UI 一键 | UI 一键 | 需脚本 |
| 审计 | Vercel dashboard | GitHub audit log | Vault audit log |
| 与 runtime 集成 | ✅ 自动注入 build env | 需 CI 写入 env 再 build | 需 sidecar 注入 |
| M2 适合度 | **✅ 完美** | ⚠️ 可作 fallback | ❌ 重 |

### 7.2 推荐：**A. Vercel Env（主） + B. GitHub Secrets（辅，仅 CI 用）**

| 类型 | 存储位置 | 注入方式 |
| --- | --- | --- |
| `LLM_API_KEY` | Vercel Env（production / preview 分开） | Vercel 自动注入 runtime |
| `LLM_API_KEY_BACKUP` | Vercel Env | Vercel 自动注入 runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel Env | Vercel 自动注入 runtime（**仅 server side**） |
| `LLM_PROVIDER` / `LLM_BASE_URL` / `LLM_MODEL` | Vercel Env | 自动注入 |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel Env | 自动注入（NEXT_PUBLIC_ 前缀会进 bundle，仅放可公开值） |
| `NEXT_PUBLIC_CRISIS_HOTLINE_BJ` | Vercel Env | 自动注入 |
| `VERCEL_DEPLOY_HOOK_PROD` | **GitHub Secrets** | `${{ secrets.VERCEL_DEPLOY_HOOK_PROD }}` |
| `VERCEL_TOKEN` | **GitHub Secrets** | `${{ secrets.VERCEL_TOKEN }}` |
| `LLM_API_KEY_E2E`（仅 CI 跑 eval set 用） | **GitHub Secrets** | CI 注入 ephemeral env |

### 7.3 关键动作清单（M2 部署前必做）

1. 把当前 `.env.local` 中的所有 key **逐项迁移**到 Vercel Project Settings → Environment Variables。
2. `.env.local` 保留为本地 dev 用（不进 git 即可），但加 `.env.local.README.md` 说明「真值在 Vercel」。
3. GitHub Secrets 中预置 `VERCEL_TOKEN` + `VERCEL_DEPLOY_HOOK_PROD`。
4. **轮转计划**：M2 阶段不轮转（M2 周期 ≤ 8 周），M3 接入真实用户前强制轮转一次，**之后每 90 天轮转**（与 `08-Deployment-Plan.md §7.2` 对齐）。
5. **离职审计**：每次有工程师离职，立即在 Vercel 重置所有 env（UI 一键 regenerate），GitHub Secrets 同样。

### 7.4 「明文 key」风险解除度

- ✅ **核心 server key**（`LLM_API_KEY`、`SUPABASE_SERVICE_ROLE_KEY`）— 100% 解除（全部走 Vercel 托管 KMS，不再落本地明文）。
- ⚠️ **NEXT_PUBLIC_\*** — 必然进前端 bundle，本来就是公开语义，不算泄露。
- ⚠️ **本地 `.env.local`** — 仍是明文，但仅本机使用 + `.gitignore` 已生效。**不视为泄露**（仓库 0 风险），但要求工程师按 `.env.example` 填写占位，**真实 key 在 Vercel**。

---

## 8. 监控方案

### 8.1 两层监控

| 层 | 工具 | 内容 |
| --- | --- | --- |
| **基础（Web / 平台）** | Vercel Analytics + Vercel Speed Insights | PV / UV / Web Vitals（LCP / FID / CLS）/ 部署健康度 / 错误率 |
| **LLM 调用监控（自建）** | Vercel Logs + 自建 metrics middleware（写 Supabase 表） | token 用量 / 失败率 / 截断率 / 主备切换次数 / 首 token 延迟 |

### 8.2 LLM 监控指标（M2 必跑）

| 指标 | 采集方式 | 阈值 | 告警等级 |
| --- | --- | --- | --- |
| LLM 调用总次数 | `lib/ai/llm-client.ts` middleware +1 | — | — |
| Token 用量（input / output 分开） | 解析 OpenAI 兼容响应 `usage` 字段 | 单日 > 1M tokens | P1 |
| 失败率（5xx / 超时 / 解析失败） | 累计 / 总数 | > 1% 持续 5min | P1 |
| 截断率（finish_reason=length） | 同上 | > 5% | P2 |
| 主备切换次数 | 检测 primaryKey 命中数 vs backupKey | 任意 5min 窗口 ≥ 3 次 | P0 |
| 首 token 延迟（streaming） | timing middleware | > 3s 持续 5min | P1 |
| **危机路径调用失败** | route 单独埋点 | **任意 1 次失败** | **P0** |
| 危机路径调用次数 | route 单独埋点 | — | — |

### 8.3 数据落地

- LLM 监控写入 Supabase `llm_metrics` 表（schema M2 末追加，与 `04-Database-Design.md` 同步）。
- Vercel Analytics 数据存 Vercel 后台（30 天 retention），M3+ 接 Datadog / Grafana。
- 告警通道（M2 阶段）：邮件 + 飞书 webhook（Webhook URL 存 Vercel Env）。

### 8.4 与 `08-Deployment-Plan.md §10` 的差异

- M2 跳过 Prometheus / Grafana / Loki / Jaeger（重），改用 Vercel 内置 + Supabase 表 + 邮件告警。
- M2 跳过「错误率 > 1%」的完整 APM（Vercel Web Vitals 近似覆盖）。
- M2 **保留「危机路径失败 = P0 即时告警」**这一硬要求（直接踩 S-3 红线）。

---

## 9. 部署 checklist（11 项）

> **任何 production 部署前必跑**。CI 自动跑 1~3，人工跑 4~11。

| # | 项 | 执行人 | 是否阻断 |
| --- | --- | --- | --- |
| 1 | `npm run lint` 通过 | CI | ✅ |
| 2 | `npm run typecheck` 通过 | CI | ✅ |
| 3 | `npm test` 22 测试全绿 | CI | ✅ |
| 4 | 拒绝清单 grep 5 类 0 命中 | CI | ✅ |
| 5 | `CHANGELOG.md` 本次版本条目已写 | PM | ✅ |
| 6 | staging URL 5 人封闭试用 smoke test 通过 | PM + Q | ✅ |
| 7 | 危机路径手工触发 1 次（输入「不想活了」→ 兜底页 OK） | Q | ✅ |
| 8 | Vercel Env 三层（dev / preview / production）配置就绪 | BE | ✅ |
| 9 | GitHub Secrets（`VERCEL_TOKEN` / `VERCEL_DEPLOY_HOOK_PROD`）已配 | BE | ✅ |
| 10 | 回滚预案演练：上一次 deployment URL 记入发布纪要 | C | ✅ |
| 11 | 监控告警通道（邮件 + 飞书）测试告警收到 | BE | ✅ |

---

## 10. 关键脚本片段（GitHub Actions yaml，≤ 100 行）

> 文件路径建议：`.github/workflows/ci.yml`
> 完整 yaml 由 BE 在 T-14 实施阶段落地；本设计稿仅给草案。

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: Typecheck
        run: npm run typecheck

      - name: Test
        run: npm test

      - name: Build
        run: npm run build

      - name: Red-line grep (gamification)
        run: |
          ! grep -rEn "heart|lives|gem|coin|leaderboard|league|streak.repair|checkin|失去|丢失|再不来就|你快没了|坚持.*天|打卡" src/ --include="*.ts" --include="*.tsx"

      - name: Red-line grep (judgment)
        run: |
          ! grep -rEn "你太软弱|你应该|你连这都|你怎么还不|你必须|你就不能" src/

      - name: Red-line grep (PII)
        run: |
          ! grep -rEn "idCard|身份证|实名|真实姓名|realName" src/

      - name: Red-line grep (KB full-injection)
        run: |
          ! grep -rEn "knowledge/chunks/.*\.md" src/lib/ai/

      - name: Red-line grep (plain key leak)
        run: |
          ! grep -rEn "sk-[a-zA-Z0-9]{20,}|sk-or-[a-zA-Z0-9]{20,}" src/

  deploy-staging:
    needs: ci
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Vercel Git Integration handles auto-deploy"

  deploy-production:
    needs: ci
    if: github.event_name == 'workflow_dispatch' && contains(github.event.inputs.tag, 'deploy-prod')
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://notwei.quotwait.me
    steps:
      - name: Trigger Vercel production deploy hook
        run: |
          curl -X POST "${{ secrets.VERCEL_DEPLOY_HOOK_PROD }}"
        env:
          HOOK: ${{ secrets.VERCEL_DEPLOY_HOOK_PROD }}
```

> 行数：约 75 行（含空行与注释），符合「≤ 100 行」约束。

---

## 11. 风险点

| # | 风险 | 等级 | 触发场景 | 缓解 |
| --- | --- | --- | --- | --- |
| R-1 | **`.env.local` 明文 key 散落** | P0 | 工程师本机丢失 / 离职未清 | 核心 key 迁移至 Vercel Env（§7.3 第 1 项），离职时一键 regenerate；`.env.local` 仅保留 dev 占位 |
| R-2 | **回滚困难** | P1 | Vercel deployment 已被新版本覆盖 | 每次部署自动归档最近 5 个 deployment 至 Vercel 「Instant Rollback」列表；production 强制 keep last 10 |
| R-3 | **跨域 CORS** | P1 | 未来接 Supabase / 第三方 API | `next.config.js` 加 `images.remotePatterns` + API Route 显式 `Access-Control-Allow-Origin`（按 §4.2 R-ENV-4 三环境不同 origin） |
| R-4 | 危机路径 LLM 全挂 | P0 | 主备 LLM 同时宕机 | 危机路径**不调用 LLM**，仅返回静态兜底文案（hotline + 医院 + 紧急联系人），与 LLM 解耦 |
| R-5 | CI 误阻断 | P2 | 红线 grep 误命中 | 5 类 grep 全部在 PR 模板列出 + `.gitignore` 误命中可走 `paths-ignore` 例外 |
| R-6 | Vercel 免费层额度耗尽 | P2 | M3 接入真实用户后流量上涨 | M2 末评估是否升 Pro；超阈值前 7 天告警 |
| R-7 | Preview URL 泄露 | P2 | 陌生人拿到 preview URL | Vercel Preview 默认公开 → 加 `VERCEL_PASSWORD_PROTECTION`（仅 staging 启用） |
| R-8 | LLM API key 被滥用 | P0 | key 泄露 → 第三方恶意调用 | 启用 LLM provider 的 rate limit + IP 白名单；M3+ 接 Datadog 异常流量告警 |
| R-9 | 部署中数据库迁移冲突 | P1 | staging 与 production schema 不一致 | 严格走 `npm run db:migrate`；production 迁移走单独 PR（不在常规部署 PR 内） |
| R-10 | `.env.example` 注释里的示例 key 误用 | P2 | 工程师复制 `.env.example` → `.env.local` 没改占位 | `.env.example` 必须以 `your-xxx` 占位 + 顶部 banner 警告「不要提交真值」 |

---

## 12. 附录

### 12.1 术语

| 术语 | 含义 |
| --- | --- |
| **Preview Deployment** | Vercel 每个非 main 分支 push 自动部署的临时环境 |
| **Instant Rollback** | Vercel 一键回滚到任意历史 deployment（≤ 30s） |
| **Feature Flag** | 远程开关，可在不部署的情况下关闭某功能 |
| **KMS** | Key Management Service（密钥托管服务） |

### 12.2 决策追溯

| 决策 | 出处 |
| --- | --- |
| 拒绝清单 5 类 grep | `docs/07-Test-Plan.md` §19.6 + `PROJECT_MAP.md §5 红线 1-8` |
| 危机路径失败 = P0 | `rules/safety.md` S-3 + `08-Deployment-Plan.md §10.2` |
| staging 与 production 必须独立 project / key | `08-Deployment-Plan.md §4.1` + `04-Database-Design.md` |
| 轮转周期 90 天 | `08-Deployment-Plan.md §7.2` |
| 11 项 checklist 思路 | `08-Deployment-Plan.md §15.1 发布 Runbook` |
| 无 K8s / 无 Prometheus | `08-Deployment-Plan.md §3.1`（MVP 不引入） |

### 12.3 不在本设计稿范围

- ❌ 多 Region / 多 AZ（`08 §3.2` 留待 M4）
- ❌ K8s / Argo CD（`08 §5.3` 视选型）
- ❌ cosign 镜像签名（`08 §6`，M3+ 视部署形态再定）
- ❌ APM / Distributed Tracing（`08 §10.1`，M3+ 接 Datadog）
- ❌ 季度灾备演练（`08 §11`，M2 不适用）
- ❌ WAF / Bot 防护（`08 §12.1`，M3+ 接 Cloudflare 或自建）
- ❌ 跨境合规（`08 §12.3`，M2 PoC 仅国内 5 人封闭）

### 12.4 Follow-up（待后续 task 跟进）

| ID | 项 | 建议 Owner | 触发时机 |
| --- | --- | --- | --- |
| FU-1 | 真正实施 `.github/workflows/ci.yml`（含 5 类 grep） | BE | T-14 实施阶段 |
| FU-2 | Vercel Project 创建 + Env 全量配置 | BE | T-14 实施阶段 |
| FU-3 | `.env.local` 真实 key 全部迁 Vercel | BE + C | T-14 实施阶段（**P0**） |
| FU-4 | 飞书 webhook 告警通道搭建 | BE | T-14 实施阶段 |
| FU-5 | LLM metrics 表 schema（`04-Database-Design.md` 追加） | BE + KE | M2 末 |
| FU-6 | staging smoke test 模板（5 人封闭试用前） | Q + PM | T-17 启动前 |
| FU-7 | production 域名购买 + ICP 备案（如需） | PM + C | M3 启动前 |
| FU-8 | 回滚预案演练（Instant Rollback 真实触发一次） | C + BE | T-14 实施后第一次 staging 部署 |
| FU-9 | 离职审计流程文档化（Vercel Env + GitHub Secrets regenerate） | C | 第一个工程师离职前 |
| FU-10 | M3+ 形态评估（是否升 Pro / 何时转自托管） | A | M2 末 |

---

> **签收**：本设计稿由 A + BE 联合产出，PM / Q / C 在 T-14 验收阶段评审。**所有源代码变更留待实施阶段执行。**