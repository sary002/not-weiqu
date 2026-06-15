# tags · 标签体系

> **Owner**：Knowledge Engineer（KE）
> **版本**：v1.0
> **关联**：`knowledge/00-Overview.md` §5.2、`knowledge/chunks/`、`knowledge/cases/`

---

## 1. 使命
为知识切片与案例提供**统一、唯一、可机读**的标签字典，让 RAG 召回与冲突仲裁有据可依。

## 2. 顶层 13 类

```
emotion/*         boundary/*        communication/*   selfworth/*
pua/*             gaslighting/*     workplace/*        family/*
relationship/*    peoplepleasing/*  trauma/*           growth/*
```

> 全部 13 类与 PRD §10、KE 红线对齐。新增类目须 L2 评审。

## 3. 标签规范

| 规则 | 说明 |
| --- | --- |
| 唯一性 | 一级 + 二级必须唯一（同义项合并） |
| 不可变 | 已发布标签不可修改，只能新增版本 |
| 二级深度 | 默认 2 级，深于 2 级需评审 |
| 命名 | 全小写英文 + 下划线；中文标签另存 `tags_zh.md` |
| 数量 | 单条切片 ≥ 1 主标签 + 1 副标签；≤ 5 个 |

## 4. 标签字典（按 13 类）

| 一级 | 二级（示例） | 含义 |
| --- | --- | --- |
| `emotion/*` | `emotion/委屈` `emotion/愤怒` `emotion/内疚` `emotion/焦虑` `emotion/孤独` `emotion/恐惧` `emotion/羞耻` `emotion/疲惫` `emotion/无力` `emotion/感激` | 用户情绪命名 |
| `boundary/*` | `boundary/time` `boundary/space` `boundary/emotional` `boundary/decision` `boundary/financial` `boundary/physical` `boundary/intellectual` | 边界类型 |
| `communication/*` | `communication/非暴力` `communication/关键对话` `communication/倾听` `communication/I-statement` `communication/拒绝` `communication/请求` `communication/反馈` | 沟通技法 |
| `selfworth/*` | `selfworth/自我关怀` `selfworth/自我接纳` `selfworth/自我效能` `selfworth/自我认同` `selfworth/自卑` `selfworth/价值感` | 自我价值维度 |
| `pua/*` | `pua/责任转移` `pua/比较打压` `pua/煤气灯` `pua/打击自信` `pua/制造依赖` `pua/情感操控` | PUA 模式 |
| `gaslighting/*` | `gaslighting/否认` `gaslighting/转移` `gaslighting/颠倒黑白` `gaslighting/让用户怀疑自己` `gaslighting/关系逼问` `gaslighting/版本篡改` | 情绪勒索 / 煤气灯 |
| `workplace/*` | `workplace/加班` `workplace/甩活` `workplace/晋升` `workplace/职场PUA` `workplace/同事边界` `workplace/上下级` `workplace/隐性的比较` | 职场子场景 |
| `family/*` | `family/催婚` `family/经济控制` `family/情感勒索` `family/重男轻女` `family/代际控制` `family/家庭聚会` `family/节假日` | 家庭子场景 |
| `relationship/*` | `relationship/冷暴力` `relationship/嫉妒` `relationship/控制` `relationship/占有` `relationship/冷处理` `relationship/争吵` `relationship/分手` | 亲密关系子场景 |
| `peoplepleasing/*` | `peoplepleasing/取悦` `peoplepleasing/压抑` `peoplepleasing/回避` `peoplepleasing/不敢拒绝` `peoplepleasing/主动让步` `peoplepleasing/自我牺牲` | 讨好模式 |
| `trauma/*` | `trauma/童年忽视` `trauma/原生家庭` `trauma/亲密关系暴力` `trauma/性侵` `trauma/家暴` `trauma/言语暴力` | 创伤类型 |
| `growth/*` | `growth/觉察` `growth/命名` `growth/表达` `growth/巩固` `growth/自我反思` | 成长阶段（与边界五层对齐） |
| （注） | `pua/*` 与 `gaslighting/*` 有部分重叠（pua 偏策略，gaslighting 偏否认现实），但保留双类便于精准召回 | |

## 5. 标签使用规则

### 5.1 主标签（必须有 1）
- 每个切片 / 案例至少有 1 个主标签
- 主标签 = 切片主题的核心类

### 5.2 副标签（1~4 个）
- 副标签 = 关联类目
- 例：`pua/责任转移`（主）+ `workplace/加班`（副）

### 5.3 风险标签（特殊）
- 所有标 `gaslighting/*` 或 `trauma/*` 的切片必须同时标 `risk=med` 或 `high`
- 危机场景下不注入（见 `00-Overview` §5.4.3）

### 5.4 标签版本
- 标签字典 `tags.v1.json` 起
- 任何新增 / 弃用走版本
- 弃用标签保留 24 个月供追溯

## 6. 标签冲突仲裁

| 冲突 | 仲裁 |
| --- | --- |
| `peoplepleasing/取悦` vs `boundary/decision` | 同存，按需取一为主 |
| `pua/责任转移` vs `communication/I-statement` | 同存，pua 为模式，I-statement 为解法 |
| `trauma/*` vs `growth/*` | 同时存在时 growth 优先（除非用户表达创伤） |

## 7. 标签变更流程

```
KE 提请 → KE 同行 1 审 → Q 安全审 → PE 影响评估
   → C 召集评审 → 接受 / 拒绝 → 写入 tags.v<N+1>.json
```

## 8. 关联文档

| 关联 | 路径 |
| --- | --- |
| 架构 | `knowledge/00-Overview.md` §5.2 |
| 切片 | `knowledge/chunks/README.md` |
| 案例 | `knowledge/cases/README.md` |
| 分类 prompt | `knowledge/prompts/tag-classify.md` |
