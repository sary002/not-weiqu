# 知识库版本管理（Version Management）

> **Owner**：KE
> **Reviewer**：A、PM、Q
> **版本**：v1.0
> **关联**：`knowledge/00-Overview.md` §5.7

---

## 1. 命名规范

| 资产 | 格式 | 示例 |
| --- | --- | --- |
| 切片 | `kb-<year>-<NNN>.v<M>` | `kb-2026-027.v2` |
| 案例 | `case-<scene>-<NNN>.v<M>` | `case-w-001.v2` |
| 书籍 | `kb-book-<cat>-<NNN>.v<M>` | `kb-book-boundary-002.v3` |
| 标签字典 | `tags.v<M>.json` | `tags.v2.json` |
| 切片 prompt | `chunk-extract.v<M>.md` | `chunk-extract.v2.md` |

## 2. 不可变原则

- 已发布的资产**不可修改**，只能新增版本
- 修改一律走「新增 v(N+1) + 旧版 deprecate」
- 旧版保留 24 个月供追溯
- 删除 = 物理删除（仅在合规要求下）

## 3. 变更类型

| 类型 | 含义 | 操作 |
| --- | --- | --- |
| typo 修正 | 错别字 / 标点 | 新版本 + 旧 deprecate |
| 来源更新 | 链接 / 页码修正 | 新版本 + 旧 deprecate |
| 内容修订 | 实质内容改动 | 新版本 + 旧 deprecate + changelog |
| 安全弃用 | 风险 / 引用错 | 立即 deprecate + audit |
| 时效弃用 | 内容过时 | 季度评审 deprecate |

## 4. changelog

每条资产的 `changelog.md`（或数据库字段）：
```markdown
# v2（YYYY-MM-DD）
- 修订人：KE-xxx
- 原因：xxx
- 改动：
  - <具体改动 1>
  - <具体改动 2>
- 影响：reply / 召回
- 灰度比例：1% / 20% / 100%
- 签字：KE + PM + Q
```

## 5. 标签字典版本

- 字典名：`tags.v<N>.json`
- 不可变
- 弃用标签保留 24 个月
- 弃用标签出现在新文档时 → 自动报警

## 6. 灰度与回滚

- 新版本先 1% → 20% → 100%
- 任何阶段红线触发 → 立即回滚到上个稳定版
- 回滚 = `status='deprecated' + deprecation_reason='rollback'`

## 7. 跨版本引用

- 切片引用切片：引 `chunk_id`（不带版本）
- 解析时取该 ID 的最新 published 版本
- 案例引用切片：同上
- reply 注入：取最新 published

## 8. 审计

- 每次发布 / 弃用 / 回滚 → audit 留痕
- 审计字段：操作 / 操作人 / 时间 / 原因 / 影响范围
- 审计保留 ≥ 36 个月

## 9. 关联文档

| 关联 | 路径 |
| --- | --- |
| 架构 | `knowledge/00-Overview.md` §5.7 |
| 更新机制 | `knowledge/UPDATE-MECHANISM.md` |
| 数据库 | `docs/04-Database-Design.md` §4.4 |
