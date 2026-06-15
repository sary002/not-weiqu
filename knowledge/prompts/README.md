# prompts · KB 相关提示词

> **Owner**：Knowledge Engineer（KE）
> **版本**：v1.0
> **关联**：`knowledge/00-Overview.md`、`knowledge/chunks/`、`knowledge/cases/`、`knowledge/tags/`

---

## 1. 使命
为 KB 资产的「抽取 / 分类 / 审校」提供统一提示词，确保全部 KB 资产走同一条流水线。

## 2. 提示词清单

| Prompt | 用途 | 路径 |
| --- | --- | --- |
| `chunk-extract` | 从书章节抽取知识切片 | `chunk-extract.md` |
| `case-extract` | 从场景描述抽取案例（含 11 字段） | `case-extract.md` |
| `tag-classify` | 给切片 / 案例打标签 | `tag-classify.md` |
| `kb-audit` | 季度复核 | `kb-audit.md` |

## 3. 与主 Prompt 体系的关系

- KB 提示词是「生产工具」，主 Prompt 体系（`/prompts/*.md`）是「用户接口」
- KB 提示词变更走 L2 评审
- 主 Prompt 引用 KB 时，由 PE 在拼装阶段读 KB 输出

## 4. 质量门

- 提示词与 KB 模板一致
- 输出符合 4 套 Schema（chunk / case / tag / audit）
- 同行 1 审 + Q 红线自检

## 5. 关联文档

| 关联 | 路径 |
| --- | --- |
| 架构 | `knowledge/00-Overview.md` |
| 切片 | `knowledge/chunks/README.md` |
| 案例 | `knowledge/cases/README.md` |
| 标签 | `knowledge/tags/README.md` |
| 主 Prompt | `prompts/analyze.md` / `prompts/reply.md` |
