# T-04 · 12 步演练后端 + 状态机 · 设计稿

> **任务编号**：T-04（plans/m2-poc.md）
> **关联切片**：S-PoC-01 阿瑶的 1 次演练（12 步端到端）
> **关联任务**：T-01（FE 主页）/ T-02（PE+KE 12 步内容）/ T-03（FE 演练 UI）/ T-05（PE+A+BE AI 编排适配）/ T-09（PE+FE+BE 危机兜底）/ T-11（FE+BE 我的剧本）
> **Owner（设计）**：BE
> **Reviewer**：C、A、FE、PE、KE、Q
> **阶段**：调研 + 设计（**不修改 src/ 下任何源代码**）
> **本稿状态**：待 Coordinator 审核
> **版本**：v0.1（2026-06-17）

---

## 0. 阅读须知

- 本稿只描述 **FSM 状态图、API 契约、route.ts 形态、状态持久化、危机联动、错误码、测试用例**。**不输出可运行代码、不动 src/ 任何文件**。
- 一切设计决策必须可回溯到：
  - `docs/02-Prototype.md` v2.0.1 §6.4（12 步骨架）+ §8.1（全局状态机）+ §8.2（演练内部状态机）
  - `docs/05-API-Design.md` v1.1 §9.6（演练 12 步端点）
  - `docs/design/T-01-skill-tree-home.md` v0.1（节点 6 态 / 草稿 `draftStep`）
  - `docs/design/T-09-crisis-fallback.md` v0.1（crisis 联动 / 0 token / preRoutedIntent）
  - `src/lib/ai/orchestrator.ts` v2.0.7.1（1 次 LLM + `intent_override='drill'`）
  - `src/lib/scenarios-data.ts`（PE+KE 签字的 `StepOptions`）
  - `src/app/api/conversations/[id]/messages/route.ts`（统一消息端点，已实装 `intent_override`）
  - `src/app/api/conversations/route.ts`（POST 演练 / GET 列表，**目前未启动 12 步会话**）
- T-04 **不重新实现** orchestrator 的 L0 危机检测、不重新实现 12 步内容生成（那是 T-02 PE+KE 签字的 `StepOptions`）、不重做 SSE 流式（v2.0 占位够用，M3 上生产级）。T-04 的定位是 **"12 步状态机 + 草稿持久化 + 错误码 + 路由编排"**。

---

## 1. 现状分析（gap）

### 1.1 已有可复用资产

| 项 | 位置 | 状态 |
| --- | --- | --- |
| `intent_override='drill'` 已实装 | `src/lib/ai/orchestrator.ts:45,315-318` | ✅ |
| 危机 L0 规则层（0 token） | `src/lib/safety/crisis-detector.ts` + orchestrator `process()` L0 | ✅ |
| 演练 12 步内容（7 场景 `StepOptions`） | `src/lib/scenarios-data.ts` PE+KE 签字 | ✅ |
| `process()` 1 次 LLM 调用（drill skill） | orchestrator `callUnifiedWithIntent` | ✅ |
| `POST /api/conversations` 创建会话 | `src/app/api/conversations/route.ts:8-34` | ✅（**未启动 12 步字段**） |
| `POST /api/conversations/[id]/messages` 统一消息端点 | `src/app/api/conversations/[id]/messages/route.ts:11-86` | ✅ |
| 全局错误码体系（NW-XX-XXXX） | `docs/05-API-Design.md` §7 | ✅ |
| 限流中间件 `withRateLimit` | `src/lib/api/middleware.ts` | ✅ |
| Trace 中间件 `withTrace` | `src/lib/api/middleware.ts` | ✅ |
| `crisis: true` 透出 | `messages/route.ts:60-71` | ✅ |

### 1.2 缺失的"12 步状态机"层

> 这些是 v1.0 留下的"自由对话"形态，v2.0 演练 12 步需要的"**会话级 FSM**"目前**未实装**。

| 缺口 | 影响 | T-04 必须补 |
| --- | --- | --- |
| **无 12 步会话数据模型** | 没有 `DrillSession`（id / skill_id / current_step / status / draft_step） | ✅ 设计数据模型 + 内存态 store |
| **无 start 端点** | `POST /v1/drills` 不存在；当前 `POST /v1/conversations` 创建的是 `type: 'drill'` 但无 12 步字段 | ✅ 新增 `POST /api/conversations/drill/start` |
| **无 step 推进端点** | 演练步骤切换依赖前端 messages 流，缺"按步号提交 + 校验"机制 | ✅ 新增 `POST /api/conversations/drill/[id]/step` |
| **无 state 查询端点** | 草稿恢复 / 节点状态机需要查 `current_step` / `status` | ✅ 新增 `GET /api/conversations/drill/[id]/state` |
| **无状态机校验** | 跳步、跳回、改写、暂停、退出等无后端校验 | ✅ FSM 守卫 + 错误码 |
| **无草稿持久化** | 暂停后草稿易丢；恢复依赖 localStorage | ✅ 内存态 store（globalThis 共享 + M3 Supabase 迁移） |
| **演练步骤 11 保存"我的剧本"未联动** | 保存动作只在前端 | ✅ 设计 step 11 提交 + 调 `scripts-store.ts` 写脚本 |
| **错误码未覆盖演练场景** | 缺 NW-DR-0010~0014 | ✅ 5 个新错误码 |
| **危机联动未显式覆盖 step 7/8** | 已有 L0 规则层覆盖（统一 process），但演练文档未固化 | ✅ 文档化 step 7/8 → crisis 路径 |
| **skill_called 记录缺演练步骤维度** | `routing.skill_called` 写死 `skill-drill (llm)`，无 step_no | ✅ 扩展 `skill_called` 拼接 `step={N}` |

### 1.3 关键不变量

- **危机 L0 永远先于业务**：演练步骤 7/8 提交时**不绕过** `process()`，L0 规则层在演练路径 100% 生效（与自由对话一致）。
- **演练 12 步 = 单一会话 + 单一 FSM 实例**：`DrillSession.id === conversation.id`（沿用 v1.0 会话 ID，不引入新 ID 空间）。
- **草稿写内存态**（M2 阶段）：用 `globalThis.__drillStore`（参考 `src/lib/scripts-store.ts` 现有 pattern），M3 迁 Supabase。
- **前端不实现持久化**：草稿写入完全由后端 hold；前端只读 `state`。
- **演练步骤 11 不直接调 scripts-store**：step 11 是 FSM 内的状态切换，**保存动作**通过 `POST /api/scripts` 触发（T-11 任务），本稿**只定义演练侧的提交契约**。

---

## 2. 12 步状态机设计（FSM 状态图 + 转移条件）

### 2.1 全局维度：演练 FSM vs. 全局产品状态机

> 来自 `docs/02-Prototype.md` §8.2，BE 视角落地。

```
                              ┌──────────────┐
                              │  NOT_STARTED │  ← DrillSession 尚未创建
                              └──────┬───────┘
                                     │ POST /drill/start
                                     ▼
                              ┌──────────────┐
                              │  STEP_01     │  ← INTRO：场景卡 + 点头
                              └──────┬───────┘
                                     │ step 1 提交 acknowledged=true
                                     ▼
                              ┌──────────────┐
                              │  STEP_02     │  ← 觉察：选身体感觉
                              └──────┬───────┘
                                     │ step 2 提交 body_signal
                                     ▼
                                  STEP_03   命名
                                     │ step 3 提交 emotion
                                     ▼
                                  STEP_04   需求
                                     │ step 4 提交 i_want
                                     ▼
                                  STEP_05   边界
                                     │ step 5 提交 i_will + i_wont
                                     ▼
                                  STEP_06   开场
                                     │ step 6 提交 opener_id（2-3 选 1）
                                     ▼
                                  STEP_07   演练（角色扮演 1 轮）
                                     │ step 7 提交 user_says
                                     │  ★ crisis 钩子（L0 规则层）
                                     ▼
                                  STEP_08   应对（对方反驳 → 选应对）
                                     │ step 8 提交 counter_id
                                     │  ★ crisis 钩子（L0 规则层）
                                     ▼
                                  STEP_09   收束
                                     │ step 9 提交 acknowledged=true
                                     │  ★ 调 orchestrator(intent_override='drill')
                                     ▼
                                  STEP_10   演练后（读一遍）
                                     │ step 10 提交 read_acknowledged
                                     ▼
                                  STEP_11   保存（"加进我的剧本"？）
                                     │ step 11 提交 save_to_script + custom_content?
                                     │  ★ 写 scripts-store（POST /api/scripts）
                                     ▼
                                  STEP_12   OUTRO
                                     │ step 12 提交 acknowledged=true
                                     ▼
                              ┌──────────────┐
                              │  COMPLETED   │  ← 演练完成（不计进度）
                              └──────┬───────┘
                                     │ 副作用：节点 mastered_basic + 累计 +1
                                     ▼
                                  (回到 /today)

         ┌──────────────┐  pause    ┌──────────────┐
         │ STEP_N (1-11)│ ────────► │  PAUSED      │
         └──────┬───────┘           └──────┬───────┘
                │ resume                    │ abort
                └────────────┐              │
                             ▼              ▼
                          STEP_N         ABORTED
                                          (草稿保留)
```

### 2.2 状态枚举

```ts
// 12 步 FSM 状态（演练内部）
export type DrillStep =
  | 'INTRO'        // step 1
  | 'BODY_AWARE'   // step 2
  | 'EMOTION'      // step 3
  | 'NEED'         // step 4
  | 'BOUNDARY'     // step 5
  | 'OPENER'       // step 6
  | 'REHEARSE'     // step 7
  | 'COUNTER'      // step 8
  | 'CONCLUDE'     // step 9
  | 'READ_BACK'    // step 10
  | 'SAVE'         // step 11
  | 'OUTRO'        // step 12
  | 'COMPLETED'    // 收束后终态
  | 'ABORTED'      // 主动放弃
  | 'PAUSED';      // 草稿态

// DrillSession 状态（与 DrillStep 同空间但语义不同）
// status: 'in_progress' | 'paused' | 'completed' | 'aborted'
```

### 2.3 状态转移表（守卫 + 副作用）

| 当前状态 | 事件（API） | 守卫 | 下一状态 | 副作用 |
| --- | --- | --- | --- | --- |
| NOT_STARTED | POST `/drill/start` | `skill_id` 在 `scenarios-data` | STEP_01 | 创建 `DrillSession`；`status='in_progress'`；`current_step=1` |
| STEP_01 | POST `/drill/[id]/step` (n=1) | `acknowledged===true` | STEP_02 | 写 `step1.acknowledged_at` |
| STEP_N (2-8) | POST `/drill/[id]/step` (n=N) | 字段非空 + 长度限制 + 枚举校验 | STEP_N+1 | 写 `stepN.{body_signal\|emotion\|i_want\|...}` |
| STEP_09 | POST `/drill/[id]/step` (n=9) | `acknowledged===true` | STEP_10 | 调 `process({intent_override:'drill', user_input:'我刚说："…"'})`；落 `ai_response` |
| STEP_10 | POST `/drill/[id]/step` (n=10) | `read_acknowledged===true` | STEP_11 | 无 |
| STEP_11 | POST `/drill/[id]/step` (n=11) | `save_to_script` 必填 | STEP_12 | `save_to_script===true` → 调 `POST /api/scripts`（内部） |
| STEP_12 | POST `/drill/[id]/step` (n=12) | `acknowledged===true` | COMPLETED | `completed_at=now`；`status='completed'`；**异步副作用**（见 §2.4） |
| STEP_N (1-11) | POST `/drill/[id]/pause` | status=in_progress | PAUSED | `paused_at=now`；`draft_step=N` |
| PAUSED | POST `/drill/[id]/resume` | draft_step 非空 | STEP_N（=draft_step） | `status='in_progress'` |
| PAUSED | POST `/drill/[id]/abort` | — | ABORTED | `status='aborted'`；**不计进度** |
| STEP_N | POST `/drill/[id]/abort` | — | ABORTED | 同上 |
| STEP_N | L0 规则命中 | `ruleCrisis.is_crisis===true` | **保持 STEP_N**（不推进） | `crisis_event_id` 写入；响应 `crisis: true`；前端跳 `/crisis` |
| COMPLETED | — | — | — | 终态；只读 |

### 2.4 副作用清单（COMPLETED 后）

> 这些副作用**不在 step 12 同步路径**上，**由后端在 step 12 提交后异步触发**（M2 阶段：setTimeout 0；M3 阶段：worker / Redis Stream）。

| 副作用 | 触发 | 失败时 |
| --- | --- | --- |
| **节点状态机翻转** `recommended/in_progress → mastered_basic` | step 12 提交后 | 重试 3 次；失败记 Q 审计事件 `drill.mastery_update_failed` |
| **累计 +1** `practiced_count += 1` | 同上 | 同上 |
| **温和连击 +1** | 同上 | 同上（依赖 T-07 实现） |
| **草稿清除** `draft_step = undefined` | 同上 | 同步（无重试） |
| **Q 审计事件** `drill.completed` | 同上 | 同步（占位 console.log） |

> **不计入进度**的条件：用户**主动 abort**（status='aborted'）→ 无副作用。step 11 `save_to_script=false` **仍计入**（polish：练习即完成，不绑定后续动作）。

### 2.5 状态机不变量（必须 100% 满足）

1. **`current_step` 严格单调递增**（除了 pause/resume/abort/crisis）。
2. **跳步拒绝**（NW-DR-0011）：提交 `n` ≠ `current_step` → 400。
3. **未提交当前步 → 拒绝下一步**（NW-DR-0012）：上一字段未写入 → 422。
4. **COMPLETED 终态只读**（NW-DR-0013）：再提交任何 step → 410。
5. **crisis 时不推进步骤**：响应里 `current_step` 不变；草稿保留。
6. **草稿超时 > 3 天** → `current_step` 降级为 `available`（节点状态机侧处理，**不**在 T-04 范围内；T-07 接入）。

---

## 3. API 契约

> 3 个端点。所有端点遵循 `docs/05-API-Design.md` §3 / §5 / §7 通用约定。
> 演练 12 步模块错误码段：**DR**（与 v1.1 §7.2 一致扩展）。

### 3.1 POST /api/conversations/drill/start

**目的**：创建 12 步演练会话 + 返回 `DrillSession` 初始态。

**请求**：

```json
{
  "data": {
    "skill_id": "workplace-shifting",
    "scenario_id": "uuid"        // 可选：v2.0 兼容 v1.0 字段
  },
  "meta": { "client_msg_id": "uuid" }
}
```

**响应（201）**：

```json
{
  "data": {
    "id": "drill-<uuid>",         // 复用 conversation.id 命名空间（drill-* 前缀）
    "user_id": "demo-user",
    "skill_id": "workplace-shifting",
    "skill_title": "同事下班前甩活",
    "skill_layer": "L3",
    "type": "drill",
    "status": "in_progress",
    "current_step": 1,
    "draft_step": 1,              // 始终 = current_step（除非 PAUSED）
    "started_at": "2026-06-17T10:00:00Z",
    "last_active_at": "2026-06-17T10:00:00Z",
    "paused_at": null,
    "completed_at": null,
    "scenario": {                 // 复用 src/lib/scenarios-data.ts
      "code": "workplace-shifting",
      "title": "同事下班前甩活",
      "one_liner": "你可以说：\"我自己的活还没收尾。\"",
      "options": { /* StepOptions */ }
    }
  },
  "meta": { "trace_id": "uuid", "server_time": "..." }
}
```

**错误码**：

| 状态 | 错误码 | 场景 |
| --- | --- | --- |
| 400 | `NW-DR-0010` | `skill_id` 缺失 / 不在 `scenarios-data` |
| 401 | `NW-AU-0001` | 未鉴权（M2 阶段：device_token 校验失败） |
| 429 | — | 限流 30 req / min（来自 §8.1 演练维度） |
| 500 | `NW-ST-0001` | 系统异常 |

---

### 3.2 POST /api/conversations/drill/[id]/step

**目的**：提交第 N 步（1-12），推进或终结状态机。

**路径参数**：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | string | ✅ | `DrillSession.id`（同 `conversation.id`，`drill-*` 前缀） |
| `n` | number | ✅（path segment 或 body `step_no`） | 1-12 |

> **设计决策**：`n` 用 path segment `POST /drill/[id]/steps/[n]` 更符合 REST 资源化（与 v1.1 §9.6 对齐）；但**简化**为 body `step_no` 可减一层路由，**待 Coordinator 拍板**（见 §11 Q1）。

**请求（按 step 字段差异）**：

```json
// step 1 / 9 / 12：纯 acknowledge
{ "data": { "step_no": 1, "acknowledged": true }, "meta": { "client_msg_id": "uuid" } }

// step 2 觉察
{ "data": { "step_no": 2, "body_signal": "胸闷" } }
// body_signal ∈ {紧张, 胸闷, 胃紧, 手心出汗, 无明显, 其他}
// "其他" 时附 text 字段

// step 3 命名
{ "data": { "step_no": 3, "emotion": "焦虑" } }
// emotion ∈ StepOptions.emotions（4 选 1 + 其他 + text）

// step 4 需求
{ "data": { "step_no": 4, "i_want": "我想 6 点准时下班" } }
// string 1-100 字符

// step 5 边界
{ "data": { "step_no": 5, "i_will": "帮忙说明思路", "i_wont": "接手他的活" } }
// 双字段，每个 1-100 字符

// step 6 开场
{ "data": { "step_no": 6, "opener_id": "uuid-or-index" } }
// 从 StepOptions.openers 选 1（2-3 选 1）

// step 7 演练
{ "data": { "step_no": 7, "user_says": "今晚我有安排了..." } }
// string 1-200 字符

// step 8 应对
{ "data": { "step_no": 8, "counter_id": "uuid-or-index" } }
// 从 StepOptions.counter_replies 选 1

// step 10 演练后
{ "data": { "step_no": 10, "read_acknowledged": true } }

// step 11 保存
{ "data": {
    "step_no": 11,
    "save_to_script": true,
    "custom_content": "今晚我有安排了..."  // 可选：用户改写版
} }
```

**响应（200）**：

```json
{
  "data": {
    "step_no": 1,
    "ai_response": null,           // 步骤 1-8 / 10 无 LLM；步骤 9 才有
    "next_step": 2,                // 推进后的 current_step
    "current_step": 2,             // 同上（冗余字段，前端方便）
    "is_complete": false,          // true 时 step 12 提交后
    "drill_session": { /* 同 start 响应.data */ },
    "routing": {
      "intent": "drill",
      "skill_called": "skill-drill (llm) step=9",
      "calls_used": 0,             // 步骤 1-8 / 10 / 12 = 0
      "trace_id": "uuid"
    }
  },
  "meta": { "trace_id": "uuid", "server_time": "..." }
}
```

**步骤 9 特殊响应**（调 1 次 LLM）：

```json
{
  "data": {
    "step_no": 9,
    "ai_response": {
      "acknowledge": "",
      "name_it": "",
      "try_this": "今晚我有安排了，剩下的明天上午我处理。",
      "next_step": "你可以慢慢说，不急。",
      "tone": "calm_warm",
      "word_count": 22,
      "meta": { "fallback": "skill_drill_ok", "kb_refs": [] }
    },
    "next_step": 10,
    "current_step": 10,
    "is_complete": false,
    "routing": {
      "intent": "drill",
      "skill_called": "skill-drill (llm) step=9",
      "calls_used": 1
    }
  },
  "meta": { "trace_id": "uuid", "server_time": "..." }
}
```

**危机场景响应（200 + action_hint）**（步骤 7 / 8 / 11 命中）：

```json
{
  "data": {
    "crisis": true,
    "analyze": {
      "risk": "crisis",
      "crisis_signals": ["撑不下去"],
      "pattern": "其他",
      "layer": "L1",
      "confidence": 0.5,
      "note": "v2.0.7.1 router:crisis_local (drill step=7)"
    },
    "reply": { /* crisis_local 模板 */ },
    "routing": {
      "intent": "crisis",
      "skill_called": "skill-crisis (local) drill_step=7",
      "calls_used": 0
    },
    "drill_session": {
      "current_step": 7,            // 不变（crisis 不推进）
      "status": "in_progress",      // 不变
      "draft_step": 7               // 用于"我现在安全"后恢复
    }
  },
  "meta": { "trace_id": "uuid", "server_time": "..." }
}
```

**错误码**：

| 状态 | 错误码 | 场景 |
| --- | --- | --- |
| 400 | `NW-DR-0011` | 跳步（`n` ≠ `current_step`） |
| 400 | `NW-DR-0014` | step 字段缺失 / 类型错误 / 长度超限 |
| 404 | `NW-CO-0001` | `DrillSession.id` 不存在 |
| 410 | `NW-DR-0013` | session 已 COMPLETED / ABORTED |
| 422 | `NW-DR-0012` | 当前步未完成（无前置 step 数据） |
| 422 | `NW-CO-0003` | 会话超长（步数累计 > 12 异常） |
| 429 | — | 限流 30 req / min |
| 500 | `NW-ST-0001` | 系统异常 |
| 503 | `NW-ST-0002` | LLM 上游不可用（步骤 9 兜底） |

---

### 3.3 GET /api/conversations/drill/[id]/state

**目的**：查询演练当前状态（草稿恢复 / 节点状态机 / 进度环）。

**请求**：无 body。

**响应（200）**：

```json
{
  "data": {
    "id": "drill-<uuid>",
    "skill_id": "workplace-shifting",
    "skill_title": "同事下班前甩活",
    "type": "drill",
    "status": "in_progress",        // in_progress | paused | completed | aborted
    "current_step": 5,
    "draft_step": 5,                // PAUSED 时 = current_step；in_progress 时 = current_step
    "started_at": "2026-06-17T10:00:00Z",
    "last_active_at": "2026-06-17T10:03:24Z",
    "paused_at": null,
    "completed_at": null,
    "steps": [                      // 已提交步的字段（不含原文，避免 PII）
      { "step_no": 1, "acknowledged": true, "submitted_at": "..." },
      { "step_no": 2, "body_signal": "胸闷", "submitted_at": "..." },
      { "step_no": 3, "emotion": "焦虑", "submitted_at": "..." },
      { "step_no": 4, "i_want": "我想 6 点准时下班", "submitted_at": "..." },
      { "step_no": 5, "i_will": "帮忙说明思路", "i_wont": "接手他的活", "submitted_at": "..." }
    ],
    "is_resumable": true            // 草稿在 3 天内可恢复
  },
  "meta": { "trace_id": "uuid", "server_time": "..." }
}
```

**错误码**：

| 状态 | 错误码 | 场景 |
| --- | --- | --- |
| 404 | `NW-CO-0001` | session 不存在 |
| 410 | `NW-CO-0002` | session 已 ABORTED（草稿不可恢复） |

---

## 4. 与 orchestrator.ts 的集成（`intent_override='drill'` 流程 + `skill_called` 记录）

### 4.1 演练步骤 9 是唯一 LLM 调点

> 来自 `docs/02-Prototype.md` §6.4：12 步中 **只有步骤 9（收束）需要 AI 生成 1 句平静话术**。
> 其他步骤：
> - 1-6 / 8：纯枚举选项 / 文本字段，**0 token**
> - 7：用户说出口（前端展示 + 提交，**0 token**）
> - 10：用户自我确认（**0 token**）
> - 11：保存动作（**0 token**，走 `POST /api/scripts`）
> - 12：收束确认（**0 token**）

```
POST /drill/[id]/step (n=9)
  ↓
调 process({
  user_input: '我刚说："' + step6.opener + '"',  // 拼接 user_says
  intent_override: 'drill',
  context: { scenario: 'workplace-shifting', turn_count: 1 }
})
  ↓
[ orchestrator v2.0.7.1 ]
  - L0 规则层：detectCrisis(user_input) → 0 token
  - 命中 intent_override='drill' → 跳过 Router → 1 次 LLM
  - LLM 输出 { intent: 'drill', brief, reply: { reply, hint } }
  - preRoutedIntent='drill' 修正：若 LLM 误判为 crisis → 仍走 buildDrillFallback
  ↓
返回 ReplyOutput { try_this: r.reply, next_step: r.hint, ... }
  ↓
route.ts 把 try_this 写入 DrillSession.step9.ai_response
  ↓
响应 data.ai_response 给前端
```

### 4.2 `skill_called` 扩展（演练步骤维度）

> 现状：`routing.skill_called = 'skill-drill (llm)'`（v2.0.7.1）
> 本稿扩展：拼接 step 号，**仅演练路径**。

```ts
// src/lib/ai/orchestrator.ts 改造意图（T-04 实施阶段）
function buildSkillCalled(args: {
  intent: UnifiedIntent;
  isCrisis: boolean;
  callsUsed: number;
  drillStepNo?: number;          // 新增
}): string {
  if (args.isCrisis) {
    return args.drillStepNo
      ? `skill-crisis (local) drill_step=${args.drillStepNo}`
      : 'skill-crisis (local)';
  }
  if (args.callsUsed === 0) return 'cache-hit';
  if (args.intent === 'drill') {
    return args.drillStepNo
      ? `skill-drill (llm) step=${args.drillStepNo}`
      : 'skill-drill (llm)';
  }
  return 'skill-free-dialogue (llm)';
}
```

**映射到 Q 审计**：

- `skill-drill (llm) step=N` → 调试用：可分析"用户在 step 9 失败率高"等问题。
- `skill-crisis (local) drill_step=N` → 与 T-09 危机联动验证用例对齐。
- `cache-hit` → M2 阶段演练步骤 9 走 cache（与自由对话一致）。

### 4.3 演练步骤 9 之外的 `intent_override='drill'` 用途

> 现状：T-05（PE+A+BE）会扩展 `intent_override='drill'` 用于"演练整体上下文的人格注入"。
> 本稿**不**预判 T-05 决策；route.ts 步骤 9 是当前唯一 LLM 调点，T-05 引入新 LLM 调点时需更新本文。

### 4.4 演练步骤 7/8 危机触发

```
用户 step 7 提交 user_says="我被你搞得想死"
  ↓
POST /drill/[id]/step (n=7) → route.ts step handler
  ↓
[关键设计] step handler **不**调 process()（因为步骤 7 不需要 LLM）
  ↓
但仍**显式调** detectCrisis(body.user_says)
  ↓
若 is_crisis=true:
  - 不推进 current_step
  - 写 crisis_event_id 到 DrillSession
  - 返回 { data.crisis: true, action_hint: 'show_crisis_resources', drill_session: { current_step: 7, ... } }
  - 前端跳 /crisis（草稿保留）
  - 用户"我现在安全" → 回到 /drill 第 7 步
```

**关键不变量**：

- **步骤 7/8 的危机检测在 route.ts handler 内显式调 detectCrisis**（不调 process()，避免误用 LLM）。
- **草稿状态保留**：`status='in_progress'`，`draft_step=7`。
- **不消耗步骤配额**：用户"我现在安全"后**不**消耗 1 次 step 提交。

### 4.5 步骤 7/8 角色扮演的 AI 文本来源

> 步骤 7：AI 扮"对方"（同事）—— 1 句话开场。
> 步骤 8：AI 扮"对方"反驳 —— 1 句。
> 来源：`StepOptions.counter`（PE+KE 签字的硬编码文本），**不调 LLM**。
> 例：`scenarios-data.ts:184-189` `workplace-shifting.counter = "那明早能赶到吗？"`

> **M2 决策**：步骤 7 / 8 的"对方"文本**不**走 LLM，与 T-02 PE+KE 签字的硬编码选项一致（"不 AI 自由生成"红线）。

---

## 5. 状态持久化（M2 内存态 / M3 迁 Supabase）

### 5.1 M2 阶段：内存态（globalThis 共享）

> 与 `src/lib/scripts-store.ts` 现有 pattern 一致（`globalThis.__scriptsStore ??= new Map()`）。

```ts
// src/lib/drill-store.ts（M2 阶段设计意图）
import { uuid } from './utils/id';
import type { DrillStep } from './types';

export interface DrillSessionRecord {
  id: string;
  user_id: string;
  skill_id: string;
  type: 'drill';
  status: 'in_progress' | 'paused' | 'completed' | 'aborted';
  current_step: number;          // 1-12；COMPLETED 后 = 12
  draft_step: number;            // PAUSED 时 = current_step
  steps: Partial<Record<1|2|3|4|5|6|7|8|9|10|11|12, StepRecord>>;
  started_at: string;
  last_active_at: string;
  paused_at: string | null;
  completed_at: string | null;
  crisis_event_id: string | null;
  trace_id: string;              // 创建时的 trace_id
}

interface StepRecord {
  step_no: number;
  // step-specific fields
  body?: Record<string, unknown>;
  submitted_at: string;
  ai_response?: { try_this: string; next_step: string } | null;
}

declare global {
  var __drillStore: Map<string, DrillSessionRecord> | undefined;
}

export const drillStore: Map<string, DrillSessionRecord> =
  globalThis.__drillStore ?? (globalThis.__drillStore = new Map());

// TTL：M2 阶段 24h 后自动清理（避免内存爆）
const TTL_MS = 24 * 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of drillStore) {
    const age = now - new Date(s.last_active_at).getTime();
    if (age > TTL_MS && s.status !== 'in_progress') {
      drillStore.delete(id);
    }
  }
}, 60 * 60 * 1000);  // 每小时清理一次
```

### 5.2 CRUD

| 操作 | 函数 | 说明 |
| --- | --- | --- |
| 创建 | `drillStore.set(id, record)` | POST `/drill/start` |
| 查询 | `drillStore.get(id)` | GET `/drill/[id]/state` |
| 更新 | `drillStore.set(id, { ...record, ...patch })` | POST `/drill/[id]/step` |
| 删除 | `drillStore.delete(id)` | ABORT 后保留 7 天再清 |
| 列出 | `Array.from(drillStore.values()).filter(s => s.user_id === uid)` | GET `/drill`（M2 阶段不暴露） |

### 5.3 M3 迁移 Supabase 计划

| 阶段 | 工作 | 依赖 |
| --- | --- | --- |
| M3 启动 | 写 `supabase/migrations/0XX-drill-sessions.sql` | A 写 ADR-008（DrillSession schema） |
| M3 中 | `drill-store.ts` 加 `SUPABASE_URL` 环境变量开关，无 env 时走内存 | A |
| M3 末 | FE 端 `/drill` 列表页接 Supabase | FE |

**M2 阶段限制**：

- **不跨进程**（dev server 重启数据丢失；接受，因 M2 阶段是 PoC）。
- **不跨用户**（user_id 硬编码 `demo-user`，与 v1.0 一致）。
- **不持久化到磁盘**（globalThis 仅内存）。

### 5.4 与 `scripts-store.ts` 的关系

> 步骤 11 `save_to_script=true` 时：
> 1. **route.ts step 11 handler** 不直接写 `scripts-store`。
> 2. 改为**调内部 `POST /api/scripts`**（fetch 内部 URL 或直接 import）。
> 3. **失败回滚**：scripts 写入失败 → step 11 拒绝（NW-DR-0014 变体或 NW-ST-0002）。

```ts
// route.ts step 11 handler（设计意图）
const scriptsRes = await fetch(`${baseUrl}/api/scripts`, {
  method: 'POST',
  body: JSON.stringify({
    data: {
      title: session.skill_title,
      scene_tag: session.skill_id,
      content: body.custom_content ?? session.steps[7]?.body?.user_says ?? session.steps[6]?.body?.opener,
    },
  }),
});
if (!scriptsRes.ok) {
  return jsonError('NW-ST-0002', trace_id);
}
```

> **决策**：本稿采用"内部 fetch 调 `/api/scripts`"（更易测试、易加 T-11 鉴权）。Coordinator 可拍板"直接 import scripts-store"（更快，但耦合）。

---

## 6. 步骤 7-8 危机触发（与 T-09 crisis-detector 联动）

### 6.1 触发流程

```
用户 step 7 提交 user_says
  ↓
POST /api/conversations/drill/[id]/step
  ↓
route.ts step handler
  ↓
[1] 校验 step_no === current_step（NW-DR-0011）
[2] 字段校验（NW-DR-0014）
[3] **detectCrisis(user_says)** ← 显式调，0 token
[4] 若 is_crisis=true：
    - 写 crisis_event_id 到 DrillSession
    - 不推进 current_step
    - 返回 { data.crisis: true, ... drill_session: { current_step: 7, status: 'in_progress' } }
[5] 若 is_crisis=false：
    - 写 step 7 字段到 DrillSession.steps[7]
    - 推进 current_step = 8
    - 返回 { data: { step_no: 7, next_step: 8, is_complete: false } }
```

### 6.2 与 T-09 的契约对齐

> 来自 `docs/design/T-09-crisis-fallback.md` §8.3.2 "演练入口"。

| T-09 期望 | T-04 实现 |
| --- | --- |
| 演练步骤 7/8 角色扮演 + 用户回危机话术 → crisis + 跳 `/crisis` | ✅ `route.ts step handler` 显式 `detectCrisis` |
| `routing.skill_called = 'skill-crisis (local)'` | ✅ 扩展为 `skill-crisis (local) drill_step=N` |
| `analyze.risk === 'crisis'` | ✅ |
| `reply.meta.action_hint = 'show_crisis_resources'` | ✅（复用 v2.0.7.1 reply 模板） |
| 草稿保留到 localStorage | ⚠️ **T-04 写 DrillSession 草稿** + **FE 写 localStorage 备份**（双写保险） |
| 演练跨页面一致 | ✅ 调同一 `detectCrisis()` 函数 |

### 6.3 不调 LLM 的不变量

> 与 T-09 §4.1 一致。

- 步骤 7/8 危机路径**不**调 `process()`（不调 LLM）。
- `calls_used === 0` 不变量成立。
- `routing.skill_called = 'skill-crisis (local) drill_step=N'`。

### 6.4 step 11 备注的危机检测

> step 11 的 `custom_content` 字段（用户改写版）也走 `detectCrisis`：
> - **不阻断** step 11 提交（crisis 状态不应阻挡用户保存成果）。
> - **写 crisis_event_id**（不跳页，仅记 Q 审计事件）。

---

## 7. 步骤 11 保存"加进我的剧本"（与 T-11 scripts 接口）

### 7.1 步骤 11 提交逻辑

```
POST /drill/[id]/step (n=11)
  body: { step_no: 11, save_to_script: bool, custom_content?: string }
  ↓
[1] 校验 save_to_script 必填
[2] 若 save_to_script === true：
    - content = custom_content ?? step6.opener ?? step7.user_says
    - 调 POST /api/scripts { title, scene_tag, content }
    - 失败：NW-ST-0002（503）
[3] 写 step 11 字段
[4] 推进 current_step = 12
```

### 7.2 `save_to_script=false` 的语义

> 与 T-01 §3.3 "6 态切换规则" 一致：polish 决定"练习即完成，不绑定后续动作"。
> 所以 `save_to_script=false` **不影响进度累计**。
> 副作用：脚本不写；但 completed_at 仍记录；`practiced_count += 1` 仍生效。

### 7.3 与 T-11 联调

| 字段 | 来自 | 写入 |
| --- | --- | --- |
| `title` | `session.skill_title` | `scripts.title` |
| `scene_tag` | `session.skill_id` | `scripts.scene_tag` |
| `content` | `step11.custom_content` ?? `step6.opener` ?? `step7.user_says` | `scripts.content` |
| `drill_session_id` | `session.id` | `scripts.drill_session_id`（T-11 可选字段） |

> **T-11 是否接受 `drill_session_id` 字段待 T-11 拍板**；T-04 在脚本 POST 失败时不重试（不污染 T-11 错误码）。

---

## 8. 错误码定义（NW-DR-0010~0014）

> 5 个新错误码，全部含 `user_message`（人话）+ `action_hint`（前端动作）。

| Code | 含义 | HTTP | user_message | action_hint | 触发位置 |
| --- | --- | --- | --- | --- | --- |
| `NW-DR-0010` | 演练 skill 不存在 | 400 | "这个演练还没准备好。" | "show_today" | POST `/drill/start` |
| `NW-DR-0011` | 跳步提交 | 400 | "你好像跳了一步。" | "back_to_current_step" | POST `/drill/[id]/step` |
| `NW-DR-0012` | 当前步未完成 | 422 | "把这一步说完再继续。" | "show_current_step" | POST `/drill/[id]/step` |
| `NW-DR-0013` | session 已结束 | 410 | "这次演练已经结束了。" | "go_home" | POST `/drill/[id]/step`（COMPLETED / ABORTED 后） |
| `NW-DR-0014` | 字段缺失 / 错误 | 400 | "我们没看清，再说一次？" | "show_input" | POST `/drill/[id]/step` |

### 8.1 错误体

```json
{
  "error": {
    "code": "NW-DR-0011",
    "message": "你好像跳了一步。",
    "user_message": "我们还在第 5 步，先把这一步说完再继续。",
    "action_hint": "back_to_current_step",
    "current_step": 5,
    "trace_id": "uuid"
  }
}
```

### 8.2 错误码优先级

- 业务错误（NW-DR-XXXX）> 输入错误（NW-AU-XXXX）> 系统错误（NW-ST-XXXX）。
- crisis 路径返回 HTTP 200 + `data.crisis=true`（**不**用 NW-CR 错误码），与 v2.0.7.1 对齐。

### 8.3 与现有错误码的协调

| 现有 | 用途 | T-04 是否复用 |
| --- | --- | --- |
| `NW-AU-0001` | 未鉴权 | ✅（device_token 校验失败） |
| `NW-CO-0001` | 会话不存在 | ✅（drill session 同 namespace） |
| `NW-CO-0002` | 会话已结束 | ❌（演练用 NW-DR-0013 替代） |
| `NW-CO-0003` | 会话超长 | ✅（步骤累计 > 12 异常） |
| `NW-CO-0010/0011` | 内容空 / 长度超限 | ❌（演练用 NW-DR-0014） |
| `NW-CR-0001/0002` | crisis 路径 | ❌（演练 crisis 用 `data.crisis: true`） |
| `NW-ST-0001/0002` | 系统异常 / 上游不可用 | ✅ |

---

## 9. 关键代码片段（route.ts 核心 handler，≤ 150 行）

> 以下是**设计稿占位**（仅作形态与结构示意），**不直接落地到 src/**。
> 落地时由 Coordinator 批准后另立实施任务。

### 9.1 `POST /api/conversations/drill/start/route.ts`

```ts
// src/app/api/conversations/drill/start/route.ts
// 来自 docs/design/T-04-drill-backend.md §3.1
import { NextRequest, NextResponse } from 'next/server';
import { withTrace, withRateLimit } from '@/lib/api/middleware';
import { jsonError } from '@/lib/utils/error';
import { uuid } from '@/lib/utils/id';
import { drillStore, type DrillSessionRecord } from '@/lib/drill-store';
import { getScenarioOptions, type Scenario } from '@/lib/scenarios-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('drill:start', 30, 60_000);
  if (!rl.ok) return rl.response;

  try {
    const body = (await req.json()) as { skill_id?: string; scenario_id?: string };
    if (!body.skill_id) return jsonError('NW-DR-0010', trace_id);

    // 从 scenarios-data 取 skill 元数据
    const scenario = getScenarioOptions(body.skill_id) // 注：getScenarioOptions 返回 StepOptions，不是 Scenario
      ? { code: body.skill_id, options: getScenarioOptions(body.skill_id) }
      : null;
    if (!scenario) return jsonError('NW-DR-0010', trace_id);

    const id = `drill-${uuid()}`;
    const now = new Date().toISOString();
    const record: DrillSessionRecord = {
      id,
      user_id: 'demo-user',
      skill_id: body.skill_id,
      type: 'drill',
      status: 'in_progress',
      current_step: 1,
      draft_step: 1,
      steps: {},
      started_at: now,
      last_active_at: now,
      paused_at: null,
      completed_at: null,
      crisis_event_id: null,
      trace_id,
    };
    drillStore.set(id, record);

    return NextResponse.json(
      {
        data: {
          ...record,
          skill_title: scenario.code, // TODO: T-02 PE+KE 签字的 title
          skill_layer: 'L3',
          scenario,
        },
        meta: { trace_id, server_time: now },
      },
      { status: 201 },
    );
  } catch {
    return jsonError('NW-ST-0001', trace_id);
  }
}
```

> 行数：约 60 行。

### 9.2 `POST /api/conversations/drill/[id]/step/route.ts`

```ts
// src/app/api/conversations/drill/[id]/step/route.ts
// 来自 docs/design/T-04-drill-backend.md §3.2
import { NextRequest, NextResponse } from 'next/server';
import { withTrace, withRateLimit } from '@/lib/api/middleware';
import { jsonError } from '@/lib/utils/error';
import { drillStore } from '@/lib/drill-store';
import { detectCrisis } from '@/lib/safety/crisis-detector';
import { process } from '@/lib/ai/orchestrator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 字段校验（per step）
function validateStepBody(stepNo: number, body: any): string | null {
  if (stepNo === 1 || stepNo === 9 || stepNo === 12) {
    if (body.acknowledged !== true) return 'NW-DR-0014';
  }
  if (stepNo === 2 && !body.body_signal) return 'NW-DR-0014';
  if (stepNo === 3 && (!body.emotion || body.emotion.length > 20)) return 'NW-DR-0014';
  if (stepNo === 4 && (!body.i_want || body.i_want.length > 100)) return 'NW-DR-0014';
  if (stepNo === 5 && (!body.i_will || !body.i_wont)) return 'NW-DR-0014';
  if (stepNo === 6 && body.opener_id === undefined) return 'NW-DR-0014';
  if (stepNo === 7 && (!body.user_says || body.user_says.length > 200)) return 'NW-DR-0014';
  if (stepNo === 8 && body.counter_id === undefined) return 'NW-DR-0014';
  if (stepNo === 10 && body.read_acknowledged !== true) return 'NW-DR-0014';
  if (stepNo === 11 && body.save_to_script === undefined) return 'NW-DR-0014';
  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('drill:step', 30, 60_000);
  if (!rl.ok) return rl.response;

  const { id } = await params;
  const session = drillStore.get(id);
  if (!session) return jsonError('NW-CO-0001', trace_id);
  if (session.status === 'completed' || session.status === 'aborted') {
    return jsonError('NW-DR-0013', trace_id);
  }

  try {
    const body = (await req.json()) as { step_no: number; [k: string]: any };
    if (body.step_no !== session.current_step) return jsonError('NW-DR-0011', trace_id);

    const fieldErr = validateStepBody(body.step_no, body);
    if (fieldErr) return jsonError(fieldErr, trace_id);

    // 步骤 7/8 显式 crisis 检测
    if (body.step_no === 7 || body.step_no === 8) {
      const text = body.user_says ?? body.counter_id ?? '';
      const rule = detectCrisis(String(text));
      if (rule.is_crisis) {
        session.crisis_event_id = `crisis-${trace_id}`;
        session.last_active_at = new Date().toISOString();
        drillStore.set(id, session);
        return NextResponse.json({
          data: {
            crisis: true,
            analyze: { risk: 'crisis', crisis_signals: rule.matched, note: `v2.0.7.1 router:crisis_local (drill step=${body.step_no})` },
            routing: { intent: 'crisis', skill_called: `skill-crisis (local) drill_step=${body.step_no}`, calls_used: 0 },
            drill_session: { current_step: session.current_step, status: 'in_progress', draft_step: session.current_step },
          },
          meta: { trace_id, server_time: new Date().toISOString() },
        });
      }
    }

    // 步骤 9 调 LLM
    let aiResponse = null;
    if (body.step_no === 9) {
      const out = await process({
        user_id: session.user_id,
        conversation_id: session.id,
        user_input: `我刚说："${session.steps[6]?.body?.opener ?? ''}"`,
        context: { user_id: session.user_id, conversation_id: session.id, recent_messages: [], turn_count: 9, scenario: session.skill_id },
        intent_override: 'drill',
      });
      aiResponse = { try_this: out.reply.try_this, next_step: out.reply.next_step };
    }

    // 步骤 11 保存到 scripts（内部 fetch）
    if (body.step_no === 11 && body.save_to_script) {
      const content = body.custom_content ?? session.steps[6]?.body?.opener ?? session.steps[7]?.body?.user_says ?? '';
      const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/scripts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: { title: session.skill_id, scene_tag: session.skill_id, content } }),
      });
      if (!r.ok) return jsonError('NW-ST-0002', trace_id);
    }

    // 推进
    const stepNo = body.step_no as 1|2|3|4|5|6|7|8|9|10|11|12;
    session.steps[stepNo] = { step_no: stepNo, body, submitted_at: new Date().toISOString(), ai_response: aiResponse };
    session.current_step = stepNo === 12 ? 12 : (stepNo + 1);
    if (stepNo === 12) {
      session.status = 'completed';
      session.completed_at = new Date().toISOString();
      // TODO: 异步副作用（节点 mastered_basic + 累计 +1 + 温和连击 +1）
    }
    session.last_active_at = new Date().toISOString();
    drillStore.set(id, session);

    return NextResponse.json({
      data: {
        step_no: stepNo,
        ai_response: aiResponse,
        next_step: session.current_step,
        current_step: session.current_step,
        is_complete: stepNo === 12,
        drill_session: session,
        routing: { intent: 'drill', skill_called: `skill-drill (llm) step=${stepNo}`, calls_used: stepNo === 9 ? 1 : 0 },
      },
      meta: { trace_id, server_time: new Date().toISOString() },
    });
  } catch {
    return jsonError('NW-ST-0001', trace_id);
  }
}
```

> 行数：约 130 行（不含空行/注释），**在 150 行预算内**。

### 9.3 `GET /api/conversations/drill/[id]/state/route.ts`

```ts
// src/app/api/conversations/drill/[id]/state/route.ts
// 来自 docs/design/T-04-drill-backend.md §3.3
import { NextRequest, NextResponse } from 'next/server';
import { withTrace, withRateLimit } from '@/lib/api/middleware';
import { jsonError } from '@/lib/utils/error';
import { drillStore } from '@/lib/drill-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DRAFT_TTL_MS = 3 * 24 * 60 * 60 * 1000;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { trace_id } = withTrace(_req);
  const rl = withRateLimit('drill:state', 60, 60_000);
  if (!rl.ok) return rl.response;

  const { id } = await params;
  const session = drillStore.get(id);
  if (!session) return jsonError('NW-CO-0001', trace_id);
  if (session.status === 'aborted') return jsonError('NW-CO-0002', trace_id);

  const age = Date.now() - new Date(session.last_active_at).getTime();
  const resumable = age < DRAFT_TTL_MS && session.status === 'in_progress';

  return NextResponse.json({
    data: {
      id: session.id,
      skill_id: session.skill_id,
      skill_title: session.skill_id, // TODO: T-02 注入真实 title
      type: 'drill',
      status: session.status,
      current_step: session.current_step,
      draft_step: session.draft_step,
      started_at: session.started_at,
      last_active_at: session.last_active_at,
      paused_at: session.paused_at,
      completed_at: session.completed_at,
      steps: Object.values(session.steps),
      is_resumable: resumable,
    },
    meta: { trace_id, server_time: new Date().toISOString() },
  });
}
```

> 行数：约 50 行。

---

## 10. 测试用例设计：5 个核心 case

### 10.1 Case 1 · 12 步 happy path 端到端

**目的**：验证 §2 状态机 + §3 API + §5 持久化 + §7 步骤 11 联动的完整链路。

```ts
// tests/drill-backend.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { drillStore } from '@/lib/drill-store';

describe('T-04 12 步演练 happy path', () => {
  beforeEach(() => drillStore.clear());

  it('走完 12 步（阿瑶的 S-PoC-01）', async () => {
    // 1) start
    const startRes = await fetch('http://localhost:3000/api/conversations/drill/start', {
      method: 'POST',
      body: JSON.stringify({ data: { skill_id: 'workplace-shifting' } }),
    });
    expect(startRes.status).toBe(201);
    const { data: session } = await startRes.json();
    expect(session.current_step).toBe(1);
    expect(session.status).toBe('in_progress');
    const id = session.id;

    // 2) step 1 INTRO
    const r1 = await fetch(`http://localhost:3000/api/conversations/drill/${id}/step`, {
      method: 'POST',
      body: JSON.stringify({ data: { step_no: 1, acknowledged: true } }),
    });
    expect(r1.status).toBe(200);
    expect((await r1.json()).data.current_step).toBe(2);

    // 3-5) 步骤 2-5
    for (const stepNo of [2, 3, 4, 5]) {
      const body = stepNo === 2 ? { body_signal: '胸闷' }
        : stepNo === 3 ? { emotion: '焦虑' }
        : stepNo === 4 ? { i_want: '我想 6 点准时下班' }
        : { i_will: '帮忙说明思路', i_wont: '接手他的活' };
      const r = await fetch(`http://localhost:3000/api/conversations/drill/${id}/step`, {
        method: 'POST',
        body: JSON.stringify({ data: { step_no: stepNo, ...body } }),
      });
      expect(r.status).toBe(200);
      expect((await r.json()).data.current_step).toBe(stepNo + 1);
    }

    // 6) step 6 opener
    const r6 = await fetch(`http://localhost:3000/api/conversations/drill/${id}/step`, {
      method: 'POST',
      body: JSON.stringify({ data: { step_no: 6, opener_id: 0 } }),
    });
    expect(r6.status).toBe(200);

    // 7) step 7 演练
    const r7 = await fetch(`http://localhost:3000/api/conversations/drill/${id}/step`, {
      method: 'POST',
      body: JSON.stringify({ data: { step_no: 7, user_says: '今晚我有安排了...' } }),
    });
    expect(r7.status).toBe(200);

    // 8) step 8 counter
    const r8 = await fetch(`http://localhost:3000/api/conversations/drill/${id}/step`, {
      method: 'POST',
      body: JSON.stringify({ data: { step_no: 8, counter_id: 0 } }),
    });
    expect(r8.status).toBe(200);

    // 9) step 9 调 LLM
    const r9 = await fetch(`http://localhost:3000/api/conversations/drill/${id}/step`, {
      method: 'POST',
      body: JSON.stringify({ data: { step_no: 9, acknowledged: true } }),
    });
    expect(r9.status).toBe(200);
    const r9data = (await r9.json()).data;
    expect(r9data.ai_response).toBeTruthy();
    expect(r9data.routing.calls_used).toBe(1);

    // 10) step 10 演练后
    const r10 = await fetch(`http://localhost:3000/api/conversations/drill/${id}/step`, {
      method: 'POST',
      body: JSON.stringify({ data: { step_no: 10, read_acknowledged: true } }),
    });
    expect(r10.status).toBe(200);

    // 11) step 11 保存
    const r11 = await fetch(`http://localhost:3000/api/conversations/drill/${id}/step`, {
      method: 'POST',
      body: JSON.stringify({ data: { step_no: 11, save_to_script: true } }),
    });
    expect(r11.status).toBe(200);

    // 12) step 12 OUTRO
    const r12 = await fetch(`http://localhost:3000/api/conversations/drill/${id}/step`, {
      method: 'POST',
      body: JSON.stringify({ data: { step_no: 12, acknowledged: true } }),
    });
    expect(r12.status).toBe(200);
    const r12data = (await r12.json()).data;
    expect(r12data.is_complete).toBe(true);
    expect(r12data.drill_session.status).toBe('completed');

    // 13) GET state 验证 completed
    const state = await fetch(`http://localhost:3000/api/conversations/drill/${id}/state`);
    const stateData = (await state.json()).data;
    expect(stateData.status).toBe('completed');
    expect(stateData.completed_at).toBeTruthy();
  });
});
```

### 10.2 Case 2 · 跳步拒绝（NW-DR-0011）

```ts
it('拒绝跳步', async () => {
  const { data: session } = await startDrill('workplace-shifting');
  // 当前在 step 1，尝试提交 step 3
  const r = await fetch(`.../drill/${session.id}/step`, {
    method: 'POST',
    body: JSON.stringify({ data: { step_no: 3, emotion: '焦虑' } }),
  });
  expect(r.status).toBe(400);
  const body = await r.json();
  expect(body.error.code).toBe('NW-DR-0011');
  expect(body.error.current_step).toBe(1);
});
```

### 10.3 Case 3 · 步骤 7 危机触发

```ts
it('演练 step 7 触发 crisis', async () => {
  const { data: session } = await startDrill('workplace-shifting');
  // 推进到 step 7
  for (let i = 1; i < 7; i++) await submitStep(session.id, i, validBodies[i]);
  // step 7 提交危机话术
  const r = await fetch(`.../drill/${session.id}/step`, {
    method: 'POST',
    body: JSON.stringify({ data: { step_no: 7, user_says: '我被你搞得想死' } }),
  });
  expect(r.status).toBe(200);
  const body = await r.json();
  expect(body.data.crisis).toBe(true);
  expect(body.data.routing.skill_called).toContain('skill-crisis (local) drill_step=7');
  expect(body.data.routing.calls_used).toBe(0);
  expect(body.data.drill_session.current_step).toBe(7); // 不推进
  expect(body.data.drill_session.status).toBe('in_progress'); // 草稿保留
});
```

### 10.4 Case 4 · 暂停 / 恢复

```ts
it('暂停后恢复从原步骤继续', async () => {
  const { data: session } = await startDrill('workplace-shifting');
  // 推进到 step 5
  for (let i = 1; i < 5; i++) await submitStep(session.id, i, validBodies[i]);
  // 暂停
  const pause = await fetch(`.../drill/${session.id}/pause`, { method: 'POST' });
  expect((await pause.json()).data.drill_session.status).toBe('paused');
  // 恢复
  const resume = await fetch(`.../drill/${session.id}/resume`, { method: 'POST' });
  expect((await resume.json()).data.drill_session.current_step).toBe(5);
});
```

### 10.5 Case 5 · COMPLETED 后再提交拒绝（NW-DR-0013）

```ts
it('COMPLETED 后再提交拒绝', async () => {
  const id = await runFullDrill();  // 跑完 12 步
  const r = await fetch(`.../drill/${id}/step`, {
    method: 'POST',
    body: JSON.stringify({ data: { step_no: 1, acknowledged: true } }),
  });
  expect(r.status).toBe(410);
  const body = await r.json();
  expect(body.error.code).toBe('NW-DR-0013');
});
```

### 10.6 5 个 case 覆盖矩阵

| 维度 | Case 1 | Case 2 | Case 3 | Case 4 | Case 5 |
| --- | --- | --- | --- | --- | --- |
| 状态机 happy path | ✅ | | | | ✅ |
| 跳步守卫 | | ✅ | | | |
| 危机联动（L0 0 token） | | | ✅ | | |
| 暂停 / 恢复 | | | | ✅ | |
| 终态只读 | ✅ | | | | ✅ |
| 错误码（NW-DR-0011/0013） | | ✅ | | | ✅ |
| 字段校验（NW-DR-0014） | ✅ | | | | |
| 步骤 9 LLM 调用 | ✅ | | | | |
| 步骤 11 scripts 联动 | ✅ | | | | |
| 状态持久化 | ✅ | | ✅ | ✅ | ✅ |
| 跨页面一致性（crisis 路径） | | | ✅ | | |

> **未覆盖**（follow-up，列入 T-16 Q 评审）：
> - 草稿超时 > 3 天（T-07 接入）
> - 跨设备同步（M3）
> - 限流 429（T-14 部署流水线验证）

---

## 11. 风险点

### 11.1 P0 风险（必避）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-01 状态机跳步 / 重入** | 黑客或前端 bug 导致跳步 / 倒推 | 后端守卫 `step_no === current_step` + 终态只读（NW-DR-0011/0013） |
| **R-02 危机被绕过** | 演练 step 7/8 不调 `process()`，漏 detectCrisis | route.ts step handler **显式** 调 detectCrisis（§6.1） |
| **R-03 步骤 9 LLM 偶发 503** | 上游超时，用户卡在 step 9 | `fallbackForIntent('drill')` 走 `buildDrillFallback`（orchestrator 已实装）+ `NW-ST-0002` |
| **R-04 步骤 11 scripts 写入失败** | scripts-store 写失败，演练数据不一致 | NW-ST-0002 拒绝提交 + 草稿保留；前端可重试 |
| **R-05 内存态数据丢失** | dev server 重启草稿丢失 | M2 阶段接受（M3 Supabase）；前端 localStorage 备份双写 |
| **R-06 步骤 9 用户输入被注入 LLM 上下文** | step 7.user_says 拼接成 `我刚说："..."` 时注入 LLM | 限制 step 7 长度 ≤ 200 字符 + 严格字符串拼接（已实现） |
| **R-07 skill_called 缺失 step 维度** | Q 审计无法定位"用户在 step 9 失败率高" | §4.2 扩展 `skill-drill (llm) step=N` |

### 11.2 P1 风险（follow-up）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-08 步骤 7 步骤 8 角色扮演硬编码** | `StepOptions.counter` PE+KE 签字，但用户可能觉得不自然 | M3 引入"用户改写 counter"功能（T-15 评测） |
| **R-09 草稿超时清理** | 内存态 TTL 24h 与 T-07 温和连击规则不同步 | 统一为 3 天（M2 接受，**注：本文 §9.3 写 3 天，§5.1 写 24h 内存清理 —— 需协调**） |
| **R-10 演练步骤 9 preRoutedIntent 修正** | LLM 把 drill 误判为 crisis → 走 buildDrillFallback 而非 buildCrisisLocal | v2.0.7.1 已实装（preRoutedIntent 修正）；Q 用例覆盖 |
| **R-11 错误码漂移** | NW-DR-XXXX 与 NW-CO-XXXX 边界不清 | §8 表格 + Q 评审对齐；CI grep 自检 |
| **R-12 skill_id 不存在 400 vs 404** | `NW-DR-0010` 用 400，但更符合 404 | Coordinator 拍板（建议 400 + `action_hint: show_today`） |
| **R-13 内部 fetch `/api/scripts` 循环依赖** | route.ts 调 scripts 路由 → scripts 路由又调 drill？ | 防火墙：scripts 路由**不**调 drill；单向依赖 |
| **R-14 baseUrl 解析** | `process.env.NEXT_PUBLIC_BASE_URL` 在 server-side fetch 不可用 | 用 `new URL('/api/scripts', req.url).origin` |

### 11.3 P2 风险（远期）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-15 演练步骤动态化** | "固定 12 步"约束（R0）与"按难度调整"诉求冲突 | 坚持 R0；M3 引入"高难度版"为新 skill 而非动态步骤 |
| **R-16 跨设备同步** | M2 内存态不跨设备 | M3 Supabase + RLS |
| **R-17 演练会话超长** | 步数累计 > 12 异常（NW-CO-0003） | 实施阶段监控 + 告警 |

---

## 12. 待 Coordinator 拍板的 3 个开放问题

| # | 问题 | 建议 |
| --- | --- | --- |
| Q1 | step 路由用 `POST /drill/[id]/steps/[n]`（v1.1 §9.6）还是 `POST /drill/[id]/step` body `step_no`（本文稿）？ | 建议 **`POST /drill/[id]/step` body `step_no`**（route.ts 数量减 2 / 与已有 `messages/route.ts` 一致 / 减少动态路由层级） |
| Q2 | 步骤 11 调 `POST /api/scripts` 用 **内部 fetch** 还是 **直接 import scripts-store**？ | 建议 **内部 fetch**（更解耦；缺点：多 1 次 HTTP 开销） |
| Q3 | 草稿 TTL 写 24h（§5.1 内存清理）还是 3 天（§9.3 is_resumable）？ | 建议 **统一为 3 天**（与 T-07 温和连击规则一致）；修改 §5.1 内存清理逻辑 |

---

## 13. 红线自检（CLAUDE.md §5 + docs/02-Prototype.md §16）

| 红线 | 本稿情况 | 通过 |
| --- | --- | --- |
| ❌ 心数 / 宝石 / 排行榜 / 打卡天数 | 12 步不引入任何货币 / 排行 / 打卡 | ✅ |
| ❌ "你太软弱 / 你应该 / 你连这都…" | 错误码 user_message 全部人话（"我们没看清，再说一次？"） | ✅ |
| ❌ 在危机路径给"怎么办"建议 | 危机路径走 buildCrisisLocal 本地模板，0 LLM（与 T-09 一致） | ✅ |
| ❌ KB 全文注入 LLM | orchestrator 已实装（v2.0.7.1 1 次 LLM） | ✅ |
| ❌ 完整 history 注入 LLM | step 9 拼接 step 6 opener，**不**注入 history | ✅ |
| ❌ 多 Agent 重复消费上下文 | 本稿单 Agent（BE）调研 + 设计，待 Coordinator 审核 | ✅ |
| ❌ 不做安全评审就上线情绪功能 | T-09 独立验证 + T-15/T-16 评审 | ✅ |
| ❌ 显示用户 PII | 错误体只含 trace_id / current_step / user_message，**不**含原文 | ✅ |
| §16.3 拒绝清单 grep 自检 | 5 个新错误码无 `heart` / `lives` / `gem` / `coin` / `leaderboard` | ✅ |
| §16.3 推送文案自检 | 本稿不涉及推送（T-08 处理） | ✅ |
| §16.2 借鉴与改造 11 条 | 12 步有限步借鉴 ✅ / 单步单任务借鉴 ✅ / 不评分 ✅ / 收束话术 ✅ | ✅ |
| §16.1 拒绝 / 不评判 / 不催促 | 错误码文案"我们没看清""把这一步说完"无评判 / 无催促 | ✅ |

**结论**：本稿**符合 CLAUDE.md 红线 + docs/02-Prototype.md §16 全部自检项**。

---

## 14. 与现有文档的双向追溯

| 本稿章节 | 引用源 |
| --- | --- |
| §1 现状 | `src/app/api/conversations/route.ts` + `[id]/messages/route.ts` + `lib/ai/orchestrator.ts` v2.0.7.1 |
| §2 FSM | `docs/02-Prototype.md` §8.1（全局）+ §8.2（演练内部） |
| §3 API | `docs/05-API-Design.md` §9.6（演练 12 步端点）+ §3-5 通用约定 |
| §4 orchestrator 集成 | `src/lib/ai/orchestrator.ts` v2.0.7.1 + `prompts/unified.ts` |
| §5 持久化 | `src/lib/scripts-store.ts` pattern（globalThis 共享） |
| §6 危机联动 | `docs/design/T-09-crisis-fallback.md` §6.5（X-2 跨页面用例）+ §8.3.2（演练入口） |
| §7 步骤 11 联动 | `docs/05-API-Design.md` §9.4（scripts 端点） + T-11 |
| §8 错误码 | `docs/05-API-Design.md` §7 + 本稿 §8 |
| §9 代码 | 与现有 `route.ts` pattern 一致（`withTrace` + `withRateLimit` + `jsonError`） |
| §10 测试 | `src/lib/ai/orchestrator.test.ts` pattern（vitest） + `docs/07-Test-Plan.md` §19 |
| §11 风险 | `rules/safety.md` S-1~S-8 + T-09 §10 风险 |
| §13 红线 | `CLAUDE.md` §5 + `docs/02-Prototype.md` §16 |

---

## 15. Follow-up（不属本任务）

1. **T-05**（PE+A+BE）：AI 编排适配 12 步（每步人格注入；当前只有 step 9 调 LLM）。
2. **T-06**（FE+BE）：今日三件小事后端 + "必做 = 唯一发光节点" 映射。
3. **T-07**（FE+BE）：温和连击 + 休整日（drill 完成时累计 +1，**依赖本稿 §2.4 副作用清单**）。
4. **T-11**（FE+BE）：我的剧本 CRUD（**依赖本稿 §7 步骤 11 联动契约**）。
5. **T-15**（PE+Q）：评测集 v0.5 补 12 步用例 ≥ 30 条。
6. **T-16**（Q）：红线用例 + 拒绝清单自检（含本稿 5 个核心 case 的 e2e）。
7. **A + BE**：写 ADR-008（DrillSession schema for Supabase M3 迁移）。
8. **M3**：drill-store.ts 内存 → Supabase 迁移；FE 端 `/drill` 列表页。

---

> **本稿自检**：
> - 不修改 src/ 任何源代码 ✅
> - 不启动 dev server / npm test ✅
> - 产出物为 markdown 设计稿 ✅
> - 关键决策可回溯到 docs/02-Prototype.md v2.0.1 + docs/05-API-Design.md v1.1 + src/lib/ai/orchestrator.ts v2.0.7.1 ✅
> - 符合 CLAUDE.md 红线 + docs/02-Prototype.md §16 自检 ✅
> - 5 个核心 case 覆盖 happy path + 跳步 + 危机 + 暂停/恢复 + 终态只读 ✅
> - 关键代码片段 ≤ 150 行（route.ts step handler 约 130 行）✅

---

> **变更摘要**（v0.1 2026-06-17）：
> 1. 现状：复用 `intent_override='drill'` + 危机 L0 + StepOptions + process()，缺 12 步 FSM 层
> 2. FSM：12 步状态图 + 转移表 + 5 项不变量
> 3. API：3 端点（start / step / state）+ 详细请求/响应/错误码
> 4. orchestrator 集成：步骤 9 唯一 LLM 调点 + `skill_called` 扩展 step 维度
> 5. 持久化：M2 内存态（globalThis 共享）+ M3 Supabase 迁移计划
> 6. 危机联动：步骤 7/8 显式 detectCrisis，与 T-09 §8.3.2 对齐
> 7. 步骤 11 联动：内部 fetch `/api/scripts`，与 T-11 解耦
> 8. 错误码：5 个新错误码（NW-DR-0010~0014）+ 错误体 + 优先级
> 9. 代码：3 个 route.ts 核心 handler（≤ 150 行）
> 10. 测试：5 个核心 case 覆盖矩阵
> 11. 风险：P0 7 条 / P1 7 条 / P2 3 条
> 12. 3 个开放问题待 Coordinator 拍板
> 13. 红线自检 + 双向追溯 + 8 项 follow-up
