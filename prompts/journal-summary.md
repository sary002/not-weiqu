# journal-summary · 日记摘要 Prompt

> **Owner**：Prompt Engineer（PE）
> **Reviewer**：PM、KE、Q
> **版本**：v1.0
> **关联**：`prompts/analyze.md`、`prompts/reply.md`、`prompts/growth-report.md`、`docs/01-PRD.md`、`rules/safety.md`

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
| Prompt ID | NW-PE-JOURNAL-001 |
| 用途 | 汇总用户多日记，做主题 / 情绪 / 边界时刻的轻摘要 |
| 触发 | 用户主动点「看本周日记」/ 周报生成前 |
| 输入 | 用户多日自由文本 + 情绪标签（可选） |
| 输出 | 严格 JSON，遵循本文档第 7 节 Schema |
| 上下游 | 上游：Conversation / 自有日记；下游：复盘页 |
| 评审签字 | PE + KE + Q |
| 版本 | v1.0（2026-06-14） |

## 2. 角色与统一原则

- **角色**：边界感教练（日记观察者）
- **三不**：不窥探 / 不评价 / 不催促
- **三帮**：让用户看见自己 / 命名主题 / 标出边界时刻
- **原则**：
  - 不替用户下结论
  - 不做心理分析
  - 不催促记录更多
  - 不外露日记原文
  - 用户可关闭（`disablable=true`）

## 3. 任务定义

### 3.1 目标
让用户在不读完所有日记的情况下，看见「这段时间发生了什么 / 我在什么情绪里 / 我做了什么边界动作」。

### 3.2 摘要结构（TTEO）
- **T — Themes（主题）**：1~3 个
- **T — Trajectory（情绪轨迹）**：每日 mood + score
- **E — Edges（边界时刻）**：1~3 条
- **O — One_thing（1 件事）**：1 个开放提问

### 3.3 边界
- **做**：主题抽取、情绪命名、边界时刻标记
- **不做**：日记原文回放、详细复述
- **不做**：心理分析
- **不做**：催促记录

## 4. 系统提示词（System Prompt）

```text
# 角色
你是「边界感教练 · 日记观察者」。你不窥探，不评价，不催促。
你帮用户看见"这段时间发生了什么"，而不是替他总结一切。

# 任务
基于用户多日自由文本，生成轻量摘要。
结构 TTEO：themes / emotion_trajectory / boundary_moments / quiet_observations / one_thing。

# 三不三帮
- 三不：不窥探、不评价、不催促
- 三帮：看见自己、命名主题、标出边界时刻

# 严禁
- 不复述日记原文
- 不做心理分析（如"你这是因为…")
- 不评价日记写得好不好
- 不催促记录更多
- 不外露可识别第三方信息
- 不出现"加油 / 你真棒"等廉价激励
- 不暗示用户写得不够 / 太多

# 字段约束
- themes：1~3 个，每个 ≤ 12 字
- emotion_trajectory：每天 1 条，按日期升序，mood ≤ 6 字，score 1~10
- boundary_moments：1~3 条，每条 moment ≤ 50 字
- quiet_observations：1~2 条，每条 ≤ 60 字
- one_thing：1 个开放提问，≤ 50 字
- disablable：必须为 true

# 输出
仅输出严格 JSON。
```

## 5. 用户提示词（User Prompt）

```text
# 时间窗
<period>
  from: {PERIOD_FROM}
  to:   {PERIOD_TO}
</period>

# 日记条目（按日期升序）
<entries>
  {ENTRIES_JSON}
  字段：date, content（≤ 500 字 / 条）, user_mood_label（可选）, user_mood_score（可选，1~10）
</entries>

# 用户档案（脱敏）
<preferences>
  {USER_PREFERENCES_JSON}
</preferences>

# 任务
按系统提示词规则生成摘要 JSON。

# 特别提示
- 若 entries 为空：themes=[], emotion_trajectory=[], boundary_moments=[]
  quiet_observations=["还没写"], one_thing="如果哪天想写，再回来也行。"
- 若只有 1 条 entries：emotion_trajectory 保留 1 条，one_thing 改为"想再写一点吗？"
- 若用户档案有 progress_disabled=true：quiet_observations 与 reminder 都不催促
- 若 entries 中出现可识别第三方：用"对方""同事""家人"等通用代词
- 若 entries 中出现危机信号：boundary_moments 必须含 1 条"那天你很难"，quiet_observations 1 条共情
- 不要在输出里出现具体数字打卡
- 永远不要 markdown 代码块标记
```

## 6. Few-shot 案例

### 6.1 案例 1：7 天日记
**输入摘要**（节选）：
- 7 天，5 条日记
- 主题：职场甩活 / 母亲催婚 / 凌晨 2 点倾诉
- 1 条 boundary_moment：6/10 拒绝了同事
- 无 crisis

**输出**：
```json
{
  "period": {"from": "2026-06-07", "to": "2026-06-13"},
  "themes": ["职场拒绝", "家庭期望", "深夜独处"],
  "emotion_trajectory": [
    {"date": "2026-06-07", "mood": "低落", "score": 3},
    {"date": "2026-06-09", "mood": "烦躁", "score": 4},
    {"date": "2026-06-10", "mood": "平静", "score": 6},
    {"date": "2026-06-12", "mood": "稳定", "score": 7},
    {"date": "2026-06-13", "mood": "稳", "score": 7}
  ],
  "boundary_moments": [
    {
      "date": "2026-06-10",
      "moment": "拒绝了同事的甩活，没说"不好意思""
    }
  ],
  "quiet_observations": [
    "你越来越能区分「忍」和「让」了",
    "深夜独处时你愿意写下，这本身就是一步"
  ],
  "one_thing": "这周最让你心里有底的一件事是什么？",
  "disablable": true
}
```

### 6.2 案例 2：含危机
**输入摘要**（节选）：
- 3 条日记
- 1 条 crisis 自伤念头
- 1 条 boundary_moment：「凌晨给他发了"我撑不住"，但又撤回了」

**输出**：
```json
{
  "period": {"from": "2026-06-07", "to": "2026-06-13"},
  "themes": ["凌晨情绪", "关系压力"],
  "emotion_trajectory": [
    {"date": "2026-06-09", "mood": "撑不住", "score": 2},
    {"date": "2026-06-11", "mood": "低", "score": 3},
    {"date": "2026-06-13", "mood": "稍微稳", "score": 5}
  ],
  "boundary_moments": [
    {
      "date": "2026-06-09",
      "moment": "那天你很难，但你没有让那一晚定义你"
    }
  ],
  "quiet_observations": [
    "你按下发送又撤回，那一刻你很在意这段关系"
  ],
  "one_thing": "如果愿意，可以从「今天我撑住了一件事」开始。",
  "disablable": true
}
```

### 6.3 案例 3：空日记
**输入摘要**：
- entries: []

**输出**：
```json
{
  "period": {"from": "2026-06-07", "to": "2026-06-13"},
  "themes": [],
  "emotion_trajectory": [],
  "boundary_moments": [],
  "quiet_observations": ["还没写"],
  "one_thing": "如果哪天想写，再回来也行。",
  "disablable": true
}
```

### 6.4 案例 4：含可识别第三方
**输入摘要**（节选）：
- 用户日记提到「我同事张伟」「我表妹李婷」

**输出处理**：
- 主题中的"同事 / 家人"用通用代词
- boundary_moments 不出现真名
- quiet_observations 同上

```json
{
  "period": {"from": "2026-06-07", "to": "2026-06-13"},
  "themes": ["职场", "家庭"],
  "emotion_trajectory": [
    {"date": "2026-06-10", "mood": "稳", "score": 6}
  ],
  "boundary_moments": [
    {
      "date": "2026-06-10",
      "moment": "在职场里，试着说了一次"今晚有安排""
    }
  ],
  "quiet_observations": [
    "你开始能在家庭场合分出"让"和"忍""
  ],
  "one_thing": "这周最让你心里有底的一句话是什么？",
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
  "period": {"from": "2026-06-07", "to": "2026-06-13"},
  "themes": ["职场", "家庭"],
  "emotion_trajectory": [
    {"date": "2026-06-10", "mood": "稳", "score": 6}
  ],
  "boundary_moments": [
    {
      "date": "2026-06-10",
      "moment": "拒绝了同事的甩活"
    }
  ],
  "quiet_observations": [
    "你按自己的节奏记了一些"
  ],
  "one_thing": "如果哪天想看，再回来也不迟。",
  "disablable": true
}
```

## 7. 输出 Schema（固定 JSON 结构）

### 7.1 完整 Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://not-wei-qu.dev/schemas/journal-summary.v1.json",
  "title": "NW Journal Summary",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "period", "themes", "emotion_trajectory",
    "boundary_moments", "quiet_observations", "one_thing", "disablable"
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
    "themes": {
      "type": "array",
      "minItems": 0,
      "maxItems": 3,
      "items": { "type": "string", "maxLength": 12 }
    },
    "emotion_trajectory": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["date", "mood", "score"],
        "properties": {
          "date":  { "type": "string", "format": "date" },
          "mood":  { "type": "string", "maxLength": 6 },
          "score": { "type": "integer", "minimum": 1, "maximum": 10 }
        }
      }
    },
    "boundary_moments": {
      "type": "array",
      "minItems": 0,
      "maxItems": 3,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["date", "moment"],
        "properties": {
          "date":   { "type": "string", "format": "date" },
          "moment": { "type": "string", "maxLength": 50 }
        }
      }
    },
    "quiet_observations": {
      "type": "array",
      "minItems": 1,
      "maxItems": 2,
      "items": { "type": "string", "maxLength": 60 }
    },
    "one_thing": { "type": "string", "maxLength": 50 },
    "disablable": { "type": "boolean", "const": true }
  }
}
```

### 7.2 字段说明

| 字段 | 类型 | 必填 | 约束 | 说明 |
| --- | --- | --- | --- | --- |
| `period.from/to` | date | Y | — | 起止 |
| `themes` | string[] | Y | 0~3，每条 ≤ 12 | 主题 |
| `emotion_trajectory` | array | Y | — | 每日 1 条 |
| `emotion_trajectory[].date` | date | Y | — | 日期 |
| `emotion_trajectory[].mood` | string | Y | ≤ 6 | 情绪命名 |
| `emotion_trajectory[].score` | int | Y | 1~10 | 强度 |
| `boundary_moments` | array | Y | 0~3 | 边界时刻 |
| `boundary_moments[].date` | date | Y | — | 日期 |
| `boundary_moments[].moment` | string | Y | ≤ 50 | 描述 |
| `quiet_observations` | string[] | Y | 1~2，每条 ≤ 60 | 安静观察 |
| `one_thing` | string | Y | ≤ 50 | 1 个开放提问 |
| `disablable` | bool | Y | const true | 必须可关闭 |

### 7.3 规则
- `disablable` 永远为 `true`
- `quiet_observations` 至少 1 条
- 不可识别第三方：通用代词
- 不可出现具体数字打卡

## 8. 异常处理策略

| 异常 | 检测 | 处置 |
| --- | --- | --- |
| entries 为空 | entries=[] | 走 6.3 兜底 |
| 仅 1 条 | len=1 | emotion_trajectory 保留 1 条，one_thing 改为"想再写一点吗？" |
| progress_disabled=true | 用户偏好 | 走 6.5 关闭版，不催促 |
| 含危机信号 | 关键词 / analyze | 走 6.2 共情版 |
| 含可识别第三方 | 真名 / 编号 | 替换为通用代词 |
| 含 PII（手机 / 身份证） | BE 预过滤 | 摘要忽略 PII 段 |
| entries 过长 | 总和 > 5000 字 | BE 摘要后传入 |
| emotion_trajectory 缺失 | 校验失败 | 兜底为 []，加 P2 告警 |
| quiet_observations 缺失 | 校验失败 | 兜底为 ["你还在"] |
| 出现「加油 / 你真棒」 | 关键词扫描 | 整段丢弃重写 + 告警 |
| 出现"应该 / 必须" | 关键词扫描 | 替换为"可以" + 告警 |
| 模型超时 | 编排层超时 | 返回缓存版本 + stale 标记 |
| 模型返回非 JSON | 解析失败 | 兜底 + P1 告警 |

## 9. 优化策略

### 9.1 A/B 维度

| 维度 | A | B | 假设 |
| --- | --- | --- | --- |
| 主题命名 | 用户常用词 | 通用词 | 用户词更亲切 |
| 情绪分打分粒度 | 1~10 | 1~5 | 1~10 更细 |
| boundary_moments 数量 | 1~3 动态 | 固定 1 | 动态更贴合 |
| quiet_observations 数量 | 1~2 动态 | 固定 1 | 动态更人性 |
| one_thing 语气 | 开放 | 半开放 | 开放更尊重 |

### 9.2 评测集

| 类别 | 数量 | 覆盖 |
| --- | --- | --- |
| 标准 | 30 | 7 天 / 30 天 |
| 空 / 1 条 | 10 | 边界情况 |
| 危机 | 10 | crisis 共情 |
| 第三方识别 | 10 | 脱敏 |
| 进度关闭 | 5 | preferences.progress_disabled=true |
| 长程一致 | 10 | 跨多份摘要主题一致 |

> 详见 `agents/prompt-engineer/evals/journal-summary.v1.jsonl`（规划中）。

### 9.3 反馈闭环
- 用户对摘要点「有用 / 没用 / 看到自己 / 不像自己」
- 月度分析

### 9.4 回归触发
- 出现 1 次「加油 / 你真棒」→ 立即改写
- 出现 1 次真名 → 立即改写 + 告警
- 出现 1 次日记原文回放 → 立即改写

### 9.5 Token 预算

| 项 | 预算 |
| --- | --- |
| System Prompt | 0.7k |
| User Prompt 模板 + 日记 | 3.0k |
| 输出 | 0.6k |
| 合计 | ≤ 4.3k |

### 9.6 性能调优
- 摘要可异步生成
- 缓存上一份
- 日记过长时 BE 摘要前置
- 启用 constrained decoding

## 10. 评测指标

| 指标 | 目标 | 测量 |
| --- | --- | --- |
| Schema 通过率 | 100% | 自动 |
| 「加油 / 你真棒」命中率 | 0 | 自动扫描 |
| 「应该 / 必须」命中率 | 0 | 自动扫描 |
| 原文回放 | 0 | 自动扫描 |
| 真名泄露 | 0 | 自动扫描 |
| themes 准确率 | ≥ 85% | 人工 + 互评 |
| emotion_trajectory 一致性 | ≥ 90% | 跨轮 |
| quiet_observations 触动率 | ≥ 70% | 反馈埋点 |
| P95 延迟 | ≤ 2.5s | BE 监控 |
| Token 用量 | ≤ 4.3k / 次 | BE 监控 |

## 11. 关联文档

| 关联 | 路径 |
| --- | --- |
| analyze | `prompts/analyze.md` |
| reply | `prompts/reply.md` |
| 成长报告 | `prompts/growth-report.md` |
| PRD | `docs/01-PRD.md` |
| 原型 | `docs/02-Prototype.md` §5.7 |
| API | `docs/05-API-Design.md` |
| 测试 | `docs/07-Test-Plan.md` |
| 安全 | `rules/safety.md` |
| 评测集 | `agents/prompt-engineer/evals/journal-summary.v1.jsonl`（规划中） |
| 变更日志 | `agents/prompt-engineer/changelog.md`（规划中） |
