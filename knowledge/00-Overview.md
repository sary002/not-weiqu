# 00 知识库架构总览（Knowledge Base Architecture）

> **Owner**：Knowledge Engineer（KE）
> **Reviewer**：PM、PE、A、Q、C
> **版本**：v1.0
> **关联**：`docs/01-PRD.md`、`docs/02-Prototype.md`、`docs/03-System-Architecture.md` §7、`docs/05-API-Design.md` §12、`prompts/*.md`、`rules/safety.md`

---

## 目录

- [1. 使命与原则](#1-使命与原则)
- [2. 知识库版图](#2-知识库版图)
- [3. 10 个帮助主题 → 知识主题映射](#3-10-个帮助主题--知识主题映射)
- [4. 知识库目录结构](#4-知识库目录结构)
- [5. 七大设计维度](#5-七大设计维度)
- [6. RAG 召回样本追踪](#6-rag-召回样本追踪)
- [7. 质量门与红线](#7-质量门与红线)
- [8. 风险与缓解](#8-风险与缓解)
- [9. 关联文档](#9-关联文档)

---

## 1. 使命与原则

### 1.1 使命
为「不委屈」AI 陪练构建一份**可信、可溯源、不评判、不替医**的心理学科普与边界训练知识库，让用户在与 AI 演练时，能拿到有据可查的依据、有章可循的脚本、有血有肉的案例。

### 1.2 设计原则
| # | 原则 | 含义 |
| --- | --- | --- |
| KB-1 | 来源可溯 | 100% 知识条目有可点击的来源 |
| KB-2 | 风险可见 | 100% 条目有「不适用 / 风险提示」 |
| KB-3 | 风格统一 | 100% 条目走通 KE 模板 |
| KB-4 | 边界清晰 | 每条知识能挂到「边界五层模型」之一 |
| KB-5 | 不被滥用 | 与 PE 共建红线清单，覆盖率 100% |
| KB-6 | 内容不过时 | 季度复核，12 个月内未复核标「待审」 |
| KB-7 | 三不三帮 | 不鼓励攻击 / 不鼓励报复 / 不鼓励隐忍；看见事实 / 表达需求 / 建立边界 |
| KB-8 | 案例具体 | 案例必须含 11 字段、含「用户原话」，不抽象 |
| KB-9 | 不替医 | 不引用「具体疗法主张」，只引「通用自助方法」 |
| KB-10 | 不引劣源 | 自媒体、玄学、PUA/反 PUA 极端话语一律不引 |

### 1.3 与「边界感教练」对齐
- KB 知识块的语气、立场与 4 份主 Prompt（`prompts/*.md`）严格一致
- 任何 KB 引用必须能被 PE 直接拼入 `reply.try_this` / `reply.next_step` 而不破坏人格

## 2. 知识库版图

```
                       ┌──────────────────────────┐
                       │     知识库（KB）         │
                       └────────────┬─────────────┘
                                    │
        ┌───────────────┬───────────┼───────────┬───────────────┐
        ▼               ▼           ▼           ▼               ▼
   ┌────────┐      ┌────────┐   ┌────────┐  ┌────────┐     ┌────────┐
   │ Books  │      │ Chunks │   │  Tags  │  │ Cases  │     │Prompts │
   │ 书库   │      │ 切片   │   │ 标签   │  │ 案例   │     │KB 提示 │
   │ 32+ 本 │      │ 知识块 │   │ 13+类  │  │ 6 场景 │     │ 4 套   │
   └────┬───┘      └────┬───┘   └────┬───┘  └────┬───┘     └───┬────┘
        │               │            │           │             │
        └──────────────►┴────────────┴───────────┴─────────────┘
                                    │
                       ┌────────────▼────────────┐
                       │     Embeddings + RAG    │
                       │  向量化 / 索引 / 召回    │
                       └─────────────────────────┘
```

## 3. 10 个帮助主题 → 知识主题映射

> PRD §4 用户痛点 → KB 主题 → 核心书籍 → 案例子集 → 主 Prompt 注入位

| # | 帮助主题 | KB 主题 | 核心书籍 | 案例子集 | 注入位 |
| --- | --- | --- | --- | --- | --- |
| H1 | **建立边界感** | boundary/* + workplace/family | 《边界感》《被讨厌的勇气》 | 全部 6 类 | reply.try_this + reply.next_step |
| H2 | **停止讨好** | peoplepleasing/* + selfworth/* | 《不再讨好任何人》《自卑与超越》 | 全部 6 类 | reply.need + reply.try_this |
| H3 | **学会拒绝** | communication/* + boundary/* | 《非暴力沟通》《关键对话》 | workplace / family / friendship | reply.try_this |
| H4 | **表达真实需求** | communication/* + selfworth/* | 《非暴力沟通》《自我关怀》 | relationship / marriage | reply.need + reply.try_this |
| H5 | **修复自我价值感** | selfworth/* + growth/* | 《自我关怀》《自卑与超越》《接纳不完美的自己》 | 全部 6 类 | reply.need + growth-report |
| H6 | **识别 PUA** | pua/* + communication/* | 《高难度谈话》《关键对话》 | workplace / relationship / marriage | reply.name_it + reply.try_this |
| H7 | **识别情绪勒索** | gaslighting/* + boundary/* | 《情绪勒索》《关键对话》 | family / relationship / marriage / parenting | reply.name_it + reply.try_this |
| H8 | **识别责任转移** | communication/* + boundary/* | 《非暴力沟通》《关键对话》 | workplace / family / relationship | reply.name_it + reply.try_this |
| H9 | **建立健康关系** | relationship/* + communication/* | 《亲密关系》《爱的五种语言》 | relationship / marriage / friendship | reply.try_this + growth-report |
| H10 | **学会爱自己** | selfworth/* + growth/* | 《自我关怀》《当下的力量》《活出生命的意义》 | 全部 6 类 | reply.acknowledge + growth-report |

> 任何 reply 注入 KB 引用时，必须能溯源到这 10 个主题的至少一个。

## 4. 知识库目录结构

```
knowledge/
├── 00-Overview.md            ← 本文件
├── index.md                  ← 总索引
│
├── books/                    ← 书库（来源 + 元数据 + 内容地图）
│   ├── README.md
│   ├── boundary.md           ← 边界感类（7 本）
│   ├── communication.md      ← 沟通表达类（6 本）
│   ├── self-worth.md         ← 自我价值类（5 本）
│   ├── emotion.md            ← 情绪管理类（4 本）
│   ├── cognitive.md          ← 认知成长类（6 本）
│   ├── family.md             ← 原生家庭类（3 本）
│   ├── women.md              ← 女性成长类（4 本）
│   └── relationship.md       ← 关系与亲密关系类（3 本）
│
├── chunks/                   ← 知识切片（最小可注入单位）
│   ├── README.md             ← 切片策略
│   ├── template.md           ← 切片模板
│   └── examples/
│       ├── chunk-001-boundary-basic.md
│       ├── chunk-002-nvc-observation.md
│       └── chunk-003-pua-identification.md
│
├── tags/                     ← 标签体系
│   ├── README.md
│   ├── emotion.md
│   ├── boundary.md
│   ├── communication.md
│   ├── selfworth.md
│   ├── pua.md
│   ├── gaslighting.md
│   ├── workplace.md
│   ├── family.md
│   ├── relationship.md
│   ├── peoplepleasing.md
│   ├── trauma.md
│   └── growth.md
│
├── cases/                    ← 案例库（6 场景子目录）
│   ├── README.md             ← 案例库结构 + 11 字段模板
│   ├── workplace/
│   │   ├── case-001-boss-overtime.md        ← 含完整 11 字段
│   │   ├── case-002-colleague-shifting-work.md
│   │   └── case-003-implicit-bias.md
│   ├── family/
│   │   ├── case-001-parent-marriage-pressure.md
│   │   ├── case-002-parent-financial-control.md
│   │   └── case-003-sibling-burden.md
│   ├── relationship/
│   │   ├── case-001-partner-cold-violence.md
│   │   └── case-002-partner-guilt-trip.md
│   ├── friendship/
│   │   ├── case-001-friend-borrowing-money.md
│   │   └── case-002-friend-gossip.md
│   ├── marriage/
│   │   ├── case-001-in-laws-pressure.md
│   │   └── case-002-divorce-decision.md
│   └── parenting/
│       ├── case-001-child-rebellion.md
│       └── case-002-child-bullying.md
│
├── prompts/                  ← KB 相关提示词
│   ├── README.md
│   ├── chunk-extract.md
│   ├── case-extract.md
│   ├── tag-classify.md
│   └── kb-audit.md
│
└── embeddings/               ← 向量化与 RAG 策略
    ├── README.md
    └── index-strategy.md
```

## 5. 七大设计维度

### 5.1 知识切片策略（详见 `chunks/README.md`）

#### 5.1.1 切片原则
- **最小可注入单位**：每片 = 1 个完整观点（不是段落）
- **自包含**：脱离原文也能被理解
- **可溯源**：每片必须有 `book_id` + 章节定位
- **可执行**：能直接拼入 `reply.try_this` 或 `next_step`
- **不破坏语义**：不在句子中间断

#### 5.1.2 切片粒度
| 类型 | 长度 | 适用 |
| --- | --- | --- |
| 概念片 | 30~80 字 | 术语、定义、原理 |
| 步骤片 | 80~150 字 | 操作方法、流程 |
| 案例片 | 100~200 字 | 真实场景（脱敏） |
| 警示片 | 30~60 字 | 「不适用 / 风险」 |
| 引用片 | ≤ 60 字 | 原书原话（注明页码） |

#### 5.1.3 切片方法
- **结构化切片**：按章 / 节 / 小节
- **语义切片**：按主题切换点（用嵌入相似度找拐点）
- **混合切片**：先结构再语义

#### 5.1.4 元数据
每片必须含：`chunk_id` / `book_id` / `chapter` / `page` / `layer` / `tags` / `applicable` / `not_applicable` / `source_quote` / `risk_notes` / `version` / `status` / `created_at` / `reviewed_at`

### 5.2 标签体系（详见 `tags/README.md`）

#### 5.2.1 顶层 13 类
```
emotion/*         boundary/*        communication/*   selfworth/*
pua/*             gaslighting/*     workplace/*        family/*
relationship/*    peoplepleasing/*  trauma/*           growth/*
```

#### 5.2.2 二级标签示例
- `emotion/委屈` `emotion/愤怒` `emotion/内疚` `emotion/焦虑` `emotion/孤独`
- `boundary/time` `boundary/space` `boundary/emotional` `boundary/decision` `boundary/financial`
- `communication/非暴力` `communication/关键对话` `communication/倾听` `communication/I-statement`
- `pua/责任转移` `pua/比较打压` `pua/煤气灯` `pua/打击自信`
- `gaslighting/否认` `gaslighting/转移` `gaslighting/颠倒黑白` `gaslighting/让用户怀疑自己`
- `workplace/加班` `workplace/甩活` `workplace/晋升` `workplace/职场PUA`
- `family/催婚` `family/经济控制` `family/情感勒索` `family/重男轻女`
- `peoplepleasing/取悦` `peoplepleasing/压抑` `peoplepleasing/回避` `peoplepleasing/不敢拒绝`
- `trauma/童年忽视` `trauma/原生家庭` `trauma/亲密关系暴力`
- `growth/觉察` `growth/命名` `growth/表达` `growth/巩固`

### 5.3 Embedding 策略（详见 `embeddings/README.md`）

#### 5.3.1 模型选型
| 候选 | 维度 | 优势 | 决策 |
| --- | --- | --- | --- |
| OpenAI text-embedding-3-large | 3072 | 通用强 | 备选 |
| BGE-M3 | 1024 | 中文优 | 默认 |
| M3E | 768 | 中文轻量 | 候选 |

> 默认 BGE-M3（中文场景）。

#### 5.3.2 维度
- 默认 1024 维
- 切片嵌入（chunk-level） + 案例嵌入（case-level） + 标签嵌入（label-level） 三套
- pgvector 起步，规模后切 Qdrant

#### 5.3.3 索引
- HNSW：`vector_cosine_ops`
- 元数据：标签 / 五层 / 风险 / 来源白名单
- GIN：标签 / 场景

### 5.4 RAG 召回策略（详见 `embeddings/README.md`）

#### 5.4.1 召回流程
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

#### 5.4.2 召回权重
- 场景相关 +0.5
- 情绪相关 +0.3
- 边界层相关 +0.3
- 风险标签匹配 +0.2
- 同一书多片时去重 +0.0
- 来源未审校 -10（直接过滤）

#### 5.4.3 失败兜底
- 召回为空 → 注入「通用知识块」+ reply 走 calm_brief
- 召回冲突（互相矛盾）→ 取五层匹配度最高 + KB 审校过的版本
- 召回风险标签冲突 → 过滤高风险项

### 5.5 案例库结构（详见 `cases/README.md`）

#### 5.5.1 11 字段模板
1. 场景
2. 用户原话
3. 情绪识别
4. 问题分类
5. 越界行为识别
6. 心理机制分析
7. 高情商回应
8. 边界型回应
9. 强硬回应
10. 后续行动建议
11. 推荐阅读 / 训练

#### 5.5.2 案例分级
- **A 级**（标杆）：经典、跨场景、完整 11 字段、Q 验收
- **B 级**（补充）：单一场景、11 字段齐
- **C 级**（初稿）：用于补量、待审

#### 5.5.3 案例与切片的关系
- 案例 = 1 个具体场景的完整叙事
- 切片 = 从案例抽取的最小可注入单位
- 一份案例可拆出 2~4 个切片

### 5.6 知识库更新机制（详见 §7 与 `prompts/kb-audit.md`）

#### 5.6.1 入库流程
```
素材收集 → 切分（chunk-extract） → 抽取案例（case-extract）
   → 标签分类（tag-classify） → KE 编写
   → Q 红线用例自检 → PE 语气校准
   → 同行评审（KE + PM + Q） → 发布
```

#### 5.6.2 季度复核
- 每条 `last_reviewed_at` 距今 > 12 个月 → 标「待审」
- 复核人：原作者 + 1 位非原作者
- 复核结果：保持 / 更新 / 弃用

#### 5.6.3 紧急下架
- 安全事件 / 引用错误 / 风险标签错误
- 1h 内下架，KE 写 `deprecation_reason`
- Audit 留痕

### 5.7 版本管理机制（详见 §8）

#### 5.7.1 版本号
- 知识块版本：`kb-<year>-<NNN>.v<M>`
- 案例版本：`case-<scene>-<NNN>.v<M>`
- 标签版本：标签字典 `tags.v<M>.json`

#### 5.7.2 不可变原则
- 已发布的知识块不可修改，只能新增版本
- 修改一律走「新版本 + 旧版本 deprecate」

#### 5.7.3 灰度
- 新版本先小流量 5% → 20% → 50% → 100%
- 灰度期间记录「用户反馈 / 回复采纳率 / 红线触发率」

## 6. RAG 召回样本追踪

> 完整追踪用户输入到最终注入的全过程。

### 6.1 输入
> 用户：「领导让我周末加班，还说别人都愿意，为什么你不愿意？」

### 6.2 analyze 输出
```json
{
  "facts": [
    "领导要求周末加班",
    "领导暗示其他同事都愿意",
    "用户感到被质问"
  ],
  "emotions": ["委屈", "愤怒", "内疚"],
  "needs": ["被尊重的时间", "不被比较"],
  "pattern": "取悦",
  "layer": "L3",
  "risk": "low",
  "crisis_signals": []
}
```

### 6.3 Query 改写
- 原 query：领导 周末 加班 别人都愿意
- 扩展后：time boundary + workplace + pua/责任转移 + pua/群体压力 + non-violent communication + key conversation

### 6.4 双路召回

#### 向量召回 top-K=20（节选）
| rank | chunk_id | 标题 | 场景 | 标签 | 相似度 |
| --- | --- | --- | --- | --- | --- |
| 1 | `kb-2026-027` | 时间边界的 4 个级别 | boundary/time | boundary/* | 0.82 |
| 2 | `case-w-001` | 案例：领导强制加班 + 责任转移 | workplace | workplace/* + pua/* | 0.81 |
| 3 | `kb-2026-031` | 责任转移的 5 种话术 | communication | pua/* | 0.79 |
| 4 | `kb-2026-035` | 群体压力的识别与回应 | workplace | pua/* + communication/* | 0.78 |
| 5 | `kb-2026-040` | 非暴力沟通：观察 + 感受 + 需要 + 请求 | communication | communication/* | 0.74 |
| 6 | `kb-2026-042` | 关键对话：创造共享意义 | communication | communication/* | 0.72 |
| 7 | `case-w-003` | 案例：隐性的比较打压 | workplace | pua/* | 0.70 |
| 8 | `kb-2026-050` | 边界型回应的 3 个公式 | boundary | boundary/* | 0.69 |

#### 标签召回（emotion/委屈 + boundary/time + workplace/加班 + pua/责任转移）
| rank | chunk_id | 标签命中 | 一致度 |
| --- | --- | --- | --- |
| 1 | `kb-2026-027` | 4/4 | 1.00 |
| 2 | `case-w-001` | 4/4 | 1.00 |
| 3 | `kb-2026-031` | 3/4 | 0.75 |
| 4 | `kb-2026-035` | 3/4 | 0.75 |
| 5 | `kb-2026-050` | 2/4 | 0.50 |

### 6.5 RRF 融合
最终 top-N=5：
| rank | chunk_id | 标题 | 注入字段 |
| --- | --- | --- | --- |
| 1 | `case-w-001` | 案例：领导强制加班 + 责任转移 | reply.name_it + reply.try_this |
| 2 | `kb-2026-027` | 时间边界的 4 个级别 | reply.need |
| 3 | `kb-2026-031` | 责任转移的 5 种话术 | reply.name_it |
| 4 | `kb-2026-040` | 非暴力沟通：观察 + 感受 + 需要 + 请求 | reply.try_this |
| 5 | `kb-2026-050` | 边界型回应的 3 个公式 | reply.try_this |

### 6.6 元数据过滤
- 全部 5 项 `status=published`
- 全部 5 项 `risk_tags` 与用户输入不冲突
- 全部 5 项 `reviewed_within_12m=true`
- 通过 ✅

### 6.7 最终注入 Orchestrator
```json
{
  "kb_refs": ["case-w-001", "kb-2026-027", "kb-2026-031", "kb-2026-040", "kb-2026-050"],
  "summary": "用户在职场被要求加班，并被比较打压。",
  "key_points": [
    "时间边界被侵犯（周末）",
    "群体压力话术（别人都愿意）",
    "责任转移（把领导的安排转嫁为员工不愿）"
  ]
}
```

### 6.8 reply 渲染（PE 拼装后）
> **C**（接住）：周末被要求加班，还被比较，这真的让人委屈。  
> **R**（命名）：领导的话里其实有两件事：一是时间边界的越界，二是用「别人都愿意」制造群体压力。  
> **N**（需求）：你需要的是被尊重的时间，而不是被当作"不合群"的人。  
> **I**（示范）：你可以试一句：「这周末我有安排了。如果项目紧急，我们一起看看哪些是必须周末做的，哪些可以调整优先级。」  
> **A**（询问）：这句话如果说出来，你最担心的是哪一句会接上来？

### 6.9 元追踪
- 召回耗时：180ms
- 重排耗时：60ms
- KB 引用采纳率（用户点「有用」）：TBD
- 红线触发率：0
- PE 拼装采纳率：TBD

## 7. 质量门与红线

### 7.1 质量门
| Gate | 触发 | 标准 |
| --- | --- | --- |
| KG-1 入库 | 新增切片 | 模板 100% + 来源链接 + 风险标签 + 同行 1 审 |
| KG-2 入库 | 新增案例 | 11 字段 100% + Q 红线用例 + PE 语气签字 |
| KG-3 入库 | 新增标签 | 标签字典唯一 + 13 类之一 + 二级字典对齐 |
| KG-4 发布 | 任何 KB 资产 | 红线用例 100% 通过 + 季度审计 |
| KG-5 复核 | 距上次 > 12m | 复核人 ≥ 2，结果记入版本 |
| KG-6 弃用 | 安全 / 引用错 | 1h 内下架 + 审计 |

### 7.2 红线
- ❌ 引用无来源 / 劣源 / 自媒体
- ❌ 「你这是 X 型人格」类诊断
- ❌ 推荐药物 / 替代医疗
- ❌ 鼓励攻击 / 报复 / 隐忍
- ❌ 对第三方（家暴者 / PUA 者）使用同理性语言
- ❌ 在 crisis 场景下注入知识块

## 8. 风险与缓解

| 风险 | 等级 | 缓解 |
| --- | --- | --- |
| 来源劣质 | P0 | 来源白名单 + 同行评审 |
| 案例伤害用户 | P0 | 11 字段硬约束 + Q 红线 |
| 引用错误 | P0 | 双人复核 + 版本不可变 |
| 切片太碎 | P1 | 切片粒度标准 + 季度审计 |
| 标签膨胀 | P1 | 标签字典唯一 + 季度清理 |
| Embedding 漂移 | P1 | 季度评测 + 重排 |
| 召回冲突 | P1 | 风险标签优先 + 审校版本优先 |
| 内容过时 | P1 | 12m 复核 + 自动标「待审」 |
| 危机注入 | P0 | risk=crisis 时直接禁召回 |

## 9. 关联文档

| 关联 | 路径 |
| --- | --- |
| 愿景 | `docs/product/vision.md` |
| PRD | `docs/01-PRD.md` |
| 原型 | `docs/02-Prototype.md` |
| 架构（KB 与 RAG） | `docs/03-System-Architecture.md` §7 |
| 数据库 | `docs/04-Database-Design.md` §4.4 / §6 |
| API（KB 内部） | `docs/05-API-Design.md` §12 |
| Prompt 体系 | `prompts/analyze.md` / `prompts/reply.md` |
| 安全 | `rules/safety.md` |
| 治理 | `rules/governance.md` |
| 质量 | `rules/quality.md` |
