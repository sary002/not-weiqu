# 03 系统架构（System Architecture）

> **Owner**：Architect（A）
> **Reviewer**：PM、BE、PE、Q
> **版本**：v1.0
> **关联**：`docs/01-PRD.md`、`docs/02-Prototype.md`、`rules/safety.md`

---

## 目录

- [1. 目标与读者](#1-目标与读者)
- [2. 架构原则](#2-架构原则)
- [3. 架构总览](#3-架构总览)
- [4. 模块划分](#4-模块划分)
- [5. 数据流](#5-数据流)
- [6. AI 编排](#6-ai-编排)
- [7. 知识库与 RAG 架构](#7-知识库与-rag-架构)
- [8. Prompt 注入与上下文管理](#8-prompt-注入与上下文管理)
- [9. 安全架构](#9-安全架构)
- [10. 隐私与脱敏](#10-隐私与脱敏)
- [11. 危机路径架构](#11-危机路径架构)
- [12. 可观测性](#12-可观测性)
- [13. 性能与可用性](#13-性能与可用性)
- [14. 部署形态](#14-部署形态)
- [15. 技术选型表](#15-技术选型表)
- [16. ADR 索引](#16-adr-索引)
- [17. 风险与缓解](#17-风险与缓解)
- [18. 附录](#18-附录)

---

## 1. 目标与读者

让产品在「跑得稳、演得动、护得住」之间不偏向任何一极。

读者：A、BE、FE、PE、KE、Q、C。

## 2. 架构原则

| # | 原则 | 含义 |
| --- | --- | --- |
| AR-1 | 可逆 > 最优 | 选型必须有回滚条件 |
| AR-2 | Boring Tech 默认 | 成熟生态优先 |
| AR-3 | 隐私默认安全 | PII 默认脱敏，零明文落盘 |
| AR-4 | 可观测先行 | 埋点 / trace 在编码前设计 |
| AR-5 | 危机路径优先 | 与情绪安全相关的链路有 fallback |
| AR-6 | 最小化拆分 | 模块数 = 必要 + 1 |
| AR-7 | 契约先行 | OpenAPI 先于实现 |
| AR-8 | 故障域隔离 | 用户敏感数据与公开内容严格分层 |

## 3. 架构总览

```
┌────────────────────────────────────────────────────────┐
│                      Client Layer                      │
│   Web (React)   App (iOS / Android · 后续)              │
└──────────────────────┬─────────────────────────────────┘
                       │ HTTPS / WSS
┌──────────────────────▼─────────────────────────────────┐
│                API Gateway                              │
│   鉴权 · 限流 · WAF · 审计 · 路由                      │
└──────────────────────┬─────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────┐
│                Business Services                        │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │  User    │ │ Conversation │ │   Scenario   │         │
│  │ Service  │ │   Service    │ │   Service    │         │
│  └──────────┘ └──────────────┘ └──────────────┘         │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Progress │ │   Script     │ │  KB Service  │         │
│  │ Service  │ │   Service    │ │  (RAG)       │         │
│  └──────────┘ └──────────────┘ └──────────────┘         │
└──────────────────────┬─────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────┐
│                AI Orchestrator                          │
│  Prompt 注入 · 上下文窗口 · 模型路由 · 降级            │
│  Guardrails · 危机信号识别 · 评测接口                  │
└──────────────────────┬─────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
┌───────▼──────┐                ┌─────▼──────┐
│  LLM Vendor  │                │  Knowledge │
│   (抽象层)   │                │    Base    │
│  至少 2 家   │                │  向量+标签  │
└──────────────┘                └────────────┘

┌────────────────────────────────────────────────────────┐
│                Platform Services                        │
│  Auth · Storage · Vector DB · Message Queue · Cache    │
│  Audit · Observability · Secrets · Feature Flag        │
└────────────────────────────────────────────────────────┘
```

## 4. 模块划分

| 模块 | 职责 | 依赖 | 备注 |
| --- | --- | --- | --- |
| API Gateway | 鉴权、限流、审计、路由 | Auth、Audit | 唯一对外入口 |
| User Service | 匿名档案、偏好、退出 | Auth、Storage | 不存 PII |
| Conversation Service | 对话会话、消息、危机检测 | AI Orchestrator | 主业务 |
| Scenario Service | 场景库、标签、版本 | KB、Storage | 由 KE 维护 |
| Script Service | 用户剧本、收藏 | Storage | 加密存储 |
| KB Service | 知识块检索、标签查询 | Vector DB | RAG |
| Progress Service | 进度、复盘、曲线 | Storage | 用户可控 |
| AI Orchestrator | Prompt 注入、上下文、路由、降级 | LLM、KB、Guardrails | 关键模块 |
| Audit Service | 全链路审计、危机日志 | Storage | 与安全强耦合 |

## 5. 数据流

### 5.1 用户发起对话
```
Client → GW → Conversation
   ↓
Conversation → AI Orchestrator
   ↓
AI Orchestrator → KB Service (RAG)  → 召回知识块
   ↓
AI Orchestrator → LLM Vendor (主/备)
   ↓
AI Orchestrator → Guardrails (输入 + 输出双向)
   ↓
   命中危机 → 走危机路径
   未命中   → 返回给 Conversation
   ↓
Conversation → Storage（脱敏入库）
   ↓
返回 Client
```

### 5.2 用户保存剧本
```
Client → GW → Script Service
   ↓
Script Service 加密 → Storage
   ↓
返回 Client
```

### 5.3 用户删除全量
```
Client → GW → User Service
   ↓
User Service → 编排 Conversation / Script / Progress 删除
   ↓
每个服务 24h 内完成
   ↓
Audit Service 留痕（不存内容，只存事件）
```

## 6. AI 编排

### 6.1 编排服务职责
- Prompt 模板版本化管理
- 上下文窗口管理（摘要 + 滑动窗口 + 关键事实）
- 模型路由（主备 + 风险场景切保守）
- 降级（上游超时 → 兜底话术）
- 速率限制（单人 / 单 IP / 全局）
- 内容过滤（输入 + 输出双向）
- 危机信号识别（Q 红线用例覆盖）
- 评测接口（PE 用）

### 6.2 上下文窗口策略
| 阶段 | 策略 |
| --- | --- |
| 0~4 轮 | 全文保留 |
| 5~10 轮 | 摘要 + 最近 4 轮 |
| > 10 轮 | 摘要 + 最近 3 轮 + 关键事实表 |
| > 20 轮 | 主动收束，建议开启新会话 |

### 6.3 模型路由矩阵
| 场景 | 主模型 | 备模型 | 备注 |
| --- | --- | --- | --- |
| 日常对话 | 主供应商 A 模型 | 供应商 B 同档 | 默认 |
| 危机识别 | 保守模型（温度 0） | 兜底话术 | 不允许降级 |
| 角色扮演演练 | 主供应商 A 模型 | 供应商 B 同档 | 可降级 |
| 知识小卡生成 | 主供应商 A 模型 | 模板渲染 | 可降级 |

### 6.4 降级路径
```
LLM 超时 / 错误
   ↓
重试 1 次（指数退避）
   ↓
失败 → 切备供应商
   ↓
失败 → 兜底话术「我们这会有点忙，再说一次？」
```

## 7. 知识库与 RAG 架构

> 由 KE 主理内容，A 主理形态与检索接口。

### 7.1 知识块结构
```json
{
  "id": "kb-2026-xxx",
  "title": "...",
  "one_liner": "...",
  "layer": "L1|L2|L3|L4|L5",
  "scenario": ["职场","家庭","..."],
  "difficulty": 1,
  "applicable": "...",
  "not_applicable": "...",
  "source": {"name":"...","url":"...","version":"..."},
  "risk_notes": "...",
  "embeddings": [/* 768 维向量 */],
  "tags": ["..."]
}
```

### 7.2 检索流程
```
用户输入 → Embedding → 向量召回 top-K
   ↓
标签过滤（场景、边界五层、风险标签）
   ↓
重排（重排模型或规则）
   ↓
返回 top-N 给 Orchestrator
```

### 7.3 风险与红线
- 不直接展示知识块原文给用户
- 与 PE 协作决定「注入位置」（System / User / 工具调用）
- 任何「未审校」知识块不得进入主流程
- 季度复核由 KE 发起，Q 监督

## 8. Prompt 注入与上下文管理

### 8.1 Prompt 模板版本
- 每个模板有 `prompt_id` + `version`
- 上线前必须 PE 签字 + Q 红线用例通过
- 每次变更走 `agents/prompt-engineer/changelog.md`

### 8.2 注入位
| 注入位 | 内容 | 决策者 |
| --- | --- | --- |
| System | 人格、Guardrails、危机话术触发规则 | PE |
| Developer（保留） | 业务指令、输出格式 | PE + A |
| User | 真实用户输入 + 知识块摘要 | A 编排 |
| Tool Call | KB 检索、危机检测、用户档案读取 | A + PE |

### 8.3 上下文管理
- 摘要服务：独立微服务，可独立降级
- 关键事实表：用户显式说出的「我需要 / 我不想」，单独持久化
- 滑动窗口：按 token 预算裁剪

## 9. 安全架构

### 9.1 纵深防御
| 层 | 措施 |
| --- | --- |
| 边缘 | WAF、Bot 防护、CC 防护 |
| 传输 | TLS 1.2+、HSTS |
| 鉴权 | 短时 Token（≤ 15min）、Refresh Token 滚动 |
| 应用 | 限流、幂等、参数校验、输出编码 |
| 数据 | 静态加密、字段级脱敏、密钥轮转 |
| 审计 | 全链路 trace_id、关键事件留痕 |
| 应急 | 危机路径独立、降级开关 |

### 9.2 鉴权策略
- 默认匿名访问（设备 ID + 短期会话 Token）
- 用户可选择登录（手机号 / 第三方）以同步进度
- 登录路径必须 PII 最小化（手机号可脱敏后存）

### 9.3 密钥管理
- KMS 托管
- 不在代码 / 仓库中出现明文密钥
- 定期轮转，留 audit

## 10. 隐私与脱敏

### 10.1 原则
- 数据最小化
- 脱敏默认
- 可删除 / 可导出
- 不裸日志

### 10.2 字段级脱敏
| 字段 | 存储 | 日志 | 第三方 |
| --- | --- | --- | --- |
| 设备 ID | 哈希 | 哈希 | 哈希 |
| 真实姓名 | 不收 | — | — |
| 手机号 | 收集即脱敏 | 不打印 | 不外发 |
| 定位 | 不收 | — | — |
| 对话原文 | 加密 | 摘要 | 摘要 |

### 10.3 用户权利
- 一键导出（≤ 24h）
- 一键删除（≤ 24h）
- 撤回同意

## 11. 危机路径架构

### 11.1 检测
- Orchestrator 内置危机检测（保守模型，温度 0）
- 与 Q 共同维护红线用例集
- 召回率 ≥ 99%，误触发 ≤ 5%

### 11.2 触发
- 任意一处命中 → 全链路立即停止主线
- 走 CrisisPath 服务（独立、单一职责）
- 兜底页文案由 PE + KE 维护
- 写入审计（不存内容，只存事件）

### 11.3 不能被降级覆盖
- 即便上游 LLM 失败，危机话术本地兜底必须可用
- 监控告警：危机路径调用失败 → 立即 P0

## 12. 可观测性

### 12.1 三大支柱
| 支柱 | 工具 | 关键指标 |
| --- | --- | --- |
| Metrics | Prometheus + Grafana | QPS、错误率、AI 首 token、危机触发数 |
| Logs | Loki / ELK | 脱敏日志、trace_id 关联 |
| Traces | OpenTelemetry + Jaeger | 端到端 trace、模型调用可视化 |

### 12.2 关键指标
| 指标 | 告警阈值 |
| --- | --- |
| 错误率 | > 1% 持续 5min |
| AI 首 token | > 3s 持续 5min |
| 危机路径调用失败 | > 0 立即 P0 |
| 数据删除 SLA 超时 | > 24h 立即 P1 |
| PII 出现在日志 | 1 次立即 P0 |

### 12.3 回放
- 每次 AI 调用存：trace_id、prompt_hash、model、output_hash
- 出现回归时，可重放历史 prompt

## 13. 性能与可用性

| 维度 | 目标 |
| --- | --- |
| 可用性 | ≥ 99.5% |
| AI 首 token | ≤ 1.5s（强网）/ ≤ 3s（弱网） |
| 接口 P99 | ≤ 500ms |
| 并发 | 单租户 ≥ 1 万 QPS |
| 灾备 | RPO ≤ 1h，RTO ≤ 30min |

## 14. 部署形态

### 14.1 形态
- 单云单 Region（VPC 内）作为 MVP
- 多 AZ 部署
- 不上 K8s 的复杂度（先用托管容器或函数计算）

### 14.2 环境
- dev / staging / prod
- staging 真实数据脱敏后使用
- 灰度：按租户 ID 灰度

### 14.3 流水线
- 代码 → 单测 → 集成 → 镜像 → 灰度 → 全量
- 任一红线用例失败 → 阻断

## 15. 技术选型表

| 项 | 候选 | 默认 | 决策 | 备注 |
| --- | --- | --- | --- | --- |
| 前端框架 | React / Vue / Svelte | React | ADR-001 | 生态成熟 |
| 状态管理 | Redux / Zustand / Jotai | Zustand | ADR-002 | 轻量 |
| 后端语言 | Go / Node / Python | Go | ADR-003 | 性能 + 并发 |
| API 风格 | REST / gRPC | REST（主） + gRPC（内） | ADR-004 | 对外可读 |
| 数据库 | PostgreSQL / MySQL | PostgreSQL | ADR-005 | 生态 + pgvector |
| 向量库 | pgvector / Qdrant / Weaviate | pgvector | ADR-006 | MVP 阶段复用 PG |
| LLM 供应商 | 至少 2 家 | A 主 + B 备 | ADR-007 | 抽象层统一 |
| 缓存 | Redis / Memcached | Redis | ADR-008 | 标准 |
| 队列 | Kafka / RabbitMQ / Redis Stream | Redis Stream | ADR-009 | MVP 简化 |
| 部署 | 单一云 | 阿里云（占位） | ADR-010 | 合规 |

> 选型走 ADR；本表为占位，真实选型在 ADR-NNN 中详细论证。

## 16. ADR 索引

| ID | 标题 | 状态 | 决策 |
| --- | --- | --- | --- |
| ADR-000 | 模板 | Accepted | — |
| ADR-001 | 前端框架选型 | Proposed | React |
| ADR-002 | 状态管理选型 | Proposed | Zustand |
| ADR-003 | 后端语言选型 | Proposed | Go |
| ADR-004 | API 风格 | Proposed | REST + gRPC |
| ADR-005 | 数据库选型 | Proposed | PostgreSQL |
| ADR-006 | 向量库选型 | Proposed | pgvector |
| ADR-007 | LLM 供应商与降级 | Proposed | A 主 + B 备 |
| ADR-008 | 缓存选型 | Proposed | Redis |
| ADR-009 | 队列选型 | Proposed | Redis Stream |
| ADR-010 | 部署云选型 | Proposed | 阿里云（占位） |
| ADR-011 | 数据保留策略 | Proposed | 90d 滚动 |
| ADR-012 | 危机路径独立部署 | Proposed | 是 |
| ADR-013 | 第三方依赖审计 | Proposed | 0 默认开启 |

> ADR 模板见 `docs/decisions/adr-template.md`。

## 17. 风险与缓解

| 风险 | 等级 | 缓解 |
| --- | --- | --- |
| LLM 供应商故障 | P0 | 主备路由 + 兜底话术 |
| 危机话术漏触发 | P0 | Orchestrator 保守模型 + Q 红线 |
| PII 泄露 | P0 | 字段级脱敏 + 0 明文日志 + Q 渗透 |
| 单 Region 故障 | P1 | 多 AZ + 灾备演练 |
| 向量库性能 | P1 | 召回量限制 + 缓存 + 重排 |
| 第三方 SDK 引入 PII | P1 | 0 默认开启 + 审计 |
| 用户量激增 | P2 | 自动扩缩容 + 限流 |

## 18. 附录

### 18.1 关联文档
- PRD：`docs/01-PRD.md`
- 原型：`docs/02-Prototype.md`
- 数据库：`docs/04-Database-Design.md`
- API：`docs/05-API-Design.md`
- 部署：`docs/08-Deployment-Plan.md`
- 测试：`docs/07-Test-Plan.md`
- 安全：`rules/safety.md`
- 治理：`rules/governance.md`

### 18.2 名词
- Orchestrator：AI 编排服务
- CrisisPath：危机路径独立服务
- RAG：检索增强生成
- Trace：分布式追踪
