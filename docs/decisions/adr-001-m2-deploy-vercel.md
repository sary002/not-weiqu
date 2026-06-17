# ADR-001: M2 PoC 部署形态选 Vercel 托管

- **状态**：Proposed
- **日期**：2026-06-17
- **决策者**：A（主）+ BE（联合）
- **影响模块**：部署 / 监控 / Secrets / CI/CD
- **触发**：M2 PoC 需端到端跑通 + 5 人封闭试用；当前部署形态仅本地 `npm run dev`

---

## 背景

### 现状

| 项 | 值 |
| --- | --- |
| 运行形态 | 本地 `npm run dev` only |
| CI/CD | 无（`.github/workflows/` 不存在） |
| 数据库 | Supabase 占位，未接入生产实例 |
| Secrets | `.env.local` 明文 key（被 `.gitignore` 忽略，但本地裸存） |
| 监控 | 无 |
| 测试 | Vitest 22 测试，本地可跑 |

### 痛点

| # | 痛点 | 影响 |
| --- | --- | --- |
| P-1 | `.env.local` 明文 key 散落 | **P0 风险**：工程师离职 / 机器丢失 → key 泄露 |
| P-2 | 任何人本地 push 都可能未跑 lint/typecheck/test | 红线用例静默流入 main |
| P-3 | 无 preview 环境 | 5 人封闭试用无隔离 |
| P-4 | 无监控 | LLM 调用失败 / 危机路径失败无人感知（**踩 S-3 红线**） |
| P-5 | 无镜像 / 部署形态未定型 | M3 接入真实用户前必堵 |

### 关键约束

- M2 周期 ≤ 8 周，工期 50 人日（含 PoC + 验证）
- 5 人封闭试用需独立 URL 互不污染状态
- 必须解除 P-1 的 P0 key 泄露风险
- 危机路径必须 **不依赖任何 runtime key**（满足 `rules/safety.md` S-3）

---

## 备选

### 选项 A：Vercel 托管（Web + API Routes + Edge Middleware 全量上 Vercel）

- **优点**：
  - 1~2 人日接入（占 M2 50 人日的 ~3%）
  - 天然 Preview URL，每个 PR 独立 URL
  - Vercel Env 按 dev / preview / production 分层（**一次性解除 P-1**）
  - 内置 Analytics（PV / Web Vitals / 错误率）
  - 一键回滚到任意历史 deployment（≤ 30s）
- **缺点**：
  - 海外 region 默认（合规需 Enterprise ICP）
  - 黑盒 runtime，镜像供应链不可控
  - 与 LLM provider 的网络路径可能绕路（延迟 +5~50ms）
- **成本**：M2 阶段 $0（hobby 免费层够用）

### 选项 B：自托管 Docker（VPC + 自建 CI）

- **优点**：
  - 完全可控（数据 / 镜像 / runtime）
  - 危机路径独立 namespace
  - 合规可控（国内 ICP / 等保）
- **缺点**：
  - 8~15 人日接入（占 M2 预算 16%~30%）
  - 需自建 CI / KMS / Vault / 监控
  - Preview 环境需 ngrok / tunnel
- **成本**：$30~80/月（单台 VPS）

### 选项 C：混合（Vercel 跑 Web + 自托管跑 LLM 编排）

- **优点**：
  - Web 部分享受 Vercel 便利
  - LLM 编排独立可控
- **缺点**：
  - 复杂度 ≈ B 的 1.5 倍
  - 跨环境网络依赖 + 调试成本
- **成本**：$30~80/月 + Vercel 免费层

### 选项 D：不做事

- **优点**：0 成本
- **缺点**：
  - M2 PoC 无法跑通（无 preview / 无 5 人试用环境）
  - P-1 安全风险持续
  - 项目 M2 阶段失败风险极高
- **成本**：**项目级失败**

---

## 决策

我们选择 **选项 A（Vercel 托管）**，理由（按重要性排序）：

1. **接入成本极低**：1~2 人日 vs 50 人日预算（3%），其余选项都吃预算 16%+。
2. **天然 Preview URL 支撑 5 人封闭试用**：每个 PR / 每个分支独立 URL，互不污染状态。
3. **Vercel Env 一次性解除 P-1**：核心 server key（`LLM_API_KEY` / `SUPABASE_SERVICE_ROLE_KEY`）迁 Vercel 托管 KMS，本地 `.env.local` 降级为 dev 占位。
4. **危机路径不依赖 runtime**：危机页 + hotline 文案打成 build artifact 的静态资源，**满足 S-3「危机路径独立」最小形态**——即使 LLM 全挂，危机页仍可达。
5. **CI/CD 与 Secrets 抽象按"易迁移"设计**：所有 CI 步骤、Secrets 抽象按 B 形态设计，从 A 迁移到 B 时只换 runtime，**不换 pipeline**。

### 不选 B / C 的原因

- **B**：M2 阶段 ROI 极低；多 AZ / KMS / cosign 等能力 M3+ 再做。
- **C**：复杂度 ≈ B × 1.5，但收益与 A 几乎重合（Vercel 已覆盖 preview / 监控 / 一键回滚），M2 不划算。

### 不选 D 的原因

- M2 PoC 必须端到端跑通才能验证假设（H-001 场景演练 > 纯科普 / H-003 不说教 > 金句），不做 = 项目失败。

---

## 后果

### 得到

- ✅ CI/CD 全自动（GitHub Actions 跑 5 步 + 5 类红线 grep 阻断合并）
- ✅ 每个 PR 独立 Preview URL
- ✅ Secrets 集中托管（Vercel Env + GitHub Secrets）
- ✅ 基础监控（Vercel Analytics + Web Vitals + 错误率）
- ✅ 一键回滚到任意历史 deployment（≤ 30s）
- ✅ `.env.local` P0 风险 100% 解除（核心 server key 不再本地明文）

### 失去

- ❌ 数据自主权（用户数据走 Vercel + Supabase）
- ❌ 镜像供应链控制（无法 cosign 签名 / SBOM）
- ❌ 中国大陆 ICP 备案能力（M2 阶段不需，M3+ 真实用户前必须解决）
- ❌ 多 Region / 多 AZ 容灾

### 风险

| ID | 风险 | 等级 | 缓解 |
| --- | --- | --- | --- |
| R-1 | Vercel 服务中断 | P1 | crisis 路径不依赖 runtime；回滚 ≤ 5min |
| R-2 | Vercel 免费层额度耗尽（M3+） | P2 | M2 末评估升 Pro；阈值前 7 天告警 |
| R-3 | 海外 region 延迟 | P2 | LLM provider 选近 Vercel region 的节点 |
| R-4 | Preview URL 泄露 | P2 | 加 `VERCEL_PASSWORD_PROTECTION`（staging only） |
| R-5 | LLM API key 被滥用 | P0 | LLM provider rate limit + IP 白名单；M3+ Datadog 异常流量告警 |

### 回滚条件

满足任一即启动迁移评估（写 ADR-002）：

- M3 末用户量 > 1K DAU
- 需要中国大陆 ICP 备案 / 等保合规
- Vercel 月费 > $200（Pro 升级 ROI 不划算）
- Vercel 连续 2 次 ≥ 1h 不可用

回滚路径：**A → A+C（M3 接入真实用户，LLM 编排先独立）→ B（M4 合规驱动）**

---

## 安全与合规自检

- [x] **是否涉及 PII？**
  - 否（部署形态决策，不直接处理 PII）
  - 但 P-1 key 泄露风险已通过 Vercel Env 缓解
- [x] **是否影响用户情绪安全？**
  - 否（crisis 路径反而因为不依赖 runtime 而更稳）
- [x] **是否需要 Q 红线用例？**
  - 是：CI 必须阻断 5 类红线 grep（gamification / judgement / PII / KB 全文注入 / 明文 key）
  - 见 `docs/design/T-14-deploy-pipeline.md §5.2`

---

## 实施 checklist（M2 部署前必做）

| # | 项 | Owner | 阻断 |
| --- | --- | --- | --- |
| 1 | 创建 Vercel Project，关联 GitHub repo | BE | ✅ |
| 2 | Vercel Env 三层（dev / preview / production）配置就绪 | BE | ✅ |
| 3 | 当前 `.env.local` 所有 key 逐项迁移至 Vercel Env | BE + C | ✅ |
| 4 | GitHub Secrets 预置 `VERCEL_TOKEN` + `VERCEL_DEPLOY_HOOK_PROD` | BE | ✅ |
| 5 | 创建 `.github/workflows/ci.yml`（5 步 + 5 类红线 grep） | BE | ✅ |
| 6 | 配置 GitHub Environment `production` + required reviewers | C | ✅ |
| 7 | 配置飞书 webhook 告警通道（crisis 路径失败 P0 即时通知） | BE | ✅ |
| 8 | staging 部署 + 5 人封闭试用 smoke test 通过 | PM + Q | ✅ |

---

## 关联

- **设计稿**：`docs/design/T-14-deploy-pipeline.md`（531 行）
- **长期规划**：`docs/08-Deployment-Plan.md` v1.0（M4+ 生产级目标态）
- **任务**：`plans/m2-poc.md` T-14 + S-PoC-04
- **风险登记**：`plans/progress.md`（`.env.local` 明文 key 高风险已部分缓解）
- **规则**：`rules/safety.md` S-3「危机路径必须独立」
- **CLAUDE.md**：§5 红线 1（不在 docs/plans/tasks 对齐前生成业务代码）

---

## 决策追溯

| 决策点 | 来源 |
| --- | --- |
| Vercel Env 三层分层 | Vercel 官方文档 + `08-Deployment-Plan.md §4.1` |
| 危机路径不调 LLM | `rules/safety.md` S-3 + T-09 设计稿 §关键不变量 |
| 5 类红线 grep | `docs/07-Test-Plan.md §19.6` + `PROJECT_MAP.md §5 红线 1-8` |
| production 手动审批 + required reviewers | GitHub Actions `environment` 字段 + Vercel Deploy Hook |
| 危机路径失败 = P0 即时告警 | `rules/safety.md` S-3 + `08-Deployment-Plan.md §10.2` |
| staging 与 production 独立 Supabase project / key | `08-Deployment-Plan.md §4.1` + `04-Database-Design.md` |
| 轮转周期 90 天（M3+） | `08-Deployment-Plan.md §7.2` |
| 11 项部署 checklist | `08-Deployment-Plan.md §15.1 发布 Runbook` |

---

> **签收**：本 ADR 由 A（主）+ BE 联合产出，C 在 PM / Q / FE / PE / KE 评审通过后切换状态为 Accepted。
