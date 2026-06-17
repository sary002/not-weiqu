# 不委屈（Not委屈）— 项目治理主文档

> 帮善良的人学会有锋芒
> AI-driven growth platform for people-pleasers to build healthy boundaries.

---

## ⚡ Preflight（任何任务开始前必读）

| 顺序 | 文件 | 必读？ |
| --- | --- | --- |
| 1 | `PROJECT_MAP.md` | ✅ 必读（项目地图） |
| 2 | `plans/daily/今日.md` | ✅ 今日 standup |
| 3 | `plans/progress.md` 头部 | ✅ 当前阶段 |
| 4 | 本文件（CLAUDE.md） | ✅ 治理宪法 |

> 4 步总计 ≤ 5K token。**比扫整个项目省 10 倍**。
> 详见 `PROJECT_MAP.md`。

---

## 0. 项目身份

| 项 | 内容 |
| --- | --- |
| 项目名 | 不委屈（Not委屈 / Not-wei-qu） |
| Slogan | 帮善良的人学会有锋芒 |
| 使命 | 帮助讨好型人格识别、表达、巩固健康边界 |
| 形态 | AI 成长平台（Web / Mobile / Chat） |
| 当前阶段 | M1 完成 / M2 PoC 准备中（v2.0.7 demo 可用） |
| 核心原则 | **不评判、不催促、不替代专业心理咨询** |

---

## 1. 治理原则（Governance Principles）

1. **用户安全优先**：任何决策都必须经过「是否会伤害脆弱用户」这一关。
2. **多 Agent 协同**：单一 Agent 不独立完成产品级决策，必须经过协作。
3. **文档先行**：先 docs/，再 plans/，再 tasks/，最后才生成代码。
4. **可追溯**：每个决策、每个 PRD、每条规则都必须有出处与版本。
5. **最小可行**：每个迭代只交付能验证假设的最小切片。
6. **专业边界**：本产品是「成长陪伴」，不替代心理咨询与精神科诊疗。

---

## 2. 多 Agent 协作体系

### 2.1 Agent 名册

| Agent | 代号 | 角色 | 核心职责 |
| --- | --- | --- | --- |
| **Coordinator** | `C` | 协调者 | 路由任务、调度 Agent、把关质量、仲裁冲突 |
| **Product Manager** | `PM` | 产品经理 | 用户研究、PRD、优先级、验收标准 |
| **Architect** | `A` | 架构师 | 技术选型、系统架构、数据流、ADR |
| **Prompt Engineer** | `PE` | 提示词工程师 | 对话脚本、人格语气、提示词版本、Guardrails |
| **Knowledge Engineer** | `KE` | 知识工程师 | 心理学知识库、内容策展、标签体系、引用溯源 |
| **Frontend** | `FE` | 前端 | UI/UX、交互模式、组件库、可访问性 |
| **Backend** | `BE` | 后端 | 服务端架构、API、数据模型、AI 编排 |
| **Tester** | `Q` | 测试 | 验收用例、边界测试、可用性测试、安全审查 |

详细定义见 `agents/<name>.md`。

### 2.2 协作模型

```
                    ┌─────────────────┐
                    │   Coordinator   │
                    │       (C)       │
                    └────────┬────────┘
                             │
       ┌─────────┬───────────┼───────────┬─────────┐
       ▼         ▼           ▼           ▼         ▼
      PM        A           PE          KE         Q
       │         │           │           │         │
       └────┬────┴─────┬─────┴─────┬─────┴────┬────┘
            ▼          ▼           ▼          ▼
                          (FE / BE)
```

- **Coordinator** 是唯一对外接收任务的总入口。
- **PM** 提需求；**A** 给方案；**PE + KE** 共构 AI 能力；**FE + BE** 实现；**Q** 验收。
- 任一 Agent 都可发起「升档请求」回到 Coordinator 触发跨 Agent 评审。

### 2.3 决策等级

| 等级 | 触发条件 | 决策者 | 记录位置 |
| --- | --- | --- | --- |
| **L0** 战术级 | 单个 Agent 内部执行细节 | 该 Agent 自决 | 工作日志 |
| **L1** 作业级 | 跨 Agent 任务分配 | Coordinator | `tasks/` |
| **L2** 方案级 | 影响模块设计 | PM + A + PE/KE 联合 | `plans/` |
| **L3** 战略级 | 影响产品定位 / 安全 / 合规 | 全员评审 | `docs/decisions/ADR` |

### 2.4 多 Agent 并发开关（默认 off）

> **当前模式**：`off`（详见 `.claude/concurrency.json`）
> **完整规则**：`rules/workflow.md` §W-7（开关模式）
> **三种模式**：
>   - `off`（默认）— 串行执行，禁止多 sub-agent
>   - `on` — 强制并行，跨 ≥ 2 Agent 角色时自动 fan out
>   - `auto` — 按阈值自动判断（详见 §W-7.4 三问）
>
> **会话级切换**（无需改配置）：
>   - 开启：`ultracode` / `fan out` / `多 agent 并行`
>   - 关闭：`ultracode off` / `一个人做` / `省 token`
>
> **团队级切换**：修改 `.claude/concurrency.json` 的 `mode` 字段（需先写 ADR）

---

## 3. 标准工作流（Standard Workflow）

每个功能/任务遵循五阶段：

```
[1 需求] → [2 方案] → [3 设计] → [4 计划] → [5 验收]
   PM        A+PM     PE+KE+FE    Coordinator    Q
```

| 阶段 | 产出物 | 落地位置 |
| --- | --- | --- |
| 1. 需求 | User Story / PRD 草稿 | `docs/product/` |
| 2. 方案 | Architecture Sketch / 选型 | `docs/architecture/` + `plans/` |
| 3. 设计 | 对话脚本 / UI 线框 / 内容大纲 | `agents/` 内各角色产出 |
| 4. 计划 | 任务拆解 / 里程碑 / 依赖图 | `plans/` + `tasks/` |
| 5. 验收 | 测试用例 / 验收报告 | `tasks/<id>/acceptance.md` |

---

## 4. 目录职责一览

```
.
├── CLAUDE.md               ← 本文件，全员必读
├── .claude/                ← Claude Code 工具配置
├── agents/                 ← 8 个 Agent 的角色定义、能力边界、协作契约
├── commands/               ← 斜杠命令（/plan, /review 等）
├── rules/                  ← 治理、流程、质量、安全规则
├── docs/                   ← 静态文档（产品/架构/决策）
│   ├── product/            ← 愿景、用户画像、PRD
│   ├── architecture/       ← 系统架构、ADR
│   └── decisions/          ← 架构决策记录（ADR）
├── plans/                  ← 项目级与功能级计划
└── tasks/                  ← 任务池与执行追踪
```

---

## 5. 红线（Hard No's）

❌ 在 `docs/` / `plans/` / `tasks/` 还没对齐前生成业务代码。  
❌ 让单一 Agent 独自拍板 L2/L3 决策。  
❌ 把 AI 输出当作「心理诊断」或「治疗方案」。  
❌ 收集 / 展示用户的真实身份信息（隐私最小化）。  
❌ 使用刺激性语言、羞辱性话术、PUA 受害者语气。  
❌ 在未做安全评审前上线涉及情绪触发点的功能。  

---

## 6. 版本

| 版本 | 日期 | 变更 |
| --- | --- | --- |
| v0.1 | 2026-06-14 | 初版治理框架，确立 8 Agent 体系与五阶段工作流 |

---

> **使用说明**：Claude 在接到任何任务时，应先读 `CLAUDE.md` → 再读对应 `agents/*.md` → 再读 `rules/*.md` → 再落到 `plans/` 与 `tasks/`。
