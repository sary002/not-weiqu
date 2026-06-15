# 知识库总索引（Knowledge Base Index）

> **Owner**：KE
> **更新**：每个里程碑刷新
> **关联**：`knowledge/00-Overview.md`

---

## 1. 总览

| 目录 | 资产类型 | 数量（v1.0 起步） |
| --- | --- | --- |
| `books/` | 书籍 | 32 本核心 + 候选 |
| `chunks/` | 知识切片 | 起步 3 样本，目标 200+ |
| `tags/` | 标签 | 13 类 + 二级字典 |
| `cases/` | 案例 | 14 样本，目标 100+ |
| `prompts/` | KB 提示词 | 4 套 |
| `embeddings/` | Embedding / RAG | 2 文档 |

## 2. 文件清单

### 2.1 总览
- `00-Overview.md` · 架构总览

### 2.2 books
- `README.md` · 书库结构
- `boundary.md` · 边界感（7 本）
- `communication.md` · 沟通表达（6 本）
- `self-worth.md` · 自我价值（5 本）
- `emotion.md` · 情绪管理（4 本）
- `cognitive.md` · 认知成长（6 本）
- `family.md` · 原生家庭（3 本）
- `women.md` · 女性成长（4 本）
- `relationship.md` · 关系（3 本）

### 2.3 chunks
- `README.md` · 切片策略
- `template.md` · 切片模板
- `examples/chunk-001-boundary-basic.md`
- `examples/chunk-002-nvc-observation.md`
- `examples/chunk-003-pua-identification.md`

### 2.4 tags
- `README.md` · 标签体系
- `emotion.md` `boundary.md` `communication.md` `selfworth.md`
- `pua.md` `gaslighting.md` `workplace.md` `family.md`
- `relationship.md` `peoplepleasing.md` `trauma.md` `growth.md`

### 2.5 cases
- `README.md` · 案例库结构
- `workplace/`：3 个 A 级案例
- `family/`：3 个 A/B 级案例
- `relationship/`：2 个 A 级案例
- `friendship/`：2 个 A/B 级案例
- `marriage/`：2 个 A 级案例
- `parenting/`：2 个 A 级案例

### 2.6 prompts
- `README.md` · KB 提示词总览
- `chunk-extract.md` · 切片提取
- `case-extract.md` · 案例提取
- `tag-classify.md` · 标签分类
- `kb-audit.md` · 季度复核

### 2.7 embeddings
- `README.md` · Embedding 策略
- `index-strategy.md` · 索引与重排

### 2.8 机制
- `UPDATE-MECHANISM.md` · 更新机制
- `VERSION-MANAGEMENT.md` · 版本管理
- `index.md` · 本文件

## 3. 关键 KPI

| 指标 | 目标 |
| --- | --- |
| 切片数量（M2 末） | ≥ 200 |
| 案例数量（M2 末） | ≥ 30 |
| 案例数量（M3 末） | ≥ 100 |
| 标签复用率 | ≥ 80% |
| RAG Recall@5 | ≥ 0.85 |
| 危机漏召 | 0 |
| 季度复核覆盖率 | 100% |

## 4. 关键里程碑

| 节点 | 任务 | 状态 |
| --- | --- | --- |
| M0 | 知识库体系搭建 | ✅ |
| M1 | 切片 50+ / 案例 30+ | 待启动 |
| M2 | 切片 200+ / 案例 60+ | 待启动 |
| M3 | 切片 500+ / 案例 100+ / 季度复核覆盖 | 待启动 |

## 5. 关联文档

| 关联 | 路径 |
| --- | --- |
| 架构总览 | `knowledge/00-Overview.md` |
| 更新机制 | `knowledge/UPDATE-MECHANISM.md` |
| 版本管理 | `knowledge/VERSION-MANAGEMENT.md` |
| PRD | `docs/01-PRD.md` |
| 架构 | `docs/03-System-Architecture.md` §7 |
| 主 Prompt 体系 | `prompts/analyze.md` / `prompts/reply.md` |
| 安全 | `rules/safety.md` |
