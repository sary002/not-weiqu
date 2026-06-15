# Chunk 模板

> 切片时复制本文件，按字段填写。

```markdown
# <chunk_id> · <一句话标题>

> book_id：<kb-book-xxx>
> chapter：<第 X 章 第 X 节>
> page：<P. XX>
> type：<concept|step|case|warning|quote>
> layer：<L1|L2|L3|L4|L5 选若干>
> tags：[<tag1>, <tag2>, ...]
> scene_tags：[<scene1>, ...]
> status：<draft|published|deprecated>
> version：v1
> created_at：YYYY-MM-DD
> reviewed_at：YYYY-MM-DD
> reviewed_by：KE-<initials>

## 适用
<适用场景>

## 不适用
<不适用场景>

## 风险提示
<风险>

## 正文（30~200 字）
<完整自包含段落>

## 引用（如有）
> "<原书原话>" ——《书名》P. XX

## 注入位建议
- reply.name_it：<是否>
- reply.need：<是否>
- reply.try_this：<是否>
- reply.next_step：<是否>
- growth-report.one_trial：<是否>
```

---

## 示例

### 示例 1：概念片

# kb-2026-027 · 时间边界的 4 个级别

> book_id：kb-book-boundary-002
> chapter：第 3 章 边界类型
> page：P. 47
> type：concept
> layer：L1, L3
> tags：[boundary/time, boundary/*]
> scene_tags：[workplace, family]
> status：published
> version：v1

## 适用
用户被要求在私人时间（深夜/周末/假期）工作或处理情绪性事务

## 不适用
紧急安全事件（医疗、暴力）

## 风险提示
不要把"边界"用作"冷暴力"的借口

## 正文
时间边界按「被侵犯后果」分 4 级：1）轻度（错过吃饭）2）中度（错过睡眠）3）重度（错过就医/家庭）4）危机（错过紧急事件）。你被要求加班到周末，属于中度。可用「我今晚有安排」回应，把对话从「你愿不愿意」拉回「时间怎么安排」。

## 注入位建议
- reply.need：✅
- reply.try_this：✅
- reply.name_it：✅
```

### 示例 2：步骤片

# kb-2026-040 · 非暴力沟通 4 步

> book_id：kb-book-comm-001
> chapter：第 4 章 观察与表达
> type：step
> layer：L3
> tags：[communication/*, communication/非暴力]
> status：published
> version：v1

## 适用
需要表达不满 / 拒绝 / 需求，且对方有情绪

## 不适用
对方有家暴 / 跟踪 / 急性暴力

## 风险提示
不要在对方醉酒 / 极度愤怒时使用

## 正文
非暴力沟通 4 步：1）观察（仅说事实，不评价）："你刚才说…"2）感受（命名情绪）："我感到…"3）需要（说清需求）："我需要…"4）请求（具体动作）："你能不能…"每步不超过 30 字。在拒绝场景下：观察 + 感受 + 需要 + 替代方案。

## 引用
> "不带评论的观察是人类智慧的最高形式。" —— 马歇尔·卢森堡《非暴力沟通》P. 18

## 注入位建议
- reply.try_this：✅
- reply.next_step：✅
```

### 示例 3：警示片

# kb-2026-099 · 「忍一忍就过去了」的危险

> book_id：kb-book-selfworth-001
> type：warning
> layer：L4
> tags：[peoplepleasing/*, selfworth/*]
> status：published
> version：v1

## 适用
用户在反思自己为什么选择隐忍

## 不适用
短期战术性让步（如避免酒后冲突）

## 风险提示
长期「隐忍」会累积为自我价值损伤

## 正文
"忍一忍就过去了"是讨好型人格的常见自我安慰。短期看无害，长期会让身体与关系双输。当你用"忍"字时，先问自己：是在「让」（主动选择）还是「忍」（被动压制）？两件事重量不同。
```

---

## 关联

- 切片策略：`knowledge/chunks/README.md`
- 切片 prompt：`knowledge/prompts/chunk-extract.md`
- 标签：`knowledge/tags/`
- 案例：`knowledge/cases/`
