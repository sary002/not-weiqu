# chunks · 知识切片策略

> **Owner**：Knowledge Engineer（KE）
> **版本**：v1.0
> **关联**：`knowledge/00-Overview.md` §5.1、`knowledge/books/`、`prompts/chunk-extract.md`

---

## 1. 使命
把书库中的「段落」切成可被 RAG 召回、可被 PE 拼入 `reply` 的**最小可注入单位**。

## 2. 切片原则（KB-1 ~ KB-10 继承）

| # | 原则 | 含义 |
| --- | --- | --- |
| C-1 | 最小可注入 | 每片 = 1 个完整观点 |
| C-2 | 自包含 | 脱离原文也能被理解 |
| C-3 | 可溯源 | 每片含 `book_id` + 章节 + 页码 |
| C-4 | 可执行 | 能直接拼入 `reply.try_this` / `next_step` |
| C-5 | 不破坏语义 | 不在句子中间断 |

## 3. 切片粒度

| 类型 | 长度 | 适用 | 示例 |
| --- | --- | --- | --- |
| 概念片 | 30~80 字 | 术语、定义、原理 | 「责任转移是把 A 的责任转嫁给 B」 |
| 步骤片 | 80~150 字 | 操作方法、流程 | 非暴力沟通 4 步 |
| 案例片 | 100~200 字 | 真实场景（脱敏） | 见 `chunks/examples/chunk-001` |
| 警示片 | 30~60 字 | 「不适用 / 风险」 | 「不适用于急性焦虑发作」 |
| 引用片 | ≤ 60 字 | 原书原话（注明页码） | 「被讨厌的勇气 P.42」 |

## 4. 切片方法

### 4.1 三种基本方法
1. **结构化切片**：按章 / 节 / 小节
2. **语义切片**：按主题切换点（用嵌入相似度找拐点）
3. **混合切片**：先结构再语义（默认）

### 4.2 切片流程
```
原文章节 → 结构识别（章/节/小节）→ 语义拐点检测
   → 主题聚合（同主题聚合，过短的合并）
   → 长度校验（30~200 字）
   → 元数据补齐（标签 / 五层 / 风险 / 来源）
   → 同行 1 审
   → 入库
```

### 4.3 切片 prompt
见 `prompts/chunk-extract.md`。

## 5. 切片元数据（必填）

| 字段 | 类型 | 必填 | 约束 |
| --- | --- | --- | --- |
| `chunk_id` | string | Y | `kb-<year>-<NNN>` |
| `book_id` | string | Y | 关联 `books/<cat>.md` |
| `chapter` | string | Y | 章 / 节 |
| `page` | string | N | 页码 |
| `type` | enum | Y | concept / step / case / warning / quote |
| `layer` | enum[] | Y | L1~L5 选若干 |
| `tags` | string[] | Y | 至少 1 个主标签 |
| `scene_tags` | string[] | N | 场景子标签 |
| `applicable` | text | Y | 适用场景 |
| `not_applicable` | text | Y | 不适用场景 |
| `source_quote` | text | N | 原书原话 |
| `risk_notes` | text | Y | 风险提示 |
| `version` | string | Y | `v1` 起 |
| `status` | enum | Y | draft / published / deprecated |
| `created_at` | date | Y | |
| `reviewed_at` | date | N | |
| `reviewed_by` | string | N | KE 缩写 |
| `embedding_id` | string | N | 关联 embeddings/ |

## 6. 切片与案例的关系

- **切片**：通用、自包含、跨案例可复用
- **案例**：具体、有用户原话、有回应脚本
- **一份案例可拆 2~4 个切片**

> 案例 → 切片流程：见 `prompts/case-extract.md`。

## 7. 切片评审（同行 1 审）

| 检查项 | 标准 |
| --- | --- |
| 来源链接 | 100% 有效 |
| 风险标签 | 100% 完整 |
| 长度合规 | 100% 在 30~200 字 |
| 自包含 | 抽查 20%，无理解障碍 |
| 拼入 reply | 抽查 10%，无语气冲突 |
| 边界五层挂靠 | 100% 至少 1 层 |
| 标签覆盖 | 至少 1 主标签 + 1 副标签 |

## 8. 弃用与版本

- 弃用走 `deprecation_reason` 字段
- 已发布切片不可修改，只能新增版本
- 旧版本保留 24 个月供追溯

## 9. 关联文档

| 关联 | 路径 |
| --- | --- |
| 架构总览 | `knowledge/00-Overview.md` §5.1 |
| 书库 | `knowledge/books/` |
| 标签 | `knowledge/tags/` |
| 案例 | `knowledge/cases/` |
| 切片 prompt | `knowledge/prompts/chunk-extract.md` |
| Embedding | `knowledge/embeddings/README.md` |
