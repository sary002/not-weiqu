# embeddings · 向量化与 RAG 召回策略

> **Owner**：Knowledge Engineer（KE）+ Architect（A）
> **Reviewer**：PE、Q、BE
> **版本**：v1.0
> **关联**：`docs/03-System-Architecture.md` §7、`docs/04-Database-Design.md` §6、`docs/05-API-Design.md` §10 / §12

---

## 1. 目标
把 KB 资产（chunk / case / tag）向量化，支持 RAG 双路召回 + 混合重排，让 reply 在事实层、案例层、模式层都有依据。

## 2. 模型选型

| 候选 | 维度 | 优势 | 决策 |
| --- | --- | --- | --- |
| OpenAI text-embedding-3-large | 3072 | 通用强 | 备选 |
| BGE-M3 | 1024 | 中文优 | **默认** |
| M3E | 768 | 中文轻量 | 候选 |

> 默认 BGE-M3（中文场景）。落地前需在自有语料评测。

## 3. 嵌入维度

| 资产类型 | 维度 | 索引 |
| --- | --- | --- |
| Chunk | 1024 | HNSW(cosine) |
| Case | 1024 | HNSW(cosine) |
| Tag（二级标签） | 1024 | HNSW(cosine) |
| Query（用户输入） | 1024 | 临时向量 |

## 4. 索引

- 向量库：pgvector（MVP 起步）
- 大规模后切：Qdrant
- 元数据过滤：标签 / 五层 / 风险 / 版本 / 状态

```sql
-- 索引 DDL 示例
CREATE INDEX idx_chunk_emb ON nw_kb_block USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_case_emb ON nw_case_block USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_chunk_tags ON nw_kb_block USING gin (tags);
CREATE INDEX idx_chunk_layer ON nw_kb_block USING gin (layer);
```

## 5. RAG 召回流程

```
用户输入
   ↓
[1] Query 改写（analyze 输出 emotion/pattern/layer 作 query expansion）
   ↓
[2] 双路召回
   - 向量召回 top-K=20
   - 标签召回（emotion/* + boundary/* + pattern/*）
   ↓
[3] 交叉融合（RRF）
   ↓
[4] 元数据过滤（场景、风险、版本、已发布）
   ↓
[5] 重排（重排模型 + 规则）
   ↓
[6] 取 top-N（N=3~5）给 Orchestrator
```

## 6. 召回权重

| 维度 | 权重 |
| --- | --- |
| 场景相关 | +0.5 |
| 情绪相关 | +0.3 |
| 边界层相关 | +0.3 |
| 风险标签匹配 | +0.2 |
| 同一书多片去重 | -0.1 |
| 来源未审校 | -10（直接过滤） |
| 危机信号下 | -∞（直接禁召） |

## 7. 重排

- 重排模型：开源 bge-reranker-large（中文）
- 规则重排：标签命中 + 五层匹配
- 输出：top-5 给 Orchestrator

## 8. 失败兜底

| 失败 | 兜底 |
| --- | --- |
| 召回为空 | 注入「通用知识块」 + reply 走 calm_brief |
| 召回冲突（互相矛盾） | 取五层匹配度最高 + KB 审校过的版本 |
| 召回风险标签冲突 | 过滤高风险项 |
| 危机信号 | 召回禁启，全部走 CrisisPath |

## 9. 性能预算

| 项 | 目标 |
| --- | --- |
| Embedding 耗时（单条） | ≤ 200ms |
| 向量召回 P99 | ≤ 200ms |
| 重排 P99 | ≤ 100ms |
| 端到端 P99 | ≤ 500ms |
| 召回 cache 命中率 | ≥ 30% |

## 10. 评测

| 指标 | 目标 |
| --- | --- |
| 召回 Recall@5 | ≥ 0.85 |
| 召回 Recall@10 | ≥ 0.92 |
| 重排 NDCG@5 | ≥ 0.80 |
| 端到端「reply 采纳率」 | ≥ 70% |
| 危机漏召率 | 0 |

## 11. 关联文档

| 关联 | 路径 |
| --- | --- |
| 架构（KB 与 RAG） | `docs/03-System-Architecture.md` §7 |
| 数据库 | `docs/04-Database-Design.md` §4.4 / §6 |
| API（KB 内部） | `docs/05-API-Design.md` §12 |
| 索引策略 | `knowledge/embeddings/index-strategy.md` |
| 知识库更新 | `knowledge/UPDATE-MECHANISM.md` |
| 版本管理 | `knowledge/VERSION-MANAGEMENT.md` |
