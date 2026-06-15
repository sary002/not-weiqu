# cases · 案例库

> **Owner**：Knowledge Engineer（KE）
> **Reviewer**：PM、PE、Q、C
> **版本**：v1.0
> **关联**：`knowledge/00-Overview.md` §5.5、`knowledge/tags/`、`knowledge/prompts/case-extract.md`

---

## 1. 使命
为 RAG 召回与 reply 拼装提供**具体、有原话、有三种回应**的真实场景。

## 2. 目录结构

```
cases/
├── README.md
├── workplace/        职场
│   ├── case-001-boss-overtime.md
│   ├── case-002-colleague-shifting-work.md
│   └── case-003-implicit-bias.md
├── family/           家庭
│   ├── case-001-parent-marriage-pressure.md
│   ├── case-002-parent-financial-control.md
│   └── case-003-sibling-burden.md
├── relationship/     亲密关系
│   ├── case-001-partner-cold-violence.md
│   └── case-002-partner-guilt-trip.md
├── friendship/       友谊
│   ├── case-001-friend-borrowing-money.md
│   └── case-002-friend-gossip.md
├── marriage/         婚姻
│   ├── case-001-in-laws-pressure.md
│   └── case-002-divorce-decision.md
└── parenting/        育儿
    ├── case-001-child-rebellion.md
    └── case-002-child-bullying.md
```

## 3. 11 字段模板

> 复制本节，按字段填写。**任何字段缺失 = 不通过审校**。

```markdown
# case-<scene>-<NNN> · <一句话标题>

> case_id：case-<scene>-<NNN>
> 场景：<workplace|family|relationship|friendship|marriage|parenting>
> 子场景：<加班 / 催婚 / 冷暴力 / 借钱 ...>
> 关系：<上下级 / 父母 / 伴侣 / 朋友 / 婆媳 / 父子 ...>
> 紧急度：<低 / 中 / 高>
> 复杂度：<低 / 中 / 高>
> 难度：1~5
> 适用边界五层：<L1~L5 选若干>
> 主标签：[<tag1>, <tag2>]
> 副标签：[<tag1>, <tag2>]
> 状态：<draft|published|deprecated>
> 版本：v1
> 创建：YYYY-MM-DD
> 审校：YYYY-MM-DD · KE-<initials>
> 质量：A / B / C

## 1. 场景
<具体场景描述：人物、情境、关系、时间、地点>
≤ 200 字

## 2. 用户原话
> "<用户原话（脱敏）>"

## 3. 情绪识别
- 主导情绪：<情绪 1>、<情绪 2>
- 次要情绪：<情绪 1>、<情绪 2>
- 身体反应：<如有>

## 4. 问题分类
- 边界侵犯类型：<time / space / emotional / decision / financial / physical / intellectual>
- 操控模式：<取悦 / 压抑 / 攻击 / 责任转移 / 比较打压 / 煤气灯 / 情感勒索>
- 沟通模式：<质问 / 比较 / 让步 / 沉默>

## 5. 越界行为识别
- <越界点 1>
- <越界点 2>
- <越界点 3>

## 6. 心理机制分析
- <机制 1>：<解释>
- <机制 2>：<解释>
- <机制 3>：<解释>
≤ 250 字

## 7. 高情商回应
（不攻击 / 不报复 / 不隐忍，重在关系维护）
> "<完整话术>"

## 8. 边界型回应
（平静表达，重在边界）
> "<完整话术>"

## 9. 强硬回应
（明确拒绝，可能让关系紧张）
> "<完整话术>"

## 10. 后续行动建议
- 短期：<1~7 天>
- 中期：<1~4 周>
- 长期：<1~6 个月>

## 11. 推荐阅读 / 训练
- 阅读：
  - 《<书名>》<章节>
  - 《<书名>》<章节>
- 训练：
  - <具体训练 1>
  - <具体训练 2>
```

## 4. 三种回应的差异

| 类型 | 立场 | 适用 | 风险 |
| --- | --- | --- | --- |
| **高情商回应** | 关系维护优先 | 长期重要关系 | 可能被视为"软" |
| **边界型回应** | 边界优先 | 大多数场景 | 默认推荐 |
| **强硬回应** | 自我保护优先 | 被反复越界 / 高风险 | 可能激化关系 |

> PE 拼装 reply 时，**默认推荐边界型**；用户可点击切换到另外两种。

## 5. 案例分级

| 级别 | 标准 |
| --- | --- |
| **A** | 经典、跨场景、11 字段齐、Q 验收、PE 校准 |
| **B** | 单一场景、11 字段齐 |
| **C** | 初稿、待补 / 待审 |

## 6. 案例与切片的关系

- **案例**：1 个具体场景的完整叙事（含 3 种回应）
- **切片**：从案例抽取的最小可注入单位（不含完整回应）
- **1 案例可拆 2~4 个切片**

## 7. 审校工作流

```
KE 编写 → 同行 1 审（其他 KE 成员）→ Q 红线用例
   → PE 语气校准 → PM 业务签字 → 发布
```

## 8. 案例更新与版本

- 11 字段一旦发布不可改，改必须新增 v2
- 旧版本保留 24 个月

## 9. 关联文档

| 关联 | 路径 |
| --- | --- |
| 架构 | `knowledge/00-Overview.md` §5.5 |
| 标签 | `knowledge/tags/` |
| 切片 | `knowledge/chunks/README.md` |
| 案例 prompt | `knowledge/prompts/case-extract.md` |
| RAG 召回 | `knowledge/embeddings/README.md` |
