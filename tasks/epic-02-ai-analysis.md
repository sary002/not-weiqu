# Epic 02 · AI Analysis 智能分析

> **Owner**：Coordinator（C）统筹
> **主要执行 Agent**：PE、KE、BE、FE、A、Q
> **关联文档**：`docs/01-PRD.md`、`prompts/analyze.md`、`prompts/reply.md`、`docs/03-System-Architecture.md` §6、`docs/05-API-Design.md` §10、`knowledge/00-Overview.md`、`docs/07-Test-Plan.md`

---

## 1. Epic 概述

### 1.1 目标
把 4 份主 Prompt（analyze / reply）+ 演练 + RAG + AI Orchestrator 全部落地，让用户能在「自由对话 / 演练」中拿到「不攻击 / 不报复 / 不隐忍」的回复与脚本。

### 1.2 范围
- analyze prompt 实现
- reply prompt 实现
- 自由对话（流式 SSE）
- 演练（drill sessions）
- AI Orchestrator（路由 / 上下文 / 降级 / 缓存）
- RAG 召回
- 知识库构建（M2 末 200 chunk / 60 case）
- 评测集

### 1.3 不在范围
- 日记 / 剧本保存（Epic 03）
- 成长报告（Epic 04）
- 危机路径服务（Epic 01.5）

### 1.4 关键指标
| 指标 | 目标 |
| --- | --- |
| AI 首 token | ≤ 1.5s |
| 危机漏召 | 0 |
| 危机误召 | ≤ 5% |
| 「你应该」类 | 0 |
| 边界层准确率 | ≥ 85% |
| 模式识别准确率 | ≥ 85% |
| RAG Recall@5 | ≥ 0.85 |
| 端到端 P99 | ≤ 2.0s |

### 1.5 总工时估
| Story | 工时（人时） |
| --- | --- |
| 2.1 analyze 实现 | 80 |
| 2.2 reply 实现 | 96 |
| 2.3 自由对话 | 120 |
| 2.4 演练 | 144 |
| 2.5 AI Orchestrator | 160 |
| 2.6 RAG 召回 | 128 |
| 2.7 知识库构建 | 240 |
| 2.8 评测与回归 | 96 |
| **合计** | **1 064 人时** |

---

## 2. Story 列表

| ID | Story | Owner Agent | 估时 | 依赖 |
| --- | --- | --- | --- | --- |
| 2.1 | analyze prompt 实现 | PE / BE | 80 | 1.1 |
| 2.2 | reply prompt 实现 | PE / BE / FE | 96 | 2.1 |
| 2.3 | 自由对话 | BE / FE / PE | 120 | 2.2 |
| 2.4 | 演练 | FE / BE / PE | 144 | 2.2, 2.6 |
| 2.5 | AI Orchestrator | A / BE | 160 | 1.5, 2.1 |
| 2.6 | RAG 召回 | BE / A / KE | 128 | 1.5, 2.7 |
| 2.7 | 知识库构建 | KE | 240 | 1.1 |
| 2.8 | 评测与回归 | Q / PE | 96 | 2.1~2.7 |

---

## 3. Story 2.1 · analyze prompt 实现

### 3.1 描述
基于 `prompts/analyze.md` v1.0 实现 analyze 服务，对用户输入做结构化分析。

### 3.2 验收标准
- [ ] 100% 输出符合 Schema
- [ ] 危机召回 ≥ 99%
- [ ] 危机误召 ≤ 5%
- [ ] P95 延迟 ≤ 1.5s
- [ ] Token 预算 ≤ 3.7k

### 3.3 依赖
- Story 1.1（用户档案）
- Story 1.5（危机路径独立）

### 3.4 Tasks

#### Task 2.1.1 · Analyze Service 骨架（BE）
- **Owner**：BE
- **估时**：8h
- **输出**：服务骨架 + 接口定义
- **验收**：契约测试通过

#### Task 2.1.2 · Prompt 注入与缓存（PE / BE）
- **Owner**：PE / BE
- **估时**：8h
- **输出**：System Prompt 注入 + cache
- **依赖**：`prompts/analyze.md` §4
- **验收**：cache 命中率 ≥ 50%

#### Task 2.1.3 · LLM 抽象层（BE / A）
- **Owner**：BE / A
- **估时**：16h
- **输出**：LLM 抽象层（主备路由）
- **依赖**：`docs/03-System-Architecture.md` §6.3
- **验收**：主备切换 ≤ 5s

##### Subtask 2.1.3.1 · 主供应商适配
- **Owner**：BE
- **估时**：4h

##### Subtask 2.1.3.2 · 备供应商适配
- **Owner**：BE
- **估时**：4h

##### Subtask 2.1.3.3 · 路由与降级
- **Owner**：BE
- **估时**：8h
- **验收**：上游全挂 → 兜底话术

#### Task 2.1.4 · Constrained Decoding（BE）
- **Owner**：BE
- **估时**：8h
- **输出**：JSON Schema 强制
- **验收**：100% 输出合规

#### Task 2.1.5 · 危机信号识别（PE / BE）
- **Owner**：PE / BE
- **估时**：16h
- **输出**：保守模型 + 规则混合
- **依赖**：`prompts/analyze.md` §4 危机信号识别
- **验收**：召回 ≥ 99%

#### Task 2.1.6 · Schema 校验（BE）
- **Owner**：BE
- **估时**：8h
- **输出**：JSON Schema 校验层
- **验收**：失败 → 兜底 + P1 告警

#### Task 2.1.7 · 单元测试（BE / PE）
- **Owner**：BE / PE
- **估时**：8h
- **输出**：单元测试覆盖
- **验收**：覆盖 ≥ 80%

#### Task 2.1.8 · 集成测试（Q）
- **Owner**：Q
- **估时**：8h
- **输出**：验收报告
- **验收**：红线用例 100%

---

## 4. Story 2.2 · reply prompt 实现

### 4.1 描述
基于 `prompts/reply.md` v1.0 实现 reply 服务，按 CRIA 结构回复。

### 4.2 验收标准
- [ ] 100% 输出符合 Schema
- [ ] 危机场景 100% 跳 crisis_redirect
- [ ] 「你应该」类 0
- [ ] P95 延迟 ≤ 2.0s
- [ ] 边界层匹配 ≥ 85%

### 4.3 依赖
- Story 2.1

### 4.4 Tasks

#### Task 2.2.1 · Reply Service 骨架（BE）
- **Owner**：BE
- **估时**：8h
- **输出**：服务骨架
- **验收**：契约测试通过

#### Task 2.2.2 · CRIA 拼装（PE / BE）
- **Owner**：PE / BE
- **估时**：16h
- **输出**：4 段拼装器
- **依赖**：`prompts/reply.md` §3.2
- **验收**：
  - [ ] 字数 ≤ 150
  - [ ] 4 段全填
  - [ ] 危机 → fallback

#### Task 2.2.3 · 边界层适配（PE / BE）
- **Owner**：PE / BE
- **估时**：8h
- **输出**：L1~L5 适配
- **验收**：每层 1 个样本通过

#### Task 2.2.4 · 语气切换（PE / BE）
- **Owner**：PE / BE
- **估时**：8h
- **输出**：calm_warm / calm_brief / gentle_firm
- **验收**：3 种语气评测集通过

#### Task 2.2.5 · 长程收束（PE / BE）
- **Owner**：PE / BE
- **估时**：8h
- **输出**：turn ≥ 6 收束逻辑
- **依赖**：`prompts/reply.md` §5
- **验收**：20 轮语气不漂移

#### Task 2.2.6 · 关键词扫描兜底（BE）
- **Owner**：BE
- **估时**：8h
- **输出**：「你应该」「忍一忍」扫描
- **验收**：扫描命中 → 兜底重写 + 告警

#### Task 2.2.7 · 单元测试 + 集成（Q）
- **Owner**：Q
- **估时**：16h
- **输出**：验收报告
- **验收**：评测集 ≥ 95% 通过

---

## 5. Story 2.3 · 自由对话

### 5.1 描述
用户在「自由对话」页可随时倾诉，AI 按 CRIA 接住。流式 SSE 实时输出。

### 5.2 验收标准
- [ ] 流式 SSE P99 ≤ 2.0s 首 token
- [ ] 6 轮后主动收束
- [ ] 退出 / 暂停 / 保存 100% 可达
- [ ] 危机场景 100% 跳兜底页
- [ ] 0 PII 出现在日志

### 5.3 依赖
- Story 2.2

### 5.4 Tasks

#### Task 2.3.1 · 流式 SSE 编排（BE）
- **Owner**：BE
- **估时**：16h
- **输出**：`POST /v1/conversations/{id}/messages` 流式
- **依赖**：`docs/05-API-Design.md` §10.1
- **验收**：
  - [ ] event: message.start / delta / suggestion / crisis.detected / end
  - [ ] 100% 事件触发正确

#### Task 2.3.2 · 上下文管理（BE）
- **Owner**：BE
- **估时**：16h
- **输出**：摘要 + 滑动窗口 + 关键事实
- **依赖**：`docs/03-System-Architecture.md` §6.2
- **验收**：20 轮不卡顿

##### Subtask 2.3.2.1 · 摘要服务
- **Owner**：BE
- **估时**：8h
- **输出**：摘要微服务
- **验收**：可独立降级

##### Subtask 2.3.2.2 · 关键事实表
- **Owner**：BE
- **估时**：4h
- **输出**：用户显式「我需要/不想」事实表
- **验收**：单独持久化

##### Subtask 2.3.2.3 · 滑动窗口
- **Owner**：BE
- **估时**：4h
- **输出**：token 预算裁剪
- **验收**：超 8k 触发收束

#### Task 2.3.3 · 自由对话页 UI（FE）
- **Owner**：FE
- **估时**：24h
- **输出**：`docs/02-Prototype.md` §5.4 页面
- **验收**：
  - [ ] 流式渲染无闪烁
  - [ ] 退出 / 暂停 / 保存 3 按钮
  - [ ] 危机 → 兜底页切换 < 200ms

#### Task 2.3.4 · 长程收束提示（FE / PE）
- **Owner**：FE / PE
- **估时**：8h
- **输出**：6 轮收束 banner
- **验收**：不催继续

#### Task 2.3.5 · 集成测试（Q）
- **Owner**：Q
- **估时**：16h
- **输出**：验收报告
- **验收**：可用性 ≥ 90%

---

## 6. Story 2.4 · 演练（Drill Sessions）

### 6.1 描述
用户在「今日练习」选场景，与 AI 角色扮演演练真实场景。

### 6.2 验收标准
- [ ] 8 个场景（M2 末）
- [ ] 演练过程可退出 / 暂停 / 保存
- [ ] 演练后给 1 句可执行话术
- [ ] 可保存到「我的剧本」

### 6.3 依赖
- Story 2.2, 2.6

### 6.4 Tasks

#### Task 2.4.1 · 场景库实现（BE / KE）
- **Owner**：BE / KE
- **估时**：16h
- **输出**：`nw_scenario` 表 + API
- **依赖**：`docs/04-Database-Design.md` §4.3
- **验收**：8 个场景上线

#### Task 2.4.2 · 演练 API（BE）
- **Owner**：BE
- **估时**：16h
- **输出**：`/v1/drills` + `/v1/drills/{id}/messages`
- **依赖**：`docs/05-API-Design.md` §9.7
- **验收**：契约 100%

#### Task 2.4.3 · 演练状态机（PE / BE）
- **Owner**：PE / BE
- **估时**：8h
- **输出**：INTRO → ROLEPLAY → SCRIPT_PROMPT → DONE
- **依赖**：`docs/02-Prototype.md` §7.2
- **验收**：4 状态切换正确

#### Task 2.4.4 · 演练页 UI（FE）
- **Owner**：FE
- **估时**：24h
- **输出**：`docs/02-Prototype.md` §5.3 页面
- **验收**：
  - [ ] 状态机切换流畅
  - [ ] 退出 / 暂停 / 保存
  - [ ] 1 句可执行话术

#### Task 2.4.5 · 「我的剧本」保存（BE / FE）
- **Owner**：BE / FE
- **估时**：8h
- **输出**：保存入口
- **依赖**：Epic 03
- **验收**：一键保存 + 标签

#### Task 2.4.6 · 集成测试（Q）
- **Owner**：Q
- **估时**：16h
- **输出**：验收报告
- **验收**：可用性 ≥ 90%

---

## 7. Story 2.5 · AI Orchestrator

### 7.1 描述
AI 编排服务：Prompt 注入 / 上下文 / 模型路由 / 降级 / 缓存 / 危机信号 / 评测接口。

### 7.2 验收标准
- [ ] 主备路由正常
- [ ] 上游全挂时本地兜底 ≤ 100ms
- [ ] 100% AI 调用有 trace_id + prompt_hash
- [ ] Token 预算守

### 7.3 依赖
- Story 1.5, 2.1

### 7.4 Tasks

#### Task 2.5.1 · Orchestrator 骨架（A / BE）
- **Owner**：A / BE
- **估时**：16h
- **输出**：服务骨架
- **依赖**：`docs/03-System-Architecture.md` §6
- **验收**：架构评审通过

#### Task 2.5.2 · Prompt 版本管理（PE / BE）
- **Owner**：PE / BE
- **估时**：16h
- **输出**：`prompt_id` + `version` 体系
- **验收**：100% 调用有 prompt_id + version

##### Subtask 2.5.2.1 · Prompt 模板存储
- **Owner**：BE
- **估时**：8h

##### Subtask 2.5.2.2 · 版本切换 + 回滚
- **Owner**：PE / BE
- **估时**：8h
- **验收**：1 步回滚

#### Task 2.5.3 · 上下文窗口管理（A / BE）
- **Owner**：A / BE
- **估时**：16h
- **输出**：摘要 + 滑动窗口 + 关键事实
- **依赖**：Task 2.3.2
- **验收**：20 轮不超预算

#### Task 2.5.4 · 模型路由（A / BE）
- **Owner**：A / BE
- **估时**：16h
- **输出**：主备 + 风险场景切保守
- **依赖**：`docs/03-System-Architecture.md` §6.3
- **验收**：路由矩阵全过

#### Task 2.5.5 · 降级路径（BE）
- **Owner**：BE
- **估时**：8h
- **输出**：本地兜底话术
- **验收**：上游全挂 ≤ 100ms

#### Task 2.5.6 · 缓存（BE）
- **Owner**：BE
- **估时**：8h
- **输出**：Redis 缓存
- **验收**：命中率 ≥ 30%

#### Task 2.5.7 · 限流（BE）
- **Owner**：BE
- **估时**：8h
- **输出**：单设备 / 对话 / 全局限流
- **验收**：超限返回 429

#### Task 2.5.8 · 速率限制（对话 / 演练）（BE）
- **Owner**：BE
- **估时**：8h
- **输出**：差异化限流
- **验收**：演练 30 req/min

#### Task 2.5.9 · 内容过滤双向（BE / Q）
- **Owner**：BE / Q
- **估时**：8h
- **输出**：输入 + 输出双向
- **验收**：0 越权

#### Task 2.5.10 · 评测接口（PE / BE）
- **Owner**：PE / BE
- **估时**：8h
- **输出**：`/internal/evals/run` + `/runs/{id}`
- **依赖**：`docs/05-API-Design.md` §10.3
- **验收**：PE 可跑回归

#### Task 2.5.11 · 可观测接入（BE）
- **Owner**：BE
- **估时**：8h
- **输出**：100% 调用有 trace_id
- **依赖**：Story 1.6
- **验收**：可回放

#### Task 2.5.12 · 集成测试（Q）
- **Owner**：Q
- **估时**：24h
- **输出**：验收报告
- **验收**：矩阵 100%

---

## 8. Story 2.6 · RAG 召回

### 8.1 描述
双路召回 + RRF + 重排 + 兜底。

### 8.2 验收标准
- [ ] RAG Recall@5 ≥ 0.85
- [ ] 危机场景召回禁启
- [ ] P99 ≤ 500ms

### 8.3 依赖
- Story 1.5, 2.7

### 8.4 Tasks

#### Task 2.6.1 · Embedding 模型接入（BE / A）
- **Owner**：BE / A
- **估时**：16h
- **输出**：BGE-M3 接入
- **依赖**：`knowledge/embeddings/README.md` §2
- **验收**：100ms / 条

#### Task 2.6.2 · 向量索引（BE / A）
- **Owner**：BE / A
- **估时**：8h
- **输出**：pgvector HNSW
- **依赖**：`docs/04-Database-Design.md` §6
- **验收**：索引可用

#### Task 2.6.3 · 元数据索引（BE）
- **Owner**：BE
- **估时**：8h
- **输出**：GIN 标签 / 场景 / 五层
- **验收**：标签召回快

#### Task 2.6.4 · Query 改写（PE / BE）
- **Owner**：PE / BE
- **估时**：16h
- **输出**：基于 analyze 输出的 query expansion
- **依赖**：`prompts/analyze.md`
- **验收**：召回率 +10%

#### Task 2.6.5 · 双路召回（BE）
- **Owner**：BE
- **估时**：8h
- **输出**：向量 + 标签双路
- **依赖**：`knowledge/embeddings/README.md` §5
- **验收**：双路独立可跑

#### Task 2.6.6 · RRF 融合（BE）
- **Owner**：BE
- **估时**：8h
- **输出**：RRF 算法
- **验收**：NDCG@5 ≥ 0.80

#### Task 2.6.7 · 重排（BE）
- **Owner**：BE
- **估时**：16h
- **输出**：bge-reranker-large
- **验收**：NDCG@5 提升

#### Task 2.6.8 · 元数据过滤（BE）
- **Owner**：BE
- **估时**：8h
- **输出**：场景 / 风险 / 版本 / 已发布过滤
- **验收**：未审校 -10

#### Task 2.6.9 · 兜底话术（BE）
- **Owner**：BE
- **估时**：4h
- **输出**：召回空 → 通用知识块
- **验收**：兜底 ≤ 100ms

#### Task 2.6.10 · 缓存（BE）
- **Owner**：BE
- **估时**：4h
- **输出**：Query 缓存
- **验收**：命中率 ≥ 30%

#### Task 2.6.11 · 集成测试（Q）
- **Owner**：Q
- **估时**：16h
- **输出**：评测集
- **验收**：Recall@5 ≥ 0.85

---

## 9. Story 2.7 · 知识库构建

### 9.1 描述
M2 末：200 chunk / 60 case；M3 末：500 chunk / 100 case。

### 9.2 验收标准
- [ ] 100% 来源审核
- [ ] 100% 标签覆盖
- [ ] 危机切片 0 误用

### 9.3 依赖
- Story 1.1

### 9.4 Tasks

#### Task 2.7.1 · 书籍入库（KE）
- **Owner**：KE
- **估时**：40h
- **输出**：32 本核心书登记
- **依赖**：`knowledge/books/`
- **验收**：审核 100%

#### Task 2.7.2 · 切片生产（KE）
- **Owner**：KE
- **估时**：80h
- **输出**：M2 末 200 / M3 末 500
- **依赖**：`prompts/chunk-extract.md`
- **验收**：模板 100% + 同行 1 审

#### Task 2.7.3 · 案例生产（KE）
- **Owner**：KE
- **估时**：80h
- **输出**：M2 末 30 / M3 末 60
- **依赖**：`prompts/case-extract.md`
- **验收**：11 字段 100%

#### Task 2.7.4 · 标签字典维护（KE）
- **Owner**：KE
- **估时**：16h
- **输出**：13 类 + 二级字典
- **依赖**：`knowledge/tags/`
- **验收**：唯一性 + 季度清理

#### Task 2.7.5 · 知识审核（KE + Q）
- **Owner**：KE + Q
- **估时**：16h
- **输出**：审核报告
- **验收**：红线用例 100%

#### Task 2.7.6 · 季度复核（KE + Q）
- **Owner**：KE + Q
- **估时**：8h
- **输出**：复核记录
- **依赖**：`knowledge/UPDATE-MECHANISM.md` §3

---

## 10. Story 2.8 · 评测与回归

### 10.1 描述
评测集构造、回归、红线演练。

### 10.2 验收标准
- [ ] analyze 评测集 ≥ 100 条
- [ ] reply 评测集 ≥ 100 条
- [ ] 红线 7 类全覆盖
- [ ] 回归 ≥ 95% 通过

### 10.3 依赖
- Story 2.1~2.7

### 10.4 Tasks

#### Task 2.8.1 · analyze 评测集（PE / Q）
- **Owner**：PE / Q
- **估时**：16h
- **输出**：≥ 100 条
- **依赖**：`prompts/analyze.md` §9.2
- **验收**：覆盖 5 类标准 + 3 类边缘 + 1 类危机

#### Task 2.8.2 · reply 评测集（PE / Q）
- **Owner**：PE / Q
- **估时**：16h
- **输出**：≥ 100 条
- **依赖**：`prompts/reply.md` §9.2
- **验收**：覆盖 5 类场景

#### Task 2.8.3 · RAG 评测集（Q / KE）
- **Owner**：Q / KE
- **估时**：16h
- **输出**：≥ 50 条 query
- **验收**：Recall@5 评测

#### Task 2.8.4 · 红线演练（Q）
- **Owner**：Q
- **估时**：8h
- **输出**：演练记录
- **依赖**：`docs/07-Test-Plan.md` §7
- **验收**：7 类全过

#### Task 2.8.5 · 回归自动化（Q / BE）
- **Owner**：Q / BE
- **估时**：16h
- **输出**：CI 集成
- **验收**：每次 PR 自动跑

#### Task 2.8.6 · 用户反馈闭环（PM / PE）
- **Owner**：PM / PE
- **估时**：8h
- **输出**：反馈埋点
- **依赖**：`prompts/reply.md` §9.3
- **验收**：月度「有用率」报告

#### Task 2.8.7 · 季度报告（PE / Q）
- **Owner**：PE / Q
- **估时**：8h
- **输出**：季度报告
- **验收**：复盘 + 改进计划

---

## 11. 风险与缓解

| 风险 | 等级 | 缓解 |
| --- | --- | --- |
| LLM 供应商故障 | P0 | 主备 + 兜底话术 |
| 危机话术漏触发 | P0 | 保守模型 + 月度演练 |
| 「你应该」类出现 | P0 | 关键词扫描 + 自动重写 |
| 知识库扩量不足 | P1 | M1 即启动 PoC |
| RAG 召回冲突 | P1 | 风险标签优先 + 审校版本优先 |
| Embedding 漂移 | P1 | 季度评测 + 重排 |

## 12. 关联文档

| 关联 | 路径 |
| --- | --- |
| PRD | `docs/01-PRD.md` |
| 原型 | `docs/02-Prototype.md` |
| 架构（Orchestrator / RAG） | `docs/03-System-Architecture.md` §6 / §7 |
| 数据库 | `docs/04-Database-Design.md` §6 |
| API | `docs/05-API-Design.md` §9 / §10 / §12 |
| 测试 | `docs/07-Test-Plan.md` |
| 主 Prompt | `prompts/analyze.md` / `prompts/reply.md` |
| 知识库 | `knowledge/` |
| 安全 | `rules/safety.md` |
