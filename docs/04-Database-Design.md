# 04 数据库设计（Database Design）

> **Owner**：Backend（BE）
> **Reviewer**：A、PM、Q
> **版本**：v1.0
> **关联**：`docs/03-System-Architecture.md`、`rules/safety.md`

---

## 目录

- [1. 目标与读者](#1-目标与读者)
- [2. 设计原则](#2-设计原则)
- [3. 概念模型](#3-概念模型)
- [4. 逻辑模型](#4-逻辑模型)
- [5. 物理模型](#5-物理模型)
- [6. 知识库与向量存储](#6-知识库与向量存储)
- [7. 索引策略](#7-索引策略)
- [8. 备份与恢复](#8-备份与恢复)
- [9. 数据生命周期与保留](#9-数据生命周期与保留)
- [10. 隐私与脱敏策略](#10-隐私与脱敏策略)
- [11. 迁移策略](#11-迁移策略)
- [12. 性能与扩展](#12-性能与扩展)
- [13. 监控与告警](#13-监控与告警)
- [14. 风险与缓解](#14-风险与缓解)
- [15. 附录](#15-附录)

---

## 1. 目标与读者

让「对话、剧本、进度、知识」四类数据在「零 PII 默认 + 可删除 + 可导出 + 可观测」四件约束下平稳落地。

读者：BE、A、PM、Q、KE、PE。

## 2. 设计原则

| # | 原则 | 含义 |
| --- | --- | --- |
| DB-1 | 最小化 | 默认不收集 PII |
| DB-2 | 脱敏默认 | 存储即脱敏，明文只在内存 |
| DB-3 | 可删除 | 24h 内物理 / 逻辑删除 |
| DB-4 | 可导出 | 用户可一键导出 |
| DB-5 | 不裸日志 | PII 一律脱敏后再打印 |
| DB-6 | 可观测 | 关键表有审计字段 |
| DB-7 | 单一职责 | 一张表只服务一个核心场景 |
| DB-8 | 软硬分离 | 业务数据与审计数据分库 |

## 3. 概念模型

```
用户（匿名档案） 1───n  对话会话
   │                  │
   │                  n
   │                  ▼
   │                对话消息
   │                  │
   │                  n
   │                  ▼
   │              危机事件
   │
   ├───n 用户剧本（Script）
   │
   ├───n 进度条目
   │
   └───n 用户偏好

场景（Scenario） 1───n 知识块（KB）
   │                  │
   │                  n
   │                  ▼
   │              标签
```

## 4. 逻辑模型

> 表前缀 `nw_` = NotWeiqu；脱敏字段以 `_hash` / `_enc` 结尾。

### 4.1 用户域

#### `nw_user_profile`
| 字段 | 类型 | 必填 | 备注 |
| --- | --- | --- | --- |
| id | uuid | Y | 主键 |
| device_hash | text | Y | 设备指纹哈希，唯一 |
| user_token | text | N | 登录后绑定 |
| display_alias | text | N | 用户自定义别名（可空） |
| preferred_tone | text | N | 「温和 / 简洁 / 详细」 |
| preferred_scenario | text[] | N | 偏好场景 |
| reduced_motion | bool | N | 减少动效 |
| created_at | timestamptz | Y | |
| updated_at | timestamptz | Y | |
| deleted_at | timestamptz | N | 软删除 |

#### `nw_user_preference`
| 字段 | 类型 | 必填 | 备注 |
| --- | --- | --- | --- |
| id | uuid | Y | |
| user_id | uuid | Y | FK |
| key | text | Y | 偏好键 |
| value | jsonb | Y | 偏好值 |
| updated_at | timestamptz | Y | |

### 4.2 对话域

#### `nw_conversation`
| 字段 | 类型 | 必填 | 备注 |
| --- | --- | --- | --- |
| id | uuid | Y | |
| user_id | uuid | Y | FK |
| scenario_id | uuid | N | 关联场景 |
| type | text | Y | `free` / `drill` / `crisis` |
| status | text | Y | `active` / `ending` / `closed` |
| started_at | timestamptz | Y | |
| last_active_at | timestamptz | Y | |
| closed_at | timestamptz | N | |
| summary | text | N | 摘要（脱敏后） |
| key_facts | jsonb | N | 关键事实（脱敏） |
| crisis_flag | bool | N | 是否触发过危机 |
| created_at | timestamptz | Y | |

#### `nw_message`
| 字段 | 类型 | 必填 | 备注 |
| --- | --- | --- | --- |
| id | uuid | Y | |
| conversation_id | uuid | Y | FK |
| role | text | Y | `user` / `assistant` / `system` |
| content_enc | bytea | Y | 加密存储 |
| content_hash | text | Y | 内容哈希（用于去重 / 回放） |
| token_in | int | N | 输入 token |
| token_out | int | N | 输出 token |
| model | text | N | 实际模型 |
| prompt_id | text | N | 模板 ID |
| prompt_version | text | N | 模板版本 |
| trace_id | text | Y | 链路追踪 |
| redacted | bool | Y | 是否被 Guardrails 改写 |
| crisis_hit | bool | N | 是否命中危机信号 |
| created_at | timestamptz | Y | |

#### `nw_crisis_event`
| 字段 | 类型 | 必填 | 备注 |
| --- | --- | --- | --- |
| id | uuid | Y | |
| user_id | uuid | Y | FK |
| conversation_id | uuid | N | |
| message_id | uuid | N | |
| type | text | Y | `self_harm` / `harm_others` / `acute_distress` / `violence` / `minor` / `perinatal` |
| severity | text | Y | `low` / `med` / `high` |
| detected_by | text | Y | `rule` / `model` / `hybrid` |
| follow_up | text | N | 用户选择的后续动作 |
| created_at | timestamptz | Y | |

### 4.3 内容域

#### `nw_scenario`
| 字段 | 类型 | 必填 | 备注 |
| --- | --- | --- | --- |
| id | uuid | Y | |
| code | text | Y | 唯一代号 |
| title | text | Y | |
| one_liner | text | Y | |
| layer | text | Y | L1~L5 |
| scene_tags | text[] | Y | 场景标签 |
| difficulty | int | Y | 1~5 |
| status | text | Y | `draft` / `published` / `archived` |
| owner_agent | text | Y | `KE` |
| reviewed_at | timestamptz | N | |
| reviewed_by | text | N | |
| version | int | Y | |

#### `nw_script`
| 字段 | 类型 | 必填 | 备注 |
| --- | --- | --- | --- |
| id | uuid | Y | |
| user_id | uuid | Y | FK |
| title | text | Y | 用户自命名 |
| scene_tag | text | Y | |
| content_enc | bytea | Y | 加密 |
| source | text | Y | `ai` / `user_edit` / `community_pick` |
| ai_drill_id | uuid | N | 关联演练 |
| created_at | timestamptz | Y | |
| updated_at | timestamptz | Y | |

#### `nw_progress`
| 字段 | 类型 | 必填 | 备注 |
| --- | --- | --- | --- |
| id | uuid | Y | |
| user_id | uuid | Y | FK |
| bucket | text | Y | `said_no` / `no_apology` / `set_boundary` ... |
| count | int | Y | |
| last_at | timestamptz | Y | |
| created_at | timestamptz | Y | |

#### `nw_milestone`
| 字段 | 类型 | 必填 | 备注 |
| --- | --- | --- | --- |
| id | uuid | Y | |
| user_id | uuid | Y | FK |
| title | text | Y | 用户自填或系统生成 |
| happened_at | date | Y | |
| created_at | timestamptz | Y | |

### 4.4 知识域

#### `nw_kb_block`
| 字段 | 类型 | 必填 | 备注 |
| --- | --- | --- | --- |
| id | uuid | Y | |
| title | text | Y | |
| one_liner | text | Y | |
| layer | text | Y | L1~L5 |
| scene_tags | text[] | Y | |
| difficulty | int | Y | |
| applicable | text | Y | 适用场景 |
| not_applicable | text | Y | 不适用场景 |
| source_name | text | Y | |
| source_url | text | Y | |
| source_version | text | Y | |
| risk_notes | text | Y | |
| body | text | Y | 正文（不直接对外） |
| embedding | vector(768) | Y | pgvector |
| tags | text[] | Y | |
| reviewed_at | timestamptz | N | |
| reviewed_by | text | N | |
| status | text | Y | `draft` / `published` / `deprecated` |
| version | int | Y | |

#### `nw_kb_audit`
| 字段 | 类型 | 必填 | 备注 |
| --- | --- | --- | --- |
| id | uuid | Y | |
| kb_id | uuid | Y | FK |
| action | text | Y | `create` / `update` / `publish` / `deprecate` |
| operator | text | Y | |
| diff | jsonb | Y | |
| created_at | timestamptz | Y | |

### 4.5 审计域（独立库 / 独立 schema）

#### `nw_audit_event`
| 字段 | 类型 | 必填 | 备注 |
| --- | --- | --- | --- |
| id | uuid | Y | |
| user_id_hash | text | N | 设备指纹哈希 |
| trace_id | text | Y | |
| event_type | text | Y | |
| payload | jsonb | Y | 已脱敏 |
| created_at | timestamptz | Y | |

#### `nw_data_request`
| 字段 | 类型 | 必填 | 备注 |
| --- | --- | --- | --- |
| id | uuid | Y | |
| user_id | uuid | Y | FK |
| type | text | Y | `export` / `delete` |
| status | text | Y | `pending` / `running` / `done` / `failed` |
| requested_at | timestamptz | Y | |
| completed_at | timestamptz | N | |
| sla_due_at | timestamptz | Y | 默认 24h |

## 5. 物理模型

### 5.1 数据库
- 主库：PostgreSQL 15+
- 业务库 `nw_main` + 审计库 `nw_audit`（同实例不同 schema，权限隔离）
- 向量检索：pgvector（同库同 schema 起步，规模增长后拆分）

### 5.2 字符集 / 排序
- `utf8mb4` / `en_US.utf8`
- 排序规则 `C`（避免 locale 性能损耗）

### 5.3 时区
- 全库 UTC，渲染端按本地时区

### 5.4 主键
- 全部 `uuid v7`（时序友好）

### 5.5 时间戳
- 全部 `timestamptz`

### 5.6 大字段
- `nw_message.content_enc`、`nw_script.content_enc`：`bytea` + KMS 加密
- `nw_milestone.body`：`text`（用户自填，需做敏感词扫描）

## 6. 知识库与向量存储

### 6.1 表设计要点
- 知识块正文不入向量库索引，避免越权
- 向量维度统一 768（视模型选型调整）
- 标签 + 场景 + 边界五层作为元数据过滤

### 6.2 索引
- HNSW：`embedding vector_cosine_ops`
- 标签：GIN

### 6.3 检索流程
1. Embedding（在线 or 离线）
2. top-K 召回（K=20）
3. 标签过滤（场景 / 边界五层 / 风险）
4. 重排（规则 + 关键词）
5. 取 top-N（N=3~5）给 Orchestrator

## 7. 索引策略

| 表 | 索引 | 目的 |
| --- | --- | --- |
| `nw_user_profile` | `(device_hash)` 唯一 | 设备查档 |
| `nw_user_profile` | `(user_token)` 唯一（部分） | 登录用户查档 |
| `nw_conversation` | `(user_id, last_active_at desc)` | 用户会话列表 |
| `nw_conversation` | `(crisis_flag)` 部分 | 危机检索 |
| `nw_message` | `(conversation_id, created_at)` | 会话内消息顺序 |
| `nw_message` | `(content_hash)` | 去重 |
| `nw_message` | `(trace_id)` | 回放 |
| `nw_scenario` | `(code)` 唯一 | 业务查场景 |
| `nw_scenario` | `(scene_tags)` GIN | 标签筛选 |
| `nw_kb_block` | `(status) WHERE status='published'` 部分 | 在线查询 |
| `nw_kb_block` | `(scene_tags)` GIN | 标签筛选 |
| `nw_audit_event` | `(event_type, created_at desc)` | 审计 |
| `nw_audit_event` | `(trace_id)` | 链路 |
| `nw_data_request` | `(status, sla_due_at)` | SLA 监控 |

## 8. 备份与恢复

| 项 | 策略 |
| --- | --- |
| 全量备份 | 每日 1 次，保留 30 天 |
| 增量备份 | WAL 归档，保留 7 天 |
| 异地灾备 | 同城不同 AZ |
| 恢复演练 | 季度 1 次 |
| RPO | ≤ 1h |
| RTO | ≤ 30min |

## 9. 数据生命周期与保留

| 数据 | 保留期 | 说明 |
| --- | --- | --- |
| 对话原文（加密） | 90d 滚动 | 到期归档 30d 后删除 |
| 对话摘要 | 180d | 仅保留脱敏摘要 |
| 用户剧本 | 至用户删除 | 用户可随时删 |
| 进度数据 | 至用户删除 | 用户可一键关停 |
| 危机事件 | 365d | 仅事件，不存内容 |
| 审计日志 | 365d | 不可改、不可删 |
| 知识块 | 长期 | 由 KE 决定 deprecate |
| 备份 | 30d | 滚动 |

> 用户主动删除 → 24h 内物理 / 逻辑删除 + 通知 Audit。

## 10. 隐私与脱敏策略

### 10.1 字段级策略
| 字段 | 策略 |
| --- | --- |
| `device_hash` | SHA-256 + salt（独立） |
| `user_token` | 哈希 |
| `display_alias` | 用户自填，按 PII 处理 |
| 消息原文 | KMS 加密（AES-256-GCM） |
| 手机号 | 收集即脱敏（中间四位 *） |
| 定位 | 不收 |

### 10.2 日志策略
- 0 明文对话出现在日志
- 仅打印：trace_id、user_id_hash、prompt_id、prompt_version、token_in/out、model、latency

### 10.3 第三方策略
- 不向第三方发送对话原文
- 不向第三方发送可识别 PII
- 第三方分析默认关闭

## 11. 迁移策略

### 11.1 工具
- 迁移工具：`golang-migrate` / `sqlx` / `prisma`（按语言定）
- 所有 DDL 必须有 up / down
- 不可逆变更走 ADR

### 11.2 流程
1. 开发者本地迁移 + 集成测试
2. CI 中跑迁移 + schema 校验
3. staging 灰度
4. 生产灰度（按租户）
5. 回滚预案就绪

### 11.3 大表变更
- 影子表 → 数据双写 → 切流 → 清理

## 12. 性能与扩展

| 指标 | 目标 |
| --- | --- |
| 单条消息写入 P99 | ≤ 50ms |
| 会话列表查询 P99 | ≤ 200ms |
| 向量检索 P99 | ≤ 300ms |
| 写入吞吐 | ≥ 5k QPS |
| 主从延迟 | ≤ 1s |
| 连接数 | 应用层连接池 ≤ 200 / 实例 |

扩展：
- 写多读少场景：分库分表（user_id 哈希）
- 向量库规模上来后独立部署（Qdrant / Weaviate）

## 13. 监控与告警

| 指标 | 告警 |
| --- | --- |
| 写入错误率 | > 1% 持续 5min |
| 复制延迟 | > 5s 持续 5min |
| 备份失败 | 1 次即告 |
| SLA（数据删除）超时 | > 24h 即 P1 |
| PII 出现在日志 | 1 次即 P0 |
| 危机路径写入失败 | 1 次即 P0 |
| 磁盘使用 | > 80% 告警 |
| 长事务 | > 30s 告警 |

## 14. 风险与缓解

| 风险 | 等级 | 缓解 |
| --- | --- | --- |
| PII 泄露 | P0 | 字段级脱敏 + 0 明文日志 + Q 渗透 |
| 危机事件数据丢失 | P0 | 独立审计库 + 强一致写入 |
| 单库故障 | P0 | 多 AZ + 灾备演练 |
| 向量检索性能塌方 | P1 | top-K 限制 + 缓存 + 重排降级 |
| 数据删除 SLA 超时 | P1 | SLA 监控 + 自动催办 |
| 大表 DDL 阻塞 | P1 | 影子表 + 切流 |
| 用户数据误删 | P1 | 软删除 + 二次确认 + 7d 回收站（可选） |

## 15. 附录

### 15.1 命名规范
- 表：`nw_<domain>_<entity>`，snake_case
- 字段：snake_case
- 索引：`idx_<table>_<col>_<order>`
- 约束：`chk_<table>_<rule>`

### 15.2 关联文档
- 架构：`docs/03-System-Architecture.md`
- API：`docs/05-API-Design.md`
- 部署：`docs/08-Deployment-Plan.md`
- 测试：`docs/07-Test-Plan.md`
- 安全：`rules/safety.md`
