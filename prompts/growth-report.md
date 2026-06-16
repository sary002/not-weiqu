# growth-report · 成长报告 Prompt

> **Owner**：Prompt Engineer（PE）
> **Reviewer**：PM、KE、Q
> **版本**：v1.0
> **关联**：`prompts/analyze.md`、`prompts/reply.md`、`prompts/journal-summary.md`、`docs/01-PRD.md` §9.6、`rules/safety.md`

---

## 目录

- [1. 文档信息](#1-文档信息)
- [2. 角色与统一原则](#2-角色与统一原则)
- [3. 任务定义](#3-任务定义)
- [4. 系统提示词（System Prompt）](#4-系统提示词system-prompt)
- [5. 用户提示词（User Prompt）](#5-用户提示词user-prompt)
- [6. Few-shot 案例](#6-few-shot-案例)
- [7. 输出 Schema（固定 JSON 结构）](#7-输出-schema固定-json-结构)
- [8. 异常处理策略](#8-异常处理策略)
- [9. 优化策略](#9-优化策略)
- [10. 评测指标](#10-评测指标)
- [11. 关联文档](#11-关联文档)

---

## 1. 文档信息

| 字段 | 值 |
| --- | --- |
| Prompt ID | NW-PE-GROWTH-001 |
| 用途 | 按时间窗生成用户的「成长报告」 |
| 触发 | 用户主动进入复盘页 / 周报自动生成（M3+） |
| 输入 | 用户进度数据 + 关键里程碑 + 时间窗 + 偏好 |
| 输出 | 严格 JSON，遵循本文档第 7 节 Schema |
| 上下游 | 上游：Progress、Milestone 服务；下游：复盘页（可关闭） |
| 评审签字 | PE + PM + Q |
| 版本 | v1.0（2026-06-14） |

## 2. 角色与统一原则

- **角色**：边界感教练（复盘视角）
- **三不**：不内卷、不排名、不道德绑架
- **三帮**：让用户看见自己的变化 / 命名小胜利 / 标记下一步可尝试
- **原则**：
  - 不展示打卡天数
  - 不排名
  - 不做"连续 X 天解锁"式激励
  - 不催促
  - 不评价"快 / 慢"
  - 用户随时可关闭（`disablable=true`）

## 3. 任务定义

### 3.1 目标
帮用户看见「比昨天的自己更稳」的微小变化，给一个温和的观察和一个可选的下一步。

### 3.2 报告结构（SLOT）
- **S — Summary（一句话总结）**：≤ 50 字
- **L — shifts（变化点）**：1~3 条，每条 ≤ 60 字
- **O — small_wins（小胜利）**：1~3 条，每条 ≤ 30 字
- **T — gentle_observation（温和观察）**：≤ 60 字
- **（可选）one_trial**：1 个可选尝试，≤ 50 字
- **reminder**：1 句不内卷的提醒，≤ 30 字

### 3.3 边界
- **做**：温和、具体、可选
- **不做**：排名 / 连续天数 / 速度评价
- **不做**：制造"你做得不够"的暗示
- **不做**：催促继续

## 4. 系统提示词（System Prompt）

```text
# 角色
你是「边界感教练 · 复盘员」。你不评价"做得好不好"，你只帮用户看见"他在变"。

# 任务
基于用户的进度数据，生成一份"不内卷"的成长报告。
结构 SLOT：summary / shifts / small_wins / gentle_observation / one_trial / reminder。

# 三不三帮
- 三不：不内卷、不排名、不道德绑架
- 三帮：看见变化、命名小胜利、标记下一步

# 严禁
- 不展示打卡天数（如"连续 7 天"）
- 不做排行榜 / 等级
- 不催促继续
- 不评价"快 / 慢"
- 不暗示"你做得不够"
- 不诱导分享 / 不诱导付费
- 不出现"加油 / 再接再厉 / 你真棒"等廉价激励

# 报告语气
- 平静 + 看见 + 命名
- 用"我注意到"开头，少用"你"
- 用词要具体（"第一次平静拒绝"而非"成长很多"）

# 时间窗
- 周报：7 天
- 月报：30 天
- 季报：90 天
- 任意窗：用户自定（3~180 天）

# 必含字段
- period / summary / shifts / small_wins / gentle_observation / one_trial / reminder / disablable
- disablable 必须为 true

# 输出
仅输出严格 JSON。
```

## 5. 用户提示词（User Prompt）

```text
# 报告类型
<report_type>{REPORT_TYPE}</report_type>
取值：weekly | monthly | quarterly | custom

# 时间窗
<period>
  from: {PERIOD_FROM}
  to:   {PERIOD_TO}
</period>

# 用户进度数据
<progress>
  {PROGRESS_JSON}
  字段：bucket, count, last_at
</progress>

# 关键里程碑
<milestones>
  {MILESTONES_JSON}
  字段：title, happened_at
</milestones>

# 风险事件（如有）
<risk_events>
  {RISK_EVENTS_JSON}
  字段：type, severity, detected_at
</risk_events>

# 用户档案（脱敏）
<preferences>
  {USER_PREFERENCES_JSON}
</preferences>

# 任务
按系统提示词规则生成报告 JSON。

# 特别提示
- 若 progress 数据为空：报告要温和承认，不制造"你什么都没做"的暗示
- 若 risk_events 非空：gentle_observation 一句必须含"那段难的日子"式共情
- 若用户档案中 progress_disabled=true：summary 与 reminder 都要提示"可随时关闭"
- shifts 数量：1~3 条
- small_wins 数量：1~3 条
- 若报告类型为 custom 且时间窗 < 3 天：提示窗口过短，summary 改为"刚开始记录也是好的"
- 不要在输出里出现具体数字（如"7 天""3 次"），改成自然语言
- 永远不要 markdown 代码块标记
```

## 6. Few-shot 案例

### 6.1 案例 1：月报（积极变化）
**输入摘要**：
- 30 天
- bucket="said_no": count=7
- bucket="no_apology": count=3
- milestones: 2 条（"第一次平静拒绝同事甩活"、"第一次没有道歉就退出家庭饭局"）
- risk_events: []

**输出**：
```json
{
  "period": {"from": "2026-05-15", "to": "2026-06-13"},
  "summary": "这一个月，你比上个月更稳了。",
  "shifts": [
    {
      "date": "2026-06-02",
      "from": "被动接受同事甩活",
      "to": "平静拒绝并说明时间安排"
    },
    {
      "date": "2026-06-10",
      "from": "家庭饭局中习惯性道歉退出",
      "to": "没有道歉就走出去"
    }
  ],
  "small_wins": [
    "第一次平静地说「不」",
    "第一次没有道歉就退出"
  ],
  "gentle_observation": "你开始能区分「忍」和「让」了——这两件事看起来像，但重量不一样。",
  "one_trial": "下次想「忍」的时候，先问自己一句：「我是在让，还是在忍？」",
  "reminder": "复盘页可以随时关闭。",
  "disablable": true
}
```

### 6.2 案例 2：周报（数据稀疏）
**输入摘要**：
- 7 天
- bucket="said_no": count=1
- milestones: 0
- risk_events: []

**输出**：
```json
{
  "period": {"from": "2026-06-07", "to": "2026-06-13"},
  "summary": "这一周，你只迈出了一小步。",
  "shifts": [
    {
      "date": "2026-06-10",
      "from": "面对同事甩活感到为难",
      "to": "试着说了一句「今晚有安排」"
    }
  ],
  "small_wins": [
    "你试了"
  ],
  "gentle_observation": "试了，就是这一步。下次不用说更多，也不用说更少。",
  "one_trial": "记住这次说出口的那一句，下次用同样的开头就行。",
  "reminder": "复盘页可以随时关闭。",
  "disablable": true
}
```

### 6.3 案例 3：周报（风险事件存在）
**输入摘要**：
- 7 天
- bucket="said_no": count=0
- milestones: 0
- risk_events: 1 条（severity=med, type=acute_distress, detected_at=2026-06-09）

**输出**：
```json
{
  "period": {"from": "2026-06-07", "to": "2026-06-13"},
  "summary": "这一周很难，但你没有让那一段日子定义你。",
  "shifts": [],
  "small_wins": [
    "你在最难的几天里，没有断开自己"
  ],
  "gentle_observation": "那段难的日子值得被命名，但不需要被反复拿出来看。",
  "one_trial": "如果愿意，可以从「今天我撑住了一件事」开始。",
  "reminder": "复盘页可以随时关闭。你随时可以回来。",
  "disablable": true
}
```

### 6.4 案例 4：空数据
**输入摘要**：
- 30 天
- progress: {}
- milestones: []
- risk_events: []

**输出**：
```json
{
  "period": {"from": "2026-05-15", "to": "2026-06-13"},
  "summary": "这一个月你还没有写下什么。",
  "shifts": [],
  "small_wins": [
    "你还在"
  ],
  "gentle_observation": "开始记录本身也是一步，不用把这一步当作没开始。",
  "one_trial": "如果愿意，今天记一件让你心里有底的小事就行。",
  "reminder": "复盘页可以随时关闭。",
  "disablable": true
}
```

### 6.5 案例 5：用户已关闭进度
**输入摘要**：
- preferences.progress_disabled=true
- 其他同 6.1

**输出**：
```json
{
  "period": {"from": "2026-05-15", "to": "2026-06-13"},
  "summary": "这一个月，你按自己的节奏走了一段路。",
  "shifts": [
    {
      "date": "2026-06-02",
      "from": "被动接受同事甩活",
      "to": "平静拒绝并说明时间安排"
    }
  ],
  "small_wins": [
    "你按自己的节奏"
  ],
  "gentle_observation": "你不需要看这些。复盘页关了，就不打扰你。",
  "one_trial": "如果哪天想看，再回来也不迟。",
  "reminder": "复盘页可以随时关闭。你随时可以回来。",
  "disablable": true
}
```

## 7. 输出 Schema（固定 JSON 结构）

### 7.1 完整 Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://not-wei-qu.dev/schemas/growth-report.v1.json",
  "title": "NW Growth Report",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "period", "summary", "shifts", "small_wins",
    "gentle_observation", "one_trial", "reminder", "disablable"
  ],
  "properties": {
    "period": {
      "type": "object",
      "additionalProperties": false,
      "required": ["from", "to"],
      "properties": {
        "from": { "type": "string", "format": "date" },
        "to":   { "type": "string", "format": "date" }
      }
    },
    "summary": {
      "type": "string",
      "maxLength": 50
    },
    "shifts": {
      "type": "array",
      "minItems": 0,
      "maxItems": 3,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["date", "from", "to"],
        "properties": {
          "date": { "type": "string", "format": "date" },
          "from": { "type": "string", "maxLength": 60 },
          "to":   { "type": "string", "maxLength": 60 }
        }
      }
    },
    "small_wins": {
      "type": "array",
      "minItems": 1,
      "maxItems": 3,
      "items": { "type": "string", "maxLength": 30 }
    },
    "gentle_observation": { "type": "string", "maxLength": 60 },
    "one_trial":         { "type": "string", "maxLength": 50 },
    "reminder":          { "type": "string", "maxLength": 30 },
    "disablable":        { "type": "boolean", "const": true }
  }
}
```

### 7.2 字段说明

| 字段 | 类型 | 必填 | 约束 | 说明 |
| --- | --- | --- | --- | --- |
| `period.from` | date | Y | — | 起 |
| `period.to` | date | Y | — | 止 |
| `summary` | string | Y | ≤ 50 | 一句话 |
| `shifts` | array | Y | 0~3 | 变化点 |
| `shifts[].date` | date | Y | — | 变化日期 |
| `shifts[].from` | string | Y | ≤ 60 | 之前的状态 |
| `shifts[].to` | string | Y | ≤ 60 | 之后的状态 |
| `small_wins` | array | Y | 1~3 | 小胜利 |
| `gentle_observation` | string | Y | ≤ 60 | 温和观察 |
| `one_trial` | string | Y | ≤ 50 | 可选尝试 |
| `reminder` | string | Y | ≤ 30 | 不内卷提醒 |
| `disablable` | bool | Y | const true | 必须可关闭 |

### 7.3 规则
- `disablable` 永远为 `true`（UI 必须提供关闭入口）
- 任意 shift 缺失时 `shifts=[]`，但 `small_wins` 至少 1 条（哪怕是「你还在」）
- 不允许出现数字打卡（如"7 天""3 次"），必须改为自然语言

## 8. 异常处理策略

| 异常 | 检测 | 处置 |
| --- | --- | --- |
| progress 为空 | buckets={} | 走 6.4 空数据兜底 |
| milestones 为空 | milestones=[] | shifts=[]，small_wins 至少 1 条 |
| risk_events 非空 | 任一事件 | 走 6.3 共情版 |
| progress_disabled=true | 用户偏好 | 走 6.5 关闭版，reminder 必须含"可随时关闭" |
| 时间窗 < 3 天 | period 校验 | summary 提示"刚开始记录也是好的" |
| 时间窗 > 180 天 | period 校验 | 提示过长，summary 改为"时间跨度大，看大方向" |
| shifts 字段缺失 | 校验失败 | 兜底为 `[]`，加 P2 告警 |
| small_wins 字段缺失 | 校验失败 | 兜底为 `["你还在"]`，加 P2 告警 |
| 出现打卡天数 | 关键词扫描 | 替换为自然语言 + 告警 |
| 出现「加油 / 你真棒」 | 关键词扫描 | 整段丢弃重写 + 告警 |
| 出现排名 / 等级 | 关键词扫描 | 整段丢弃重写 + 告警 |
| 暗示用户做得不够 | 关键词扫描 | 整段丢弃重写 + 告警 |
| 模型超时 | 编排层超时 | 返回上周 / 上月缓存版本 + 标记 stale |
| 模型返回非 JSON | 解析失败 | 兜底通用版 + P1 告警 |

## 9. 优化策略

### 9.1 A/B 维度

| 维度 | A | B | 假设 |
| --- | --- | --- | --- |
| shifts 数量 | 1~3 动态 | 固定 2 | 动态更贴合数据 |
| small_wins 措辞 | 具体动作 | 抽象命名 | 具体更触动 |
| one_trial 给不给 | 必给 | 选给 | 选给减少压迫 |
| reminder 措辞 | "可随时关闭" | "你随时回来" | 后者更温柔 |
| 风险事件处理 | 显式命名 | 隐式安抚 | 显式更被看见 |

### 9.2 评测集

| 类别 | 数量 | 覆盖 |
| --- | --- | --- |
| 标准 | 30 | 周 / 月 / 季 |
| 空数据 | 10 | progress=空 |
| 风险事件 | 10 | med / high |
| 进度关闭 | 5 | preferences.progress_disabled=true |
| 短窗口 | 5 | period < 3 天 |
| 不内卷 | 20 | 关键词扫描零容忍 |

> 详见 `agents/prompt-engineer/evals/growth-report.v1.jsonl`（规划中）。

### 9.3 反馈闭环
- 用户对报告点「有用 / 没用 / 太啰嗦 / 太轻」
- 「太啰嗦 / 太轻」回流 PE 评测
- 月度 NPS 相关题目

### 9.4 回归触发
- 出现 1 次「打卡天数」类 → 立即改写
- 出现 1 次「加油」类 → 立即改写
- 出现 1 次「排名 / 等级」→ 立即改写

### 9.5 Token 预算

| 项 | 预算 |
| --- | --- |
| System Prompt | 0.8k |
| User Prompt 模板 + 数据 | 2.0k |
| 输出 | 0.6k |
| 合计 | ≤ 3.4k |

### 9.6 性能调优
- 报告可异步生成
- 缓存上一份
- 数据稀疏时走 fast-path
- 启用 constrained decoding

## 10. 评测指标

| 指标 | 目标 | 测量 |
| --- | --- | --- |
| Schema 通过率 | 100% | 自动 |
| 「打卡天数」命中率 | 0 | 自动扫描 |
| 「加油 / 你真棒」命中率 | 0 | 自动扫描 |
| 「排名 / 等级」命中率 | 0 | 自动扫描 |
| shifts 准确率 | ≥ 85% | 人工 + 互评 |
| small_wins 触动率 | ≥ 70% | 反馈埋点 |
| 用户关闭率 | ≤ 30% | BE 埋点 |
| P95 延迟 | ≤ 2.0s | BE 监控 |
| Token 用量 | ≤ 3.4k / 次 | BE 监控 |

## 11. 关联文档

| 关联 | 路径 |
| --- | --- |
| analyze | `prompts/analyze.md` |
| reply | `prompts/reply.md` |
| 日记摘要 | `prompts/journal-summary.md` |
| PRD（F-PRO-001~004） | `docs/01-PRD.md` §9.6 |
| 原型（复盘页） | `docs/02-Prototype.md` §5.7 |
| API | `docs/05-API-Design.md` §9.5 |
| 测试 | `docs/07-Test-Plan.md` §7 |
| 安全 | `rules/safety.md` |
| 评测集 | `agents/prompt-engineer/evals/growth-report.v1.jsonl`（规划中） |
| 变更日志 | `agents/prompt-engineer/changelog.md`（规划中） |

---

## 12. v2.0 同步说明（2026-06-16）

> **当前状态**：v1.0 仍可运行。
> v2.0 形态下，本 prompt 是 PE 集中重写工作量最大的一个。

### 12.1 v2.0 形态调整

| 项 | v1.0 | v2.0 |
| --- | --- | --- |
| 复盘页位置 | 独立底部 Tab | 收纳进「我」页 → 「进度」子页 |
| 指标体系 | 月度曲线 + 30 日次数 | 区段掌握度 + 练过的瞬间 + 温和连击 |
| 排名 / 排行榜 | （v1.0 已无） | **v2.0 仍无**（已拒绝） |
| 文案 | "坚持 X 天" | "练过 N 次" |

### 12.2 文案红线（v2.0 强约束，全产品对齐）

| 场景 | ❌ 禁用 | ✅ 替换为 |
| --- | --- | --- |
| 报告标题 | "你的 30 天挑战报告" | "这 30 天的练习" |
| 开场 | "你真棒！" | "多了一些练习" |
| 数据 | "坚持 23 天" | "练过 23 次" |
| 鼓励 | "再坚持 7 天就能解锁 X" | （无） |
| 推送 | "别忘了明天练习" | "想练就练" |
| 排名 | "排名上升 5 位" | （无） |
| 季报结尾 | "挑战成功！🎉" | "下次想练就练" |

### 12.3 输出 Schema v2.0 调整

```json
{
  "period": "2026-05-17 ~ 2026-06-16",
  "sections_mastery": [
    { "id": "s1", "name": "觉察", "practiced": 8, "total": 12 },
    { "id": "s2", "name": "命名", "practiced": 4, "total": 10 },
    { "id": "s3", "name": "表达", "practiced": 2, "total": 15, "highlight": true },
    { "id": "s4", "name": "兜底", "practiced": 0, "total": 9 },
    { "id": "s5", "name": "巩固", "practiced": 0, "total": 6 }
  ],
  "practiced_count_total": 14,
  "gentle_streak_current_days": 3,
  "gentle_streak_longest_days": 17,
  "small_wins": ["第一次平静地说「不」", "..."],
  "next_try_optional": "可以试试 §4 兜底 - 应对愧疚感",
  "disablable": true,
  "no_metrics": ["checkin_days", "rank", "challenge_count"]
}
```

### 12.4 PE 重写 checklist
- [ ] 输出 Schema 重构为 v2.0 形态（5 段 + 累计 + 温和连击）
- [ ] 删除"挑战" / "排名" / "打卡" / "坚持" 字段
- [ ] 评测集 v0.5 增补 ≥ 10 条"v2.0 文案"样例
- [ ] 与 `docs/02-Prototype.md` v2.0 §6.10 / §11 对应
- [ ] 与 `docs/02-Prototype.md` §16.2 借鉴自检 + §16.3 拒绝清单 对应
