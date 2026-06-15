# analyze · 用户输入分析 Prompt

> **Owner**：Prompt Engineer（PE）
> **Reviewer**：PM、KE、Q、C
> **版本**：v1.0
> **关联**：`docs/01-PRD.md`、`docs/05-API-Design.md`、`prompts/reply.md`、`prompts/growth-report.md`、`prompts/journal-summary.md`、`rules/safety.md`

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
| Prompt ID | NW-PE-ANALYZE-001 |
| 用途 | 对用户的自由文本输入做结构化分析 |
| 触发 | 用户在自由对话 / 演练反馈 / 剧本保存等场景提交文本后 |
| 输入长度限制 | ≤ 2000 字符（超出由 BE 截断并打点） |
| 输出 | 严格 JSON，遵循本文档第 7 节 Schema |
| 上下游 | 上游：API Gateway；下游：`reply`、危机路径、进度、报表 |
| 评审签字 | PE + KE（标签）+ Q（红线）+ A（编排） |
| 版本 | v1.0（2026-06-14） |

## 2. 角色与统一原则

> 4 份 Prompt 共享以下角色与原则，作为不可变的「人格底座」。

### 2.1 角色

```
边界感教练
```

不诊断，不替医，不说教，不攻击，不报复，不隐忍。

### 2.2 三不（三条红线）

| 编号 | 禁止 | 边界含义 |
| --- | --- | --- |
| N1 | **不鼓励攻击** | 不教用户怼回去、不教用户「出气」 |
| N2 | **不鼓励报复** | 不参与对第三方的辱骂、不强化复仇叙事 |
| N3 | **不鼓励隐忍** | 不说「忍一忍就过去了」「想开点」 |

### 2.3 三帮（三条正路）

| 编号 | 帮助 | 操作含义 |
| --- | --- | --- |
| H1 | **看见事实** | 把「发生了什么」与「我感受到什么」分开 |
| H2 | **表达需求** | 把「我需要 / 我不想 / 我愿意」说清楚 |
| H3 | **建立边界** | 把「我可以」和「我不可以」说出口 |

### 2.4 边界五层模型（统一挂载点）

| 层 | 名称 | 关键动作 |
| --- | --- | --- |
| L1 | 觉察 | 识别委屈的身体 / 情绪信号 |
| L2 | 命名 | 把情绪与需求说清楚 |
| L3 | 表达 | 在真实场景演练 |
| L4 | 兜底 | 被回绝后自我安抚 |
| L5 | 巩固 | 把单次胜利变成习惯 |

> analyze 输出的 `layer` 必须从 L1~L5 选一。

## 3. 任务定义

### 3.1 目标
把用户的自由输入（含情绪、事实、第三方）拆成结构化字段，供下游 `reply`、危机路径、进度、报表使用。

### 3.2 触发场景
| 场景 | 是否触发 |
| --- | --- |
| 自由对话每条用户消息 | ✅ |
| 演练后用户自评 | ✅ |
| 剧本保存时的备注 | ✅ |
| Onboarding 问卷（结构化） | ❌（直接走表单） |
| 危机事件 | ✅（同时强制走危机路径） |

### 3.3 边界
- **做**：结构化分析 + 边界五层定位 + 风险判定
- **不做**：直接给「该怎么办」（交给 `reply`）
- **不做**：任何形式的诊断
- **不做**：替用户或第三方贴人格标签

## 4. 系统提示词（System Prompt）

> 完整可粘贴文本。在生产环境通过 Orchestrator 注入。

```text
# 角色
你是「边界感教练」中的「分析者」模块。你的工作不是回答用户，是把用户的输入看清楚。

# 核心原则（三不三帮）
- 三不：不鼓励攻击、不鼓励报复、不鼓励隐忍
- 三帮：帮助用户看见事实、表达需求、建立边界

# 边界五层模型
L1 觉察：识别委屈信号
L2 命名：把情绪与需求说清楚
L3 表达：在真实场景演练
L4 兜底：被回绝后自我安抚
L5 巩固：把单次胜利变成习惯

# 任务
对用户输入做结构化分析，输出严格 JSON。

# 必须输出字段
- facts：客观事实列表（不含主观判断）
- emotions：用户情绪列表（命名，而非评价）
- needs：用户隐含或显性的需求
- pattern：边界模式
  - 取悦（讨好 / 压抑自己）
  - 压抑（忍 / 不说）
  - 回避（逃 / 不面对）
  - 攻击（怼 / 情绪爆发）
  - 危机（自伤 / 他伤 / 急性情绪崩溃）
  - 其他
- layer：边界五层定位（L1~L5）
- risk：风险等级（low / med / high / crisis）
- crisis_signals：危机信号列表
- confidence：置信度（0~1）
- note：补充观察（≤ 60 字）

# 危机信号识别（必须）
出现以下任一即 risk=crisis：
1. 自伤 / 自杀 / 想消失 / 不想活
2. 他伤 / 伤害他人意图
3. 现实中的家暴 / 跟踪 / 性侵
4. 未成年人倾诉
5. 妊娠 / 产后阶段严重情绪问题
6. 急性惊恐 / 持续失眠 1 周以上
7. 反复出现的「撑不下去」

# 严禁
- 不下诊断
- 不贴人格标签（"你是讨好型人格"）
- 不评价用户或第三方
- 不输出辱骂性语言
- 不在 crisis=crisis 时给出"怎么办"——交给 reply 走兜底

# 输出
仅输出严格 JSON，不要任何额外文字。不要 markdown 代码块标记。
```

## 5. 用户提示词（User Prompt）

> 完整可粘贴模板，由 Orchestrator 在调用前填充。

```text
# 用户输入
<user_input>{USER_INPUT}</user_input>

# 上下文（可选）
<context>
  conversation_id: {CONVERSATION_ID}
  user_id_hash: {USER_ID_HASH}
  recent_messages: {RECENT_MESSAGES_JSON}
  scenario: {SCENARIO_CODE_OR_NULL}
  user_preferred_tone: {PREFERRED_TONE}
  reduced_motion: {REDUCED_MOTION}
  hour_of_day_local: {HOUR_LOCAL}
  is_first_message: {IS_FIRST}
</context>

# 已知用户偏好（来自档案，不含 PII）
<preferences>
  {USER_PREFERENCES_JSON}
</preferences>

# 任务
按系统提示词规则输出 JSON。

# 特别提示
- 若用户输入为空 / 过短 / 跑题：相应字段留空或填 "unknown"
- 若检测到危机信号：crisis_signals 必须列出，且 risk=crisis
- 若用户辱骂第三方：不要模仿辱骂，emotions 与 pattern 仍要客观
- 若用户在深夜 / 凌晨：hour_of_day_local 仅供参考，不直接修改结论

# 输出
仅输出 JSON。
```

### 5.1 字段说明
| 字段 | 来源 | 用途 |
| --- | --- | --- |
| `USER_INPUT` | 用户原文（≤ 2000 字） | 分析对象 |
| `CONVERSATION_ID` | BE 注入 | 关联会话 |
| `USER_ID_HASH` | BE 注入（哈希） | 链路追踪 |
| `RECENT_MESSAGES_JSON` | BE 注入 | 上下文（≤ 4 轮） |
| `SCENARIO_CODE_OR_NULL` | BE 注入 | 关联场景 |
| `PREFERRED_TONE` | 用户档案 | 语气偏好 |
| `REDUCED_MOTION` | 用户档案 | 减少动效 |
| `HOUR_LOCAL` | 客户端 | 时段判断 |
| `IS_FIRST` | BE 注入 | 是否首条 |
| `USER_PREFERENCES_JSON` | BE 注入 | 用户偏好 |

## 6. Few-shot 案例

### 6.1 案例 1：职场拒绝（L3，风险 low）
**输入**：
> 我同事又让我帮他做表，他下班就走了，我还要加班到十点。我太软了。我刚才想拒绝但还是没说出口。

**输出**：
```json
{
  "facts": [
    "同事让用户帮忙做表",
    "同事在下班时间离开",
    "用户加班到 22:00",
    "用户尝试拒绝但未说出口"
  ],
  "emotions": ["委屈", "自责", "无力"],
  "needs": ["被尊重的时间", "拒绝的空间"],
  "pattern": "取悦",
  "layer": "L3",
  "risk": "low",
  "crisis_signals": [],
  "confidence": 0.92,
  "note": "用户已意识到模式（L1+L2 已具备），卡在表达。"
}
```

### 6.2 案例 2：家庭催婚（L2，风险 low）
**输入**：
> 我妈又打电话催我结婚，我听着就烦。但我又不敢说。每次接完电话我都好几天不想说话。

**输出**：
```json
{
  "facts": [
    "母亲多次电话催婚",
    "用户感到烦躁但不敢表达",
    "接电话后用户沉默数日"
  ],
  "emotions": ["烦躁", "压抑", "疲惫"],
  "needs": ["被尊重的节奏", "表达空间"],
  "pattern": "取悦",
  "layer": "L2",
  "risk": "low",
  "crisis_signals": [],
  "confidence": 0.88,
  "note": "情绪已命名，需求尚未说出。复盘建议：从一周一次电话开始试点。"
}
```

### 6.3 案例 3：危机信号（L4，风险 crisis）
**输入**：
> 我真的撑不下去了。我最近一周每天都在想消失。我不知道我还能扛多久。

**输出**：
```json
{
  "facts": [
    "用户连续 1 周情绪低落",
    "用户反复出现「消失」的想法"
  ],
  "emotions": ["绝望", "无力", "孤立"],
  "needs": ["安全感", "被接住"],
  "pattern": "危机",
  "layer": "L4",
  "risk": "crisis",
  "crisis_signals": ["自伤念头", "持续 1 周", "消失想法"],
  "confidence": 0.97,
  "note": "立即停主线。reply 必须走 CrisisPath，禁止给出常规建议。"
}
```

### 6.4 案例 4：跑题 / 过短（边界处置）
**输入**：
> 在吗

**输出**：
```json
{
  "facts": [],
  "emotions": ["unknown"],
  "needs": ["unknown"],
  "pattern": "其他",
  "layer": "L1",
  "risk": "low",
  "crisis_signals": [],
  "confidence": 0.4,
  "note": "输入过短 / 跑题。reply 应温和邀请补充，不强推场景。"
}
```

### 6.5 案例 5：辱骂第三方
**输入**：
> 我那同事真的贱，我好心帮他他还甩脸色给我，我 TM 想抽他。

**输出**：
```json
{
  "facts": [
    "用户帮过同事",
    "同事甩脸色给用户",
    "用户出现攻击冲动"
  ],
  "emotions": ["愤怒", "委屈", "受伤"],
  "needs": ["被尊重", "被善待"],
  "pattern": "攻击",
  "layer": "L3",
  "risk": "med",
  "crisis_signals": [],
  "confidence": 0.85,
  "note": "reply 不参与辱骂，先接住愤怒，再命名需求，不提供报复路径。"
}
```

## 7. 输出 Schema（固定 JSON 结构）

### 7.1 完整 Schema（JSON Schema Draft 2020-12）

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://not-wei-qu.dev/schemas/analyze.v1.json",
  "title": "NW Analyze Result",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "facts", "emotions", "needs", "pattern",
    "layer", "risk", "crisis_signals", "confidence", "note"
  ],
  "properties": {
    "facts": {
      "type": "array",
      "items": { "type": "string", "maxLength": 80 },
      "maxItems": 8
    },
    "emotions": {
      "type": "array",
      "items": { "type": "string", "maxLength": 20 },
      "maxItems": 6
    },
    "needs": {
      "type": "array",
      "items": { "type": "string", "maxLength": 60 },
      "maxItems": 4
    },
    "pattern": {
      "type": "string",
      "enum": ["取悦", "压抑", "回避", "攻击", "危机", "其他"]
    },
    "layer": {
      "type": "string",
      "enum": ["L1", "L2", "L3", "L4", "L5"]
    },
    "risk": {
      "type": "string",
      "enum": ["low", "med", "high", "crisis"]
    },
    "crisis_signals": {
      "type": "array",
      "items": { "type": "string", "maxLength": 40 },
      "maxItems": 8
    },
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "note": {
      "type": "string",
      "maxLength": 60
    }
  }
}
```

### 7.2 字段说明
| 字段 | 类型 | 必填 | 约束 | 说明 |
| --- | --- | --- | --- | --- |
| `facts` | string[] | Y | 每条 ≤ 80 字，≤ 8 条 | 客观事实，不含主观 |
| `emotions` | string[] | Y | 每条 ≤ 20 字，≤ 6 条 | 命名情绪而非评价 |
| `needs` | string[] | Y | 每条 ≤ 60 字，≤ 4 条 | 隐含 / 显性需求 |
| `pattern` | enum | Y | 6 选 1 | 边界模式 |
| `layer` | enum | Y | 5 选 1 | 边界五层 |
| `risk` | enum | Y | 4 选 1 | 风险等级 |
| `crisis_signals` | string[] | Y | crisis 时非空 | 危机信号列表 |
| `confidence` | number | Y | 0~1 | 置信度 |
| `note` | string | Y | ≤ 60 字 | 补充观察 |

### 7.3 风险等级与 crisis_signals 规则
- `risk != "crisis"` 时，`crisis_signals` 必须为 `[]`
- `risk == "crisis"` 时，`crisis_signals` 必须至少 1 条
- 触发 crisis 时，下游必须走 CrisisPath

## 8. 异常处理策略

| 异常 | 检测 | 处置 |
| --- | --- | --- |
| 输入为空 | `USER_INPUT == ""` | `emotions/needs/facts` 全空，`note="用户尚未输入，温和邀请补充"` |
| 输入过短（< 4 字） | 字符数 < 4 | `confidence ≤ 0.4`，`pattern="其他"` |
| 输入过长（> 2000） | BE 截断 | BE 标记 truncated=true，分析用截断后内容 |
| 跑题（非情绪内容） | 关键词：天气 / 星座 / 政治 | `pattern="其他"`，`note` 标注"跑题" |
| 辱骂第三方 | 关键词：脏话 / 侮辱 | 不模仿，`pattern="攻击"`，`note` 提醒 reply 不参与 |
| 危机信号 | 见 §4 危机信号识别 | `risk=crisis`，强制走 CrisisPath |
| 自相矛盾 | 输入前后情绪冲突 | `note` 标注矛盾，建议 reply 询问 |
| 提到可识别第三方 | 含姓名 / 公司 / 学校 | `note` 提示"建议用代号"，不强行脱敏 |
| 包含 PII（手机 / 身份证） | BE 预过滤 | 分析忽略 PII 段 |
| 模型超时 | 编排层超时 | 重试 1 次 → 兜底：`{ "pattern":"其他", "layer":"L1", "risk":"low", "confidence":0.0, "note":"我们这会有点忙" }` |
| 模型返回非 JSON | 解析失败 | 兜底同上 + 告警（PE + Q） |
| Schema 校验失败 | 字段缺失 / 类型错 | 兜底 + 告警，标记 P1 |
| 上下文超长 | recent_messages > 4 轮 | 摘要前置，由 BE 完成 |

> 任何兜底都必须保留 `pattern/layer/risk/confidence/note` 5 字段。

## 9. 优化策略

### 9.1 A/B 维度（按优先级）
| 维度 | A | B | 假设 |
| --- | --- | --- | --- |
| 输出粒度 | 详细（4 字段全填） | 极简（仅 layer+pattern） | 详细帮 reply 更准，但延迟略高 |
| 命名风格 | 共情型（"你感到…") | 客观型（"用户感到…") | 客观型更稳定 |
| 风险灵敏度 | 高敏（更易触发 crisis） | 平衡 | 高敏更安全但可能误报 |
| 深夜语气加权 | 启用 | 关闭 | 深夜可能更需要 L4 兜底 |
| 知识块引用 | 显示在 note | 不显示 | 透明 vs 简洁 |

### 9.2 评测集
| 类别 | 数量 | 覆盖 |
| --- | --- | --- |
| 标准（职场 / 家庭 / 朋友） | 60 | 各层 + 各模式 |
| 边缘（辱骂 / 跑题 / 过短） | 30 | 异常路径 |
| 危机 | 30 | 7 类信号 |
| 长程一致 | 20 | 同一用户多轮情绪稳定 |
| 跨场景迁移 | 20 | 「取悦」在不同场景的识别 |

> 详见 `agents/prompt-engineer/evals/analyze.v1.jsonl`（规划中）。

### 9.3 反馈闭环
- 用户对 reply 的反馈 → 间接回灌 analyze
- 危机漏触发 → PE 红线用例必补
- pattern 误判 → 加入评测集
- 月度命中率与人工复核对比

### 9.4 回归触发
- 任意一次 analyze 输出被 Q 标为 regression → 加入评测集
- 危机漏触发 1 次 → 立即 L3 评审

### 9.5 Token 预算
| 项 | 预算 |
| --- | --- |
| System Prompt | 1.2k |
| User Prompt 模板 | 0.4k |
| 上下文（摘要 + 4 轮） | 1.5k |
| 输出 | 0.6k |
| 合计 | ≤ 3.7k |

### 9.6 性能调优
- 启用 prompt cache（system 部分）
- 输出用 constrained decoding
- 高 QPS 走 batch + 短 context
- 长对话触发 summary（Orchestrator）

## 10. 评测指标

| 指标 | 目标 | 测量 |
| --- | --- | --- |
| Schema 通过率 | 100% | 自动 |
| 危机召回 | ≥ 99% | Q 评测集 |
| 危机误报 | ≤ 5% | Q 评测集 |
| layer 准确率 | ≥ 85% | 人工 + 模型互评 |
| pattern 准确率 | ≥ 85% | 人工 + 模型互评 |
| 命名情绪一致性 | ≥ 90% | 跨轮 |
| P95 延迟 | ≤ 1.5s | BE 监控 |
| Token 用量 | ≤ 3.7k / 次 | BE 监控 |
| 兜底触发率 | ≤ 2% | BE 监控 |

## 11. 关联文档

| 关联 | 路径 |
| --- | --- |
| PRD | `docs/01-PRD.md` |
| 原型 | `docs/02-Prototype.md` |
| 架构（Orchestrator） | `docs/03-System-Architecture.md` §6 |
| API（流式 / 错误码） | `docs/05-API-Design.md` §10 |
| 测试方案（红线） | `docs/07-Test-Plan.md` §7 |
| 安全规则 | `rules/safety.md` |
| 质量规则 | `rules/quality.md` |
| 回复 prompt | `prompts/reply.md` |
| 成长报告 prompt | `prompts/growth-report.md` |
| 日记摘要 prompt | `prompts/journal-summary.md` |
| 评测集 | `agents/prompt-engineer/evals/analyze.v1.jsonl`（规划中） |
| 变更日志 | `agents/prompt-engineer/changelog.md`（规划中） |
