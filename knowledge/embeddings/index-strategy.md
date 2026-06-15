# 索引与重排策略（Index & Rerank Strategy）

> **Owner**：KE + A
> **版本**：v1.0
> **关联**：`knowledge/embeddings/README.md`

---

## 1. 索引类型

| 索引 | 字段 | 类型 | 用途 |
| --- | --- | --- | --- |
| HNSW | `embedding` | vector_cosine_ops | 向量召回 |
| GIN | `tags` | text[] | 标签召回 |
| GIN | `scene_tags` | text[] | 场景召回 |
| GIN | `layer` | text[] | 五层召回 |
| B-tree | `status` | text | 过滤（仅 published） |
| B-tree | `reviewed_at` | timestamptz | 12m 复核 |
| B-tree | `version` | text | 版本对齐 |

## 2. 双路召回

### 2.1 向量路
```sql
SELECT id, title, body, tags, layer
FROM nw_kb_block
WHERE status = 'published'
  AND reviewed_at > now() - interval '12 months'
ORDER BY embedding <=> $1
LIMIT 20;
```

### 2.2 标签路
```sql
SELECT id, title, body, tags, layer
FROM nw_kb_block
WHERE status = 'published'
  AND reviewed_at > now() - interval '12 months'
  AND (tags && $1::text[] OR layer && $2::text[])
LIMIT 20;
```

## 3. RRF 融合

```text
score(d) = sum( 1 / (k + rank_i(d)) ) for each list i
k = 60
```

## 4. 重排（bge-reranker-large + 规则）

```text
final_score = 0.7 * reranker_score + 0.3 * rule_score
rule_score  = 0.5 * scene_match + 0.3 * layer_match + 0.2 * risk_match
```

## 5. Top-N 输出

- 默认 N=5
- 案例特殊处理：至少 1 个 case
- 切片特殊处理：至少 1 个 concept

## 6. 缓存

- Query → top-N 结果 缓存 1h
- 命中率目标 ≥ 30%

## 7. 监控

| 指标 | 告警 |
| --- | --- |
| P99 > 800ms | P1 |
| 召回空率 > 10% | P2 |
| 重排耗时 > 200ms | P2 |
| 危机漏召 | 1 次 P0 |

## 8. 关联文档

| 关联 | 路径 |
| --- | --- |
| Embedding 总览 | `knowledge/embeddings/README.md` |
| 架构 | `docs/03-System-Architecture.md` §7 |
| 数据库 | `docs/04-Database-Design.md` §6 |
