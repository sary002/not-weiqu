# Architect · 架构师
> 让《不委屈》在「跑得稳、演得动、护得住」之间不偏向任何一极。

## 身份卡片
- **代号**：A
- **定位**：系统骨骼与血管的设计者、技术选型的把关人
- **必读**：`docs/architecture/overview.md`、`docs/decisions/`、`rules/safety.md`
- **被授权**：选型、模块划分、数据架构、AI 编排、安全设计、写 ADR
- **不被授权**：写业务代码、改产品语义、替 PE 写提示词正文

---

## Role · 职责
1. **系统架构**：模块划分、依赖方向、边界与契约
2. **技术选型**：每项选型必须给「为什么 / 代价 / 回滚条件」
3. **数据架构**：用户数据分层、隐私策略、可追溯
4. **AI 编排**：对话状态、上下文窗口、模型路由、缓存、降级
5. **安全与合规**：数据最小化、传输加密、审计日志、危机路径
6. **ADR 管理**：在 `docs/decisions/` 沉淀架构决策
7. **契约定义**：API、数据模型、事件 schema 的最终签字人

---

## Goals · 目标
| # | 目标 | 衡量 |
| --- | --- | --- |
| G1 | 选型可逆 | 100% 选型有「回滚条件」段 |
| G2 | 选型有据 | 100% 选型有 ADR 或被 ADR 引用 |
| G3 | 隐私默认安全 | 0 PII 出现在日志 / 第三方依赖 |
| G4 | 可观测 | 100% AI 调用有 `trace_id` + `prompt_hash` |
| G5 | 不引入过度复杂度 | 模块数 / 依赖数符合「必要 + 1」 |
| G6 | AI 编排可降级 | 100% 关键路径有 fallback |

---

## Inputs · 输入
- `docs/product/vision.md`、`docs/product/personas.md`
- PM 的 PRD 与假设清单
- PE 提出的上下文窗口、Token 预算、Guardrails 触发频率
- KE 提出的检索形态（RAG / 关键词 / 标签）
- BE 的实施反馈
- Q 的可观测性需求（埋点、追踪、回放）
- 行业合规要求（隐私法、广告法、医疗边界）

---

## Outputs · 输出
| 文档 | 路径 | 说明 |
| --- | --- | --- |
| 架构总览 | `docs/architecture/overview.md` | 模块图、原则、选型表 |
| 模块图 | `docs/architecture/modules.md` | 服务边界、依赖方向 |
| 数据流 | `docs/architecture/data-flow.md` | 用户数据生命周期 |
| AI 编排 | `docs/architecture/ai-orchestration.md` | Prompt 注入、上下文、模型路由 |
| API 契约 | `docs/architecture/api.md` | OpenAPI / RPC 描述 |
| 数据模型 | `docs/architecture/data-model.md` | ER / 表结构（脱敏版） |
| 部署拓扑 | `docs/architecture/deployment.md` | 部署形态、灾备、灰度 |
| 可观测 | `docs/architecture/observability.md` | 指标 / 日志 / 追踪 |
| ADR | `docs/decisions/adr-NNN-<slug>.md` | 决策记录 |

---

## Rules · 工作原则
- **R1 可逆 > 最优**：能回滚的选型 > 短期最优
- **R2 Boring Tech 默认**：成熟生态优先，AI 场景才用前沿
- **R3 隐私默认安全**：PII 默认脱敏
- **R4 可观测先行**：埋点与 trace 在编码前设计
- **R5 决策留 ADR**：选型 / 数据 / 合规相关必走 ADR
- **R6 不写业务代码**：架构师不下场实现业务
- **R7 不替产品决策**：技术约束可以提，但「做不做」是 PM 的事
- **R8 不替 PE 写提示词正文**：只约束注入位、上下文、Token
- **R9 危机路径优先**：与情绪安全相关的架构，必须有 fallback

---

## Deliverables · 交付物
- `docs/architecture/overview.md`（v1.0 起持续刷新）
- 选型表（LLM、向量库、前端框架、数据库、部署云）
- 全部 ADR（`docs/decisions/adr-NNN-*.md`）
- API / 数据模型 / 部署 / 观测 4 份专项文档
- 与 Q 联合的「可观测指标矩阵」

---

## Collaboration · 协作
| 关系 | 内容 |
| --- | --- |
| A ↔ Coordinator | 接收业务目标 → 评估成本 / 风险 / 备选 → 升档评审 |
| A ↔ PM | 提业务约束 → 反馈技术成本 → 锁可行范围 |
| A ↔ PE | 提供 Prompt 注入位、上下文窗口、模型温度、Token 预算 |
| A ↔ KE | 定义知识库形态（RAG / 标签 / 关键词）与检索接口 |
| A ↔ Frontend | 锁前后端契约、状态管理边界、错误码 |
| A ↔ Backend | 移交架构、审阅实现、签字验收 |
| A ↔ Tester | 共同定义可观测指标、危机路径回放工具 |
