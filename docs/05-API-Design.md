# 05 API 设计（API Design）

> **Owner**：Backend（BE）
> **Reviewer**：A、FE、PE、Q
> **版本**：v1.0
> **关联**：`docs/03-System-Architecture.md`、`docs/04-Database-Design.md`、`rules/safety.md`

---

## 目录

- [1. 目标与读者](#1-目标与读者)
- [2. 设计原则](#2-设计原则)
- [3. 命名与版本](#3-命名与版本)
- [4. 资源模型](#4-资源模型)
- [5. 通用约定](#5-通用约定)
- [6. 鉴权与权限](#6-鉴权与权限)
- [7. 错误码](#7-错误码)
- [8. 限流与幂等](#8-限流与幂等)
- [9. 关键端点](#9-关键端点)
- [10. AI 编排 API](#10-ai-编排-api)
- [11. 危机路径 API](#11-危机路径-api)
- [12. 知识库 API（内部）](#12-知识库-api内部)
- [13. 事件与回调](#13-事件与回调)
- [14. 兼容性策略](#14-兼容性策略)
- [15. 文档与契约](#15-文档与契约)
- [16. 风险与缓解](#16-风险与缓解)
- [17. 附录](#17-附录)

---

## 1. 目标与读者

让 FE、PE、KE、Q 在「一份契约」下高效协作，并让产品在「可演进 + 可降级 + 可审计」三条线上不偏。

读者：BE、FE、PE、KE、Q、A。

## 2. 设计原则

| # | 原则 | 含义 |
| --- | --- | --- |
| API-1 | 契约先行 | OpenAPI 先于实现 |
| API-2 | 资源化 | 一切皆资源，行为也用资源表达 |
| API-3 | 幂等 | 写操作必有幂等键 |
| API-4 | 可降级 | 关键路径有 fallback 端点 |
| API-5 | 错误统一 | 错误体一致，code 唯一 |
| API-6 | 版本可演进 | 路径 / 头 / 内容三种策略 |
| API-7 | 鉴权最小化 | 匿名可用，登录可增强 |
| API-8 | 不裸日志 | 请求 / 响应日志按脱敏策略 |

## 3. 命名与版本

### 3.1 路径
- 全部前缀 `/api`
- 版本：URL 段 `/v1`
- 资源用复数名词：`/conversations`、`/scripts`
- 行为用资源表达：`/conversations/{id}/messages`

### 3.2 头
| 头 | 必填 | 用途 |
| --- | --- | --- |
| `Authorization` | 视情况 | Bearer Token |
| `X-Trace-Id` | N | 客户端生成或服务端生成 |
| `X-Idempotency-Key` | 写操作 | 幂等 |
| `X-Client` | N | `web` / `app` |
| `X-Client-Version` | N | 客户端版本 |
| `Accept-Language` | N | 简体 / 英文 |

### 3.3 状态码
| 码 | 场景 |
| --- | --- |
| 200 | 成功（GET / PATCH） |
| 201 | 创建成功（POST） |
| 202 | 异步任务已接受 |
| 204 | 成功无 body（DELETE） |
| 400 | 参数错误 |
| 401 | 未鉴权 |
| 403 | 已鉴权无权限 |
| 404 | 资源不存在 |
| 409 | 冲突（如幂等命中） |
| 422 | 业务规则不满足 |
| 429 | 限流 |
| 500 | 系统错误 |
| 503 | 上游不可用，已降级 |

## 4. 资源模型

### 4.1 资源表
| 资源 | 路径 | 备注 |
| --- | --- | --- |
| Profile | `/v1/profiles/me` | 匿名档案 |
| Conversation | `/v1/conversations` | 会话 |
| Message | `/v1/conversations/{id}/messages` | 消息 |
| CrisisEvent | `/v1/crisis-events` | 危机事件（仅写入，由后端记录） |
| Scenario | `/v1/scenarios` | 场景（只读） |
| Script | `/v1/scripts` | 用户剧本 |
| Progress | `/v1/progress` | 进度 |
| Milestone | `/v1/milestones` | 我做到了 |
| KnowledgeBlock | `/v1/internal/kb/blocks` | 内部知识块 |
| DataRequest | `/v1/data-requests` | 导出 / 删除 |
| DrillSession | `/v1/drills` | 演练 |
| DrillMessage | `/v1/drills/{id}/messages` | 演练消息 |
| CrisisResources | `/v1/crisis-resources` | 危机兜底资源（公开只读） |

## 5. 通用约定

### 5.1 请求体
```json
{
  "data": { /* 资源对象 */ },
  "meta": { "client_msg_id": "uuid" }
}
```

### 5.2 响应体
```json
{
  "data": { /* 资源或数组 */ },
  "meta": {
    "trace_id": "...",
    "server_time": "2026-06-14T03:11:00Z"
  }
}
```

### 5.3 分页
- 游标分页：`?cursor=<opaque>&limit=20`
- 响应：`{ "data": [...], "meta": { "next_cursor": "..." } }`

### 5.4 时间
- ISO 8601 + UTC
- 渲染端负责本地化

## 6. 鉴权与权限

### 6.1 鉴权
- 匿名：设备指纹 → 服务端签发 `device_token`（短时，15min）
- 登录：用户绑定 → 发放 `access_token` + 滚动 `refresh_token`
- 内部服务间：mTLS / 服务 Token

### 6.2 权限
- 用户只能访问自己资源
- 内部管理 API 仅服务间调用
- 危机资源公开只读（紧急可用）

### 6.3 权限矩阵
| 资源 | 匿名 | 已登录 | 内部 |
| --- | --- | --- | --- |
| Profile | own | own | all |
| Conversation | own | own | all |
| Script | own | own | all |
| Progress | own | own | all |
| Scenario | list/get | list/get | CRUD |
| CrisisResources | read | read | CRUD |
| KnowledgeBlock | — | — | CRUD |

## 7. 错误码

> 错误码 6 位：`NW` + 模块（2 位） + 序号（2 位）。
> 模块：`AU` 鉴权 `CO` 对话 `CR` 危机 `KB` 知识 `SC` 场景 `PR` 进度 `ST` 系统 `DA` 数据。

### 7.1 错误体
```json
{
  "error": {
    "code": "NW-CR-0001",
    "message": "我们检测到你现在不太好。",
    "user_message": "我们在这。先不聊别的，可以看看下面的资源吗？",
    "action_hint": "show_crisis_resources",
    "trace_id": "..."
  }
}
```

### 7.2 关键错误码
| Code | 含义 | HTTP |
| --- | --- | --- |
| `NW-AU-0001` | 未鉴权 | 401 |
| `NW-AU-0002` | 权限不足 | 403 |
| `NW-AU-0003` | Token 过期 | 401 |
| `NW-CO-0001` | 会话不存在 | 404 |
| `NW-CO-0002` | 会话已结束 | 410 |
| `NW-CO-0003` | 会话超长，建议开启新会话 | 422 |
| `NW-CO-0010` | AI 上游超时，已兜底 | 503 |
| `NW-CR-0001` | 检测到危机信号，已切路径 | 200 (action: show_crisis_resources) |
| `NW-CR-0002` | 危机话术触发 | 200 (同上) |
| `NW-KB-0001` | 知识块未找到 | 404 |
| `NW-SC-0001` | 场景已下架 | 410 |
| `NW-PR-0001` | 进度被用户关闭 | 200 (空数据) |
| `NW-ST-0001` | 系统异常 | 500 |
| `NW-ST-0002` | 上游不可用，已降级 | 503 |
| `NW-DA-0001` | 数据请求已受理 | 202 |
| `NW-DA-0002` | 数据请求 SLA 超时 | 500 |

> 所有错误必须含 `user_message`（人话）和 `action_hint`（前端动作）。

## 8. 限流与幂等

### 8.1 限流
| 维度 | 默认 | 备注 |
| --- | --- | --- |
| 单设备 | 60 req / min | 通用 |
| 对话发送 | 20 req / min | 防刷 |
| 演练发送 | 30 req / min | 演练可略高 |
| 危机资源 | 30 req / min | 紧急不卡 |
| 数据请求 | 2 req / day | 防误删 |
| 全局 | 10k QPS | 入口 |

### 8.2 幂等
- 写操作要求 `X-Idempotency-Key`
- 服务端存 24h；命中同 key 返回首次结果

## 9. 关键端点

> 仅列 P0 端点，详细 schema 见 OpenAPI 文档（实施阶段产出）。

### 9.1 Onboarding / Profile

#### GET /v1/profiles/me
- 描述：获取当前匿名档案
- 鉴权：设备 token
- 响应：`Profile`

#### PATCH /v1/profiles/me
- 描述：更新偏好（场景、语气、动效）
- 鉴权：设备 token

#### DELETE /v1/profiles/me
- 描述：删除账户（全量数据）
- 鉴权：设备 token + 二次确认
- 副作用：创建 DataRequest(type=delete)

### 9.2 Conversation

#### POST /v1/conversations
- 描述：开启一次对话
- 请求：`{ scenario_id?: uuid, type: "free" | "drill" }`
- 响应：`Conversation`

#### POST /v1/conversations/{id}/messages
- 描述：发送一条消息
- 请求：`{ content: text, client_msg_id: uuid }`
- 响应：`Message`（流式见 10.x）
- 副作用：触发 AI 编排

#### GET /v1/conversations/{id}
- 描述：获取一次会话（摘要 + 关键事实）
- 不返回原文（除非用户主动展开）

#### GET /v1/conversations
- 描述：会话列表
- 游标分页

#### POST /v1/conversations/{id}/close
- 描述：主动结束

### 9.3 Scenario

#### GET /v1/scenarios
- 描述：场景列表（按 layer / scene_tags 过滤）
- 公共只读

#### GET /v1/scenarios/today
- 描述：今日 1 个推荐场景

### 9.4 Script

#### POST /v1/scripts
- 描述：保存一个剧本
- 请求：`{ title, scene_tag, content }`
- 加密存储

#### GET /v1/scripts
- 描述：剧本列表（按 scene_tag 过滤）

#### PATCH /v1/scripts/{id}
- 描述：改写

#### DELETE /v1/scripts/{id}
- 描述：删除

### 9.5 Progress

#### GET /v1/progress
- 描述：进度与里程碑
- 用户可关闭

#### POST /v1/progress/increment
- 描述：自报一次「我做到了」
- 请求：`{ bucket, count, happened_at }`

#### POST /v1/progress/disable
- 描述：关闭进度

### 9.6 Data Request

#### POST /v1/data-requests
- 描述：创建数据请求
- 请求：`{ type: "export" | "delete" }`
- 响应：202 + `DataRequest`

#### GET /v1/data-requests/{id}
- 描述：查询处理状态

## 10. AI 编排 API

> 这是产品的核心。需与 PE / A / Q 共同签字。

### 10.1 模型

#### POST /v1/conversations/{id}/messages（流式）
- 描述：发送用户消息，并以 SSE 流式返回助手消息
- 协议：`text/event-stream`
- 事件类型：
  - `message.start`  助手开始
  - `message.delta`  增量内容
  - `message.suggestion`  可执行小动作（≤ 1 条）
  - `crisis.detected`  危机检测命中
  - `tool.kb`  知识块被引用
  - `message.end`  结束（附 token / latency / model）

#### 关键约束
- 单次会话 token 上限 8k（输入+输出），超出返回 `NW-CO-0003`
- 每次调用都写 `trace_id`、`prompt_id`、`prompt_version`

### 10.2 Prompt 版本
- 模板维护在 Orchestrator
- 暴露内部端点 `/internal/prompts/{id}/versions`（服务间）

### 10.3 评测接口（服务间）
#### POST /internal/evals/run
- 请求：`{ prompt_id, version, eval_set_id, sample_size }`
- 响应：评测任务 ID

#### GET /internal/evals/runs/{id}
- 查询评测结果

## 11. 危机路径 API

> 危机路径独立部署，URL 独立前缀。

### 11.1 服务前缀
- `/crisis/*`（与 `/api` 隔离）

### 11.2 端点

#### POST /crisis/events
- 描述：内部记录一次危机事件
- 鉴权：服务 Token
- 必填：`user_id_hash`、`type`、`severity`、`detected_by`、`trace_id`

#### GET /crisis/resources
- 描述：兜底资源（热线、医院、紧急联系人建议）
- 鉴权：公开（紧急情况下）
- 响应：按地区动态（默认中国大陆）

#### POST /crisis/follow-up
- 描述：用户对兜底页的反馈
- 请求：`{ event_id, choice: "safe" | "keep_talking" | "exit" }`

### 11.3 强约束
- 危机资源端点不鉴权、不限流（紧急不卡）
- 事件写入走强一致（同步落库）
- 失败立即 P0 告警

## 12. 知识库 API（内部）

> 仅服务间调用，KE 维护。

### 12.1 端点

#### POST /internal/kb/blocks
- 创建知识块（KE 流程）

#### PATCH /internal/kb/blocks/{id}
- 更新

#### POST /internal/kb/blocks/{id}/publish
- 发布（必须有 `reviewed_by`）

#### POST /internal/kb/blocks/{id}/deprecate
- 弃用

#### POST /internal/kb/search
- 检索（top-K + 标签过滤 + 重排）
- 请求：`{ query, scene_tags?, layer?, top_k, top_n }`
- 响应：知识块列表（仅 summary，不返 body）

## 13. 事件与回调

> MVP 阶段尽量少用事件，关键事件走同步 + 审计。

### 13.1 关键事件（异步）
| 事件 | 触发 | 消费者 |
| --- | --- | --- |
| `crisis.detected` | Orchestrator | CrisisPath、Audit |
| `data.requested` | DataRequest | 后台 worker |
| `data.completed` | worker | 通知（可选） |
| `prompt.version_changed` | Orchestrator | PE、Q（评测） |
| `kb.published` | KB | PE（注入） |

### 13.2 通道
- Redis Stream（MVP）
- 后续可换 Kafka

## 14. 兼容性策略

| 变更类型 | 策略 |
| --- | --- |
| 新增字段 | 兼容 |
| 新增端点 | 兼容 |
| 删除字段 | 走 v2 |
| 修改语义 | 走 v2 |
| 修改错误码 | 新增 + 旧码标记 deprecated |

## 15. 文档与契约

- OpenAPI 3.1 单一来源，存放 `docs/architecture/openapi.yaml`
- 每次提交自动生成 Mock（Prism / Stoplight）
- FE / PE / Q 任何破坏性变更必须先提 RFC
- 文档随发布版本快照

## 16. 风险与缓解

| 风险 | 等级 | 缓解 |
| --- | --- | --- |
| 错误码漂移 | P0 | 6 位码 + 字典表 + CI 校验 |
| 契约 / 实现不一致 | P0 | OpenAPI 单一来源 + 契约测试 |
| 危机接口被限流 / 鉴权挡住 | P0 | 独立前缀 + 公开 + 强监控 |
| 幂等键泄漏 | P1 | 服务端不返回 key 内容 |
| 错误体含 PII | P0 | 错误体只含 trace_id，不含原文 |
| 大量重试压垮上游 | P1 | 退避 + 限流 + 兜底话术 |
| OpenAPI 漂移 | P1 | 提交时校验 + Mock 自动化 |

## 17. 附录

### 17.1 关联文档
- 架构：`docs/03-System-Architecture.md`
- 数据库：`docs/04-Database-Design.md`
- 原型：`docs/02-Prototype.md`
- 测试：`docs/07-Test-Plan.md`
- 部署：`docs/08-Deployment-Plan.md`

### 17.2 名词
- 幂等键：客户端生成，服务端 24h 内复用
- Trace：分布式追踪 ID
- SSE：Server-Sent Events
- 兜底话术：模型失败时本地静态返回
