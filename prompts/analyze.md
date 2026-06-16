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
| `SCENARIO_CODE_OR_NULL` | BE 注入 | 关联场景(可选);枚举见 §13 SCENARIO_KB_MAP |
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
| **KB 场景分析(基于 22 节 KB)** | **220** | **L1 8 + L2 6 + L3 8,每节 10 条,见 `analyze-kb-scenarios.v1.jsonl`** |

> 详见 `agents/prompt-engineer/evals/analyze.v1.jsonl`(规划中)与 **`agents/prompt-engineer/evals/analyze-kb-scenarios.v1.jsonl`(2026-06-17 已产出,220 条)**。评测集 README 与 schema 见 `agents/prompt-engineer/evals/README.md`。

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
| **PE 守则 / 人格 / few-shot** | `prompts/coach-not-judging.md` / `agents/prompt-engineer/persona.md` / `prompts/persona-fewshots.md` |
| 成长报告 prompt | `prompts/growth-report.md` |
| 日记摘要 prompt | `prompts/journal-summary.md` |
| **L3 场景知识块**(8 节) | `agents/knowledge-engineer/kb/kb-2026-l3-*.md`(见 §13) |
| **L1 觉察知识块**(8 节,规划中) | `agents/knowledge-engineer/kb/kb-2026-l1-*.md` |
| **L2 命名知识块**(6 节,规划中) | `agents/knowledge-engineer/kb/kb-2026-l2-*.md` |
| Q 安全 checklist | `docs/quality/gamification-safety-checklist.md` |
| KE 内容地图 | `docs/research/ahead-boundary-decomposition.md` |
| 竞品研究 | `docs/research/competitor-research.md` |
| 评测集 | `agents/prompt-engineer/evals/analyze.v1.jsonl`(规划中) |
| 变更日志 | `agents/prompt-engineer/changelog.md`(规划中) |

---

## 12. v2.0 同步说明（2026-06-16）

> **当前状态**：v1.0 仍可运行（M1-08 已验证 30s 真实响应 + C/R/I/A 输出 + 危机 100% 触发）。
> v2.0 形态下，本 prompt 需要 PE 在 M1-09 / T-09-06 集中重写。
> 本节是 PE 的"重写工单"。

### 12.1 v1.0 → v2.0 形态对比

| 项 | v1.0 | v2.0 |
| --- | --- | --- |
| 触发场景 | 自由对话 | **自由对话（保留）+ 12 步演练每步** |
| 输入粒度 | 完整自由文本 | 步骤 2-12 每次 1 个结构化字段（情绪 / 需求 / 边界 / 开场 / ...） |
| 任务 | 1 份 C/R/I/A | **12 份子 prompt**，每步 1 个任务 |
| 输出 Schema | 1 个 JSON | 12 个不同子 Schema |

### 12.2 v2.0 12 步每步的子任务（PE 重写时按此拆）

| 步骤 | 输入 | 任务 | 输出 Schema |
| --- | --- | --- | --- |
| 1 INTRO | 节点 ID | 拉场景卡 | 场景卡文本 + 元数据 |
| 2 觉察 | 6 选 1 | 命名身体感觉 | 确认 + 命名小句子 |
| 3 命名 | 1 词 | 命名情绪 | 确认 + 共情短句 |
| 4 需求 | 自由输入 | 提取"我想要 ___" | 抽取 + 复述 |
| 5 边界 | 自由输入 | 区分"愿意 / 不愿意" | 抽取 + 复述 |
| 6 开场 | 节点 ID | **给 2-3 个开场白（PE + KE 签字）** | 数组 |
| 7 演练 | 用户说出口的话 | AI 扮对方反驳 | 1 句对方反驳 |
| 8 应对 | 对方反驳 | **给 2-3 个应对（PE + KE 签字）** | 数组 |
| 9 收束 | 演练过程 | **给 1 句平静话术（≤ 30 字）** | 1 句 |
| 10 演练后 | 无 | 引导读完确认 | 引导句 |
| 11 保存 | 用户决定 | 引导保存到我的剧本 | 引导句 |
| 12 OUTRO | 演练结果 | 1 行温和复盘 | 1 行 |

### 12.3 红线（v2.0 强约束，与 v1.0 共用）
- 不诊断 / 不替医
- 不羞辱用户或第三方
- 不在 crisis 走主线（必须走 CrisisPath）
- **新增**：步骤 7 / 8 的开场白 / 应对**不能 AI 自由生成**，必须 PE + KE 联合签字
- **新增**：步骤 9 收束话术 ≤ 30 字

### 12.4 PE 重写 checklist
- [ ] 12 份子 prompt 的 system / user / few-shot / schema 各 12 套
- [ ] 步骤 6 / 8 的开场白 / 应对选项准备 ≥ 3 套 / 微技能
- [ ] 评测集 v0.5（每步 ≥ 10 条样例）
- [ ] 红线用例 100% 覆盖（含 12 步中的"你应该"零出现）
- [ ] 与 `docs/02-Prototype.md` v2.0 §6.4 一一对应

---

## 13. v2.0 场景知识块注入（SCENARIO_KB_MAP）

> **本节于 2026-06-16 增补**,由 PE 在 v2.0 重写工单 §12 基础上,对接 KE 已落地的 L3 系列 8 节场景知识块。
> **目的**：让 BE Orchestrator 在调用 analyze 时,根据 `SCENARIO_CODE_OR_NULL` 字段加载对应场景的元数据（关系不对称、风险升级信号、典型情绪）,提升 `risk` / `layer` / `pattern` 判定的准确性。

### 13.1 SCENARIO_KB_MAP（8 节 L3 场景）

| scenario_code | title | layer | risk_default | relationship_asymmetry | kb_path |
|---|---|---|---|---|---|
| `refuse_coworker_passoff` | 拒绝同事甩活 | L3 | low | medium | `agents/knowledge-engineer/kb/kb-2026-l3-001-refuse-coworker.md` |
| `family_should` | 拒绝家人的"你应该" | L3 | low | high | `agents/knowledge-engineer/kb/kb-2026-l3-002-family-should.md` |
| `friend_borrow_money` | 拒绝朋友的"借点钱" | L3 | low | medium | `agents/knowledge-engineer/kb/kb-2026-l3-003-friend-borrow.md` |
| `partner_revisit_topic` | 拒绝对象的"再聊聊吧" | L3 | med | high | `agents/knowledge-engineer/kb/kb-2026-l3-004-partner-revisit.md` |
| `boss_weekend_overtime` | 拒绝领导的"周末加个班" | L3 | med | very_high | `agents/knowledge-engineer/kb/kb-2026-l3-005-boss-weekend.md` |
| `relatives_marriage_kids` | 拒绝亲戚的"结婚/生娃" | L3 | low | medium | `agents/knowledge-engineer/kb/kb-2026-l3-006-relatives-marriage.md` |
| `waitstaff_upsell` | 拒绝服务员的"再来一个" | L3 | low | very_low | `agents/knowledge-engineer/kb/kb-2026-l3-007-waitstaff-more.md` |
| `inner_critic_silencing` | 拒绝自己内心的"你不行" | L3 | med | self | `agents/knowledge-engineer/kb/kb-2026-l3-008-inner-critic.md` |

#### L1 觉察（8 节）

| scenario_code | title | layer | risk_default | relationship_asymmetry | kb_path |
|---|---|---|---|---|---|
| `recent_said_suanle` | 我最近一次「说算了」是什么时候? | L1 | low | none | `agents/knowledge-engineer/kb/kb-2026-l1-001-recent-said-suanle.md` |
| `agreed_vs_wanted` | 我答应的 vs 我想做的 | L1 | low | none | `agents/knowledge-engineer/kb/kb-2026-l1-002-agreed-vs-wanted.md` |
| `laugh_but_think` | 别人笑的时候,我心里在想什么 | L1 | low | none | `agents/knowledge-engineer/kb/kb-2026-l1-003-laugh-but-think.md` |
| `daily_dare_not_say` | 我今天有没有「不敢说不」的瞬间 | L1 | low | none | `agents/knowledge-engineer/kb/kb-2026-l1-004-daily-dare-not-say.md` |
| `tiring_circle` | 我的人际圈里,谁让我最累 | L1 | med | medium | `agents/knowledge-engineer/kb/kb-2026-l1-005-tiring-circle.md` |
| `most_like_me` | 我什么时候最像自己 / 最不像自己 | L1 | low | self | `agents/knowledge-engineer/kb/kb-2026-l1-006-most-like-me.md` |
| `i_am_fine_behind` | 「我没事」背后是什么 | L1 | low | self | `agents/knowledge-engineer/kb/kb-2026-l1-007-i-am-fine-behind.md` |
| `daily_self_betray` | 我今天有没有委屈自己成全别人 | L1 | low | none | `agents/knowledge-engineer/kb/kb-2026-l1-008-daily-self-betray.md` |

#### L2 命名（6 节）

| scenario_code | title | layer | risk_default | relationship_asymmetry | kb_path |
|---|---|---|---|---|---|
| `my_fear_type` | 我的「怕」是什么 — 怕伤关系 / 怕被否定 / 怕冲突 | L2 | low | none | `agents/knowledge-engineer/kb/kb-2026-l2-001-my-fear.md` |
| `auto_response_pattern` | 我的自动反应是「答应 / 解释 / 道歉」 | L2 | low | none | `agents/knowledge-engineer/kb/kb-2026-l2-002-auto-response.md` |
| `inner_not_good_enough` | 我心里那个「我不够好」的声音 | L2 | med | self | `agents/knowledge-engineer/kb/kb-2026-l2-003-inner-not-good-enough.md` |
| `boundary_vs_kindness` | 我的边界 vs 我的善意 | L2 | low | none | `agents/knowledge-engineer/kb/kb-2026-l2-004-boundary-vs-kindness.md` |
| `i_am_fine_truth` | 「我没事」是真的没事吗 | L2 | low | self | `agents/knowledge-engineer/kb/kb-2026-l2-005-i-am-fine-truth.md` |
| `suanle_real_need` | 我今天说「算了」,实际想说的是 | L2 | low | none | `agents/knowledge-engineer/kb/kb-2026-l2-006-suanle-real-need.md` |

> 注:L4 兜底 5 节 + L5 巩固 4 节暂未产出,见 `agents/knowledge-engineer/content-map.md` §路线图。

### 13.2 BE Orchestrator 调用规则

```python
# 伪代码（供 A + BE 落地）
scenario_kb_map = {
    "refuse_coworker_passoff": "agents/knowledge-engineer/kb/kb-2026-l3-001-refuse-coworker.md",
    # ... 其他 7 节
}

# 调用前:
# 1. BE 接收 scenario_code（从客户端或 onboarding 推断）
# 2. BE 从 scenario_kb_map 加载对应 kb 的元数据（YAML 头）
# 3. BE 把 scenario 元数据追加到 user_prompt 的 <scenario_context> 段
# 4. PE prompt 根据 scenario 元数据辅助 layer/risk 判定
```

### 13.3 analyze 输出对 scenario 的响应规则

| 条件 | 行为 |
|------|------|
| `scenario_code` 命中 §13.1 | `risk` 默认值采用 kb 的 `risk_default`;`layer` 默认 L3 |
| `relationship_asymmetry == "very_high"` | `risk` 自动上调一档（low → med,med → high）;PE + Q 联合评估话术强度 |
| `relationship_asymmetry == "self"` | 命中 L3-08：`pattern` 必须为 `取悦` 或 `压抑`（不识别"内化他人"） |
| 命中 `risk_escalation_signals`（家暴 / 跟踪 / 自伤等） | `risk = crisis`,强制走 CrisisPath |
| `scenario_code` 为 null 或不在 map | 走 v1.0 自由对话路径,不加载 kb |
| `scenario_code` 不在 v2.0 列表（未来扩展） | 走通用 v1.0 路径 + 告警,提醒 KE 补 kb |

### 13.4 与 reply.md / coach-not-judging.md / persona.md 的衔接

- analyze 输出的 `risk / layer / pattern` → reply.md §4 system prompt 读取 → CRIA 四段生成
- analyze 输出的 `scenario_code` → reply 加载对应 persona-fewshots（温姐 / 智哥 / 松松）
- analyze 输出的 `crisis_signals` 非空 → reply 走 crisis_redirect（不读人格 few-shot）
- 任何 J1-J7 命中由 reply 的 `prompts/coach-not-judging.md §8` 关键词扫描兜底（不依赖 analyze）

### 13.5 PE 注入 checklist

- [x] §13.1 SCENARIO_KB_MAP 表格已建,**22 节(L1 8 + L2 6 + L3 8)场景全部入库**(2026-06-16)
- [x] §5.1 字段说明的 `SCENARIO_CODE_OR_NULL` 已加引用
- [x] §11 关联文档已加 22 节 L1-L2-L3 路径
- [ ] L4 兜底(5 节) + L5 巩固(4 节)场景 KB 补齐后,追加到 §13.1
- [ ] BE Orchestrator 实现 scenario_kb_map 的实际加载逻辑(A + BE)
- [ ] 评测集增加"scenario 命中"用例 ≥ 80 条(覆盖 22 节 × 多场景输入)
