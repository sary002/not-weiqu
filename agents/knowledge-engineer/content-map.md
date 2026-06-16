# Content Map · 不委屈知识库内容地图

> **Owner**:Knowledge Engineer(KE)+ Prompt Engineer(PE)联合维护
> **Reviewer**:PM、Q、C
> **版本**:v0.1(2026-06-16 初稿)
> **关联**:`agents/knowledge-engineer.md`、`agents/knowledge-engineer/kb/`、`prompts/analyze.md §13`、`docs/research/ahead-boundary-decomposition.md`

---

## 0. 写在最前面

这份 content-map 是**不委屈全部知识块(KB)的总览与索引**,按"边界五层模型"(L1-L5)组织,并标注与不委屈产品的对应关系。

**当前状态(2026-06-16)**:
- L1 觉察:**8 节** ✅ 全部产出
- L2 命名:**6 节** ✅ 全部产出
- L3 表达:**8 节** ✅ 全部产出
- L4 兜底:**5 节** ⏳ 规划中
- L5 巩固:**4 节** ⏳ 规划中
- **合计**:**22/31 节**(完成 71%)

**来源依据**:
- `docs/research/ahead-boundary-decomposition.md` §4 原始内容地图(8+6+8+5+4)
- `agents/knowledge-engineer/kb/` 实际落地的 22 个文件

---

## 1. 边界五层模型 · 完整路线图

| 层 | 含义 | 关键动作 | 当前进度 | 不委屈定位 |
|----|------|---------|---------|----------|
| **L1 觉察** | 看见委屈信号 | 识别身体/情绪反应 | 8/8 ✅ | 入门 / 每日觉察 |
| **L2 命名** | 把情绪与需求说清楚 | 命名恐惧 / 模式 / 自我否定 | 6/6 ✅ | 自我对话深化 |
| **L3 表达** | 在真实场景演练 | 说出拒绝 / 拒绝自我 | 8/8 ✅ | **M2 PoC 重点** |
| **L4 兜底** | 被回绝后自我安抚 | 即时应对 / 被拒绝后安抚 | 0/5 ⏳ | M3+ |
| **L5 巩固** | 把单次胜利变成习惯 | 记录胜利 / 关系改善 | 0/4 ⏳ | M3+ |

> **总体策略**:M2 PoC 仅做 L3-01(拒绝同事甩活)端到端跑通;L1/L2 作为支撑内容逐步上线;L4/L5 等 L3 用户规模验证后再投入。

---

## 2. L1 觉察(8 节)✅

> 设计原则:**每日可做、3-7 分钟、纯觉察不评判**;不引入 streak(避免 J7)。

### 2.1 通用觉察(5 节,无具体场景)

| # | scenario_code | title | duration | risk | 关系 | kb |
|---|---|---|---|---|---|---|
| L1-01 | `recent_said_suanle` | 我最近一次「说算了」是什么时候? | 5 min | low | none | [kb-2026-l1-001](../kb/kb-2026-l1-001-recent-said-suanle.md) |
| L1-02 | `agreed_vs_wanted` | 我答应的 vs 我想做的 | 5 min | low | none | [kb-2026-l1-002](../kb/kb-2026-l1-002-agreed-vs-wanted.md) |
| L1-03 | `laugh_but_think` | 别人笑的时候,我心里在想什么 | 5 min | low | none | [kb-2026-l1-003](../kb/kb-2026-l1-003-laugh-but-think.md) |
| L1-06 | `most_like_me` | 我什么时候最像自己 / 最不像自己 | 7 min | low | self | [kb-2026-l1-006](../kb/kb-2026-l1-006-most-like-me.md) |
| L1-07 | `i_am_fine_behind` | 「我没事」背后是什么 | 5 min | low | self | [kb-2026-l1-007](../kb/kb-2026-l1-007-i-am-fine-behind.md) |

### 2.2 关系觉察(1 节)

| # | scenario_code | title | duration | risk | 关系 | kb |
|---|---|---|---|---|---|---|
| L1-05 | `tiring_circle` | 我的人际圈里,谁让我最累 | 7 min | med | medium | [kb-2026-l1-005](../kb/kb-2026-l1-005-tiring-circle.md) |

### 2.3 每日觉察(2 节,3 分钟极简)

| # | scenario_code | title | duration | risk | 关系 | kb |
|---|---|---|---|---|---|---|
| L1-04 | `daily_dare_not_say` | 我今天有没有「不敢说不」的瞬间 | 3 min | low | none | [kb-2026-l1-004](../kb/kb-2026-l1-004-daily-dare-not-say.md) |
| L1-08 | `daily_self_betray` | 我今天有没有委屈自己成全别人 | 3 min | low | none | [kb-2026-l1-008](../kb/kb-2026-l1-008-daily-self-betray.md) |

### 2.4 L1 关键设计原则

- **不强迫"看清"**:允许"想不起来",允许"今天没有"
- **不评分、不计数**:不引入 streak / hearts / 任何 Duolingo 元素
- **不引导自我批评**:发现"我又在心里答应"后,只镜像,不评判
- **每日觉察可连续 0 几天**:无"中断惩罚"
- **风险红线**:用户提到家暴 / 跟踪等 → 升级 crisis_redirect

---

## 3. L2 命名(6 节)✅

> 设计原则:**把抽象感受翻译成具体词**;不替用户命名,但给候选词让用户挑。

### 3.1 命名恐惧 / 模式(3 节)

| # | scenario_code | title | duration | risk | 关系 | kb |
|---|---|---|---|---|---|---|
| L2-01 | `my_fear_type` | 我的「怕」是什么 — 怕伤关系 / 怕被否定 / 怕冲突 | 7 min | low | none | [kb-2026-l2-001](../kb/kb-2026-l2-001-my-fear.md) |
| L2-02 | `auto_response_pattern` | 我的自动反应是「答应 / 解释 / 道歉」 | 5 min | low | none | [kb-2026-l2-002](../kb/kb-2026-l2-002-auto-response.md) |
| L2-04 | `boundary_vs_kindness` | 我的边界 vs 我的善意 | 5 min | low | none | [kb-2026-l2-004](../kb/kb-2026-l2-004-boundary-vs-kindness.md) |

### 3.2 命名情绪抑制 / 真实需求(3 节)

| # | scenario_code | title | duration | risk | 关系 | kb |
|---|---|---|---|---|---|---|
| L2-03 | `inner_not_good_enough` | 我心里那个「我不够好」的声音 | 7 min | med | self | [kb-2026-l2-003](../kb/kb-2026-l2-003-inner-not-good-enough.md) |
| L2-05 | `i_am_fine_truth` | 「我没事」是真的没事吗 | 5 min | low | self | [kb-2026-l2-005](../kb/kb-2026-l2-005-i-am-fine-truth.md) |
| L2-06 | `suanle_real_need` | 我今天说「算了」,实际想说的是 | 5 min | low | none | [kb-2026-l2-006](../kb/kb-2026-l2-006-suanle-real-need.md) |

### 3.3 L2 关键设计原则

- **翻译而非命名**:把"算了"翻译成"我想说的是",但 AI 不替用户说
- **给候选词**:三选一,允许"都不是"
- **认知重构**只在 L2-04 边界 vs 善意 1 节出现,且必须用具体场景说明,不说教
- **风险红线**:用户出现严重自我否定(如"我不配活着") → 升级 crisis_redirect

---

## 4. L3 表达(8 节)✅ · M2 PoC 重点

> 设计原则:**真实场景演练,12 步完整流程,有示范话术与应对追问**;每个 scenario 是用户的真实生活事件。

### 4.1 职场(2 节)

| # | scenario_code | title | risk | 关系不对称 | kb |
|---|---|---|---|---|---|
| **L3-01** | `refuse_coworker_passoff` | **拒绝同事甩活** | low | medium | **[kb-2026-l3-001](../kb/kb-2026-l3-001-refuse-coworker.md)** ← M2 PoC |
| L3-05 | `boss_weekend_overtime` | 拒绝领导的"周末加个班" | med | **very_high** | [kb-2026-l3-005](../kb/kb-2026-l3-005-boss-weekend.md) |

### 4.2 家庭(2 节)

| # | scenario_code | title | risk | 关系不对称 | kb |
|---|---|---|---|---|---|
| L3-02 | `family_should` | 拒绝家人的"你应该" | low | high | [kb-2026-l3-002](../kb/kb-2026-l3-002-family-should.md) |
| L3-06 | `relatives_marriage_kids` | 拒绝亲戚的"结婚/生娃" | low | medium | [kb-2026-l3-006](../kb/kb-2026-l3-006-relatives-marriage.md) |

### 4.3 亲密关系(2 节)

| # | scenario_code | title | risk | 关系不对称 | kb |
|---|---|---|---|---|---|
| L3-03 | `friend_borrow_money` | 拒绝朋友的"借点钱" | low | medium | [kb-2026-l3-003](../kb/kb-2026-l3-003-friend-borrow.md) |
| L3-04 | `partner_revisit_topic` | 拒绝对象的"再聊聊吧" | med | high | [kb-2026-l3-004](../kb/kb-2026-l3-004-partner-revisit.md) |

### 4.4 入门 / 自我(2 节)

| # | scenario_code | title | risk | 关系不对称 | kb |
|---|---|---|---|---|---|
| L3-07 | `waitstaff_upsell` | 拒绝服务员的"再来一个" | low | very_low | [kb-2026-l3-007](../kb/kb-2026-l3-007-waitstaff-more.md) |
| L3-08 | `inner_critic_silencing` | 拒绝自己内心的"你不行" | med | self | [kb-2026-l3-008](../kb/kb-2026-l3-008-inner-critic.md) |

### 4.5 L3 关键设计原则

- **12 步固定流程**:INTRO → 觉察 → 命名 → 需求 → 意愿 → 开场白 → 说出口 → 应对追问 → 收束 → 心情追踪 → 加剧本 → 收束页面(详见 `plans/m2-poc.md`)
- **3 个示范话术**:短(默认)/ 中(应对追问)/ 柔(用户疲惫),每个 21-27 字
- **以"我"开头**:try_this 第一人称示范,绝对不写"你应该"
- **风险红线**:用户提到家暴 / 跟踪 / 怕被辞退恐惧等 → 升级或 PE + Q 联合评估话术强度
- **多人格适配**:每节都有 温姐 / 智哥 / 松松 三版特色回应

---

## 5. L4 兜底(5 节)⏳ 规划中

> 设计原则:**当表达失败 / 被回绝 / 被追问时,如何自我安抚与即时应对**。

| # | 标题 | 状态 | 优先级 |
|---|------|------|--------|
| L4-01 | 当场说不出拒绝,我能做什么 | 规划中 | M3 |
| L4-02 | 被人拒绝后,如何安抚自己 | 规划中 | M3 |
| L4-03 | 说了却没被听见,如何二次表达 | 规划中 | M3 |
| L4-04 | 对方生气,我该怎么办 | 规划中 | M3 |
| L4-05 | 我让步了,但我难受 | 规划中 | M3 |

### 5.1 L4 关键设计原则(待落地)

- **不评判"让步"是失败**:让步也是选择,允许"我让步了,但下次可以……"
- **承接"被拒绝后的委屈"**:不催"赶紧振作",允许"今天就这样"
- **二次表达的话术**需特别注意:不升级冲突,但保留立场

---

## 6. L5 巩固(4 节)⏳ 规划中

> 设计原则:**把单次胜利沉淀为长期资产**;不庆祝、不比较、只记录。

| # | 标题 | 状态 | 优先级 |
|---|------|------|--------|
| L5-01 | 我做到了 1 次拒绝 — 记录这次胜利 | 规划中 | M3 |
| L5-02 | 我和某人的关系,边界后变好了 | 规划中 | M4 |
| L5-03 | 我今天没有委屈自己 | 规划中 | M3 |
| L5-04 | 我的边界清单 — 我做到了 N 件 | 规划中 | M4 |

### 6.1 L5 关键设计原则(待落地)

- **不庆祝为"人格胜利"**:只说"这次你说了一句",不说"恭喜你终于做到了"
- **不比较**:L5-04 的"我做到了 N 件"只是用户自己的累计,**不显示在公共进度环**
- **数据脱敏**:具体场景标签**不展示在 L5 进度页**,只展示趋势(避免社交暴露)
- **风险红线**:用户因"做不到"产生挫败感 → 切回 L4 兜底,不强迫"必须做到"

---

## 7. 不委屈产品路径与 KB 对应

### 7.1 M2 PoC(当前阶段)

- **唯一微技能**:L3-01 拒绝同事甩活
- **支撑内容**:L1-04 / L1-08(每日觉察)+ L3-01
- **协同 prompt**:analyze.md §13.1 SCENARIO_KB_MAP + reply.md CRIA + coach-not-judging.md
- **安全评审**:Q checklist §3 全部 P0 + P1 通过

### 7.2 M3(规划)

- L3-02 ~ L3-08 全部 7 节 L3 场景
- L2-01 ~ L2-06 全部 6 节 L2 命名
- L4-01 ~ L4-04(L4-05 待评估)
- L5-01 / L5-03

### 7.3 M4+(规划)

- L1-01 ~ L1-08 全部 8 节 L1 觉察作为日常路径
- L5-02 / L5-04 长期巩固
- 知识块 v1.0 季度复核启动

---

## 8. 知识块质量基线(每节必查)

> 每节 KB 在 commit / 上线前,KE + PE + Q 联合自检以下 10 项。

| # | 检查项 | 通过判据 |
|---|--------|---------|
| 1 | **J1-J7 全避免** | `prompts/coach-not-judging.md §2` 7 类负面清单 0 命中 |
| 2 | **P1-P5 全做到** | 共情先行 / 命名 / 示范 / 开放询问 / 允许停下 |
| 3 | **以"我"开头**(L3 必含) | try_this 第一人称示范 |
| 4 | **不评分类元素** | 无分数 / 排名 / 等级数字 |
| 5 | **不催进度** | 无"你今天还没做" / "别忘了" |
| 6 | **不评判对方** | 无"对方太坏" / "你同事真过分" |
| 7 | **风险红线** | 不适用场景 + 升级信号 + 来源白名单齐全 |
| 8 | **多人格适配** | 温姐 / 智哥 / 松松 各 1 段特色回应(L1 简化,L3 完整) |
| 9 | **演练流程** | L3 12 步 / L1-L2 简化 3-5 步 |
| 10 | **变更日志** | §7 audit 与 §8 关联文档完整 |

---

## 9. 来源白名单(KE-R1 严格遵守)

### 9.1 允许引用

- `rules/safety.md` §S-1 ~ §S-8 红线
- `prompts/coach-not-judging.md` 不评判守则
- `docs/research/competitor-research.md` 竞品研究
- `docs/research/ahead-boundary-decomposition.md` 内容拆解
- CBT 通用自助方法(Beck 1979, Ellis 1962 等公开学术版)
- 边界表达研究(Katherine 2015 等公开版)
- `agents/prompt-engineer/persona.md` 3 人格

### 9.2 不允许引用

- ❌ 任何具体疗法主张(如"CBT 暴露疗法第 N 步")
- ❌ 任何未审校的"专家"头衔或机构背书
- ❌ 任何星座 / 玄学 / 伪科学
- ❌ 任何 PUA / 反 PUA 极端话语
- ❌ 任何未经授权的"机构"背书
- ❌ 任何病历 / 处方 / 药物相关

---

## 10. 路线图与下一步

### 10.1 已完成(22 节)

- L1 8 节 ✅(2026-06-16)
- L2 6 节 ✅(2026-06-16)
- L3 8 节 ✅(2026-06-16,KE 团队 7 路并行)

### 10.2 待产出(9 节,M3+ 启动)

| 层 | 节数 | 启动条件 |
|----|------|---------|
| L4 兜底 | 5 | L3 用户量 > 100 + Q 评估兜底话术质量 |
| L5 巩固 | 4 | L4 完成 + PM 评审 L5 数据脱敏方案 |

### 10.3 持续维护

- **季度复核**:每 3 个月,KE + Q 联合复审 KB 的来源、风险标注、与产品的对齐
- **内容退役**:当 12 个月内 KB 没有被任何 prompt 引用 → 标记"待审",再 3 个月 → 退役
- **用户反馈闭环**:Q 收集用户对 KB 的反馈,KE 季度调整

---

## 11. 变更日志

| 版本 | 日期 | 变更 | 作者 |
|------|------|------|------|
| v0.1 | 2026-06-16 | 初稿。22 节 KB 总览(L1 8 + L2 6 + L3 8)+ L4/L5 路线图 + 质量基线 10 项 + 来源白名单 + 路线图与下一步。 | KE + PE + C |

---

## 12. 关联文档

| 关联 | 路径 |
|------|------|
| KE 角色定义 | `agents/knowledge-engineer.md` |
| 原始内容地图(8+6+8+5+4) | `docs/research/ahead-boundary-decomposition.md` §4 |
| 竞品研究 | `docs/research/competitor-research.md` |
| 不评判守则 | `prompts/coach-not-judging.md` |
| 教练人格 3 件套 | `agents/prompt-engineer/persona.md` |
| analyze.md SCENARIO_KB_MAP | `prompts/analyze.md` §13 |
| M2 PoC | `plans/m2-poc.md` |
| Q 安全 checklist | `docs/quality/gamification-safety-checklist.md` |
| 安全规则 | `rules/safety.md` |

---

> **下一步**:
> 1. KE 把本文件 §10.2 的 L4/L5 9 节挂到 `tasks/` 排期
> 2. KE + PE 联合评审 22 节 KB 的内容质量(Q checklist §3 + coach-not-judging.md §10 自检)
> 3. Q 出具 22 节 KB 的红线用例(每节 ≥ 10 条 = 220+ 条)
> 4. PM 评审 §7.1 / §7.2 / §7.3 的产品路径与 KB 对应是否合理
> 5. C 仲裁"知识块退役机制"(§10.3)是否引入 M3+