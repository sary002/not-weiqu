# T-03 · 12 步演练前端组件 · 设计稿

> **任务编号**：T-03（plans/m2-poc.md）
> **关联切片**：S-PoC-01 阿瑶的 1 次演练
> **关联用户故事**：S-PoC-01（阿瑶 12 步走完 → 加进我的剧本 → 进度 +1）
> **Owner（设计）**：FE
> **Reviewer**：C、PM、PE、KE、Q
> **阶段**：调研 + 设计（**不修改 src/ 下任何源代码**）
> **本稿状态**：待 Coordinator 审核
> **版本**：v0.1（2026-06-17）

---

## 0. 阅读须知

- 本稿只描述**形态、状态机前端视角、组件契约、JSX 骨架**。**不输出可运行代码、不动 src/ 任何文件**。
- 一切设计决策可回溯到 `docs/02-Prototype.md` v2.0.1（Jobs polish 已落地）+ `plans/m2-poc.md` T-03 + `docs/design/T-01-skill-tree-home.md` + `docs/design/T-09-crisis-fallback.md` + `agents/prompt-engineer/drafts/L3-01-refuse-coworker.md`。
- 与 `src/app/(app)/drill/page.tsx` 现状的差异，本稿**只描述、不修改**；如需改动源代码，由 Coordinator 批准后另立任务（避开本任务的"调研 + 设计"边界）。

---

## 1. 现状分析

### 1.1 当前 `drill/page.tsx` 形态（v2.0.5 / v2.0.6）

> 路径：`src/app/(app)/drill/page.tsx`（共 734 行）。

| 项 | 当前实现 | 评估 |
| --- | --- | --- |
| 12 步状态机 | `useState<StepNo>`（1..12） + 条件渲染各 `Step*` 组件 | ✅ 形态正确，单组件内集中状态 |
| 步骤切换 | `setStep(n)` 同步切换，**无 fade / 位移** | ⚠️ prototype §11 要求"切换 fade + 4px 位移 150ms"，**未实做** |
| 步骤标签 | `STEP_LABELS`（INTRO / 觉察 / 命名 / 需求 / 边界 / 开场 / 演练 / 应对 / 收束 / 演练后 / 保存 / OUTRO） | ✅ 与 prototype §6.4 对齐 |
| 进度指示器 | 12 个圆点 + "当前：{STEP_LABELS[step]}" | ✅ **polish P-02 已落地**：不写"7/12"，只写当前步骤名 |
| 暂停按钮 | 右上角 `<Pause>` icon + 文字"暂停" → `setPaused(true)` | ✅ 可达 |
| 暂停态 | 独立全屏覆盖：标题"歇一下" + 3 按钮 [继续 / 改天继续 / 直接退出] | ✅ **polish 符合 §7.3**：3 选项齐备，**无二次确认** |
| 退出按钮 | 仅在 `paused` 态下出现"改天继续 / 直接退出"；演练中**未提供**"直接退出"按钮 | ⚠️ 与 prototype §6.4 "退出 / 暂停 / 保存 三按钮全可达" 不完全对齐 |
| 底部 BottomNav | `drill/page.tsx` **未显式隐藏** BottomNav；当前 `BottomNav.tsx` 是 `(app)/layout.tsx` 常驻 → 演练页**也显示**底部 Tab | ⚠️ §6.4 形态暗示"演练全屏沉浸"，与底部 Tab 视觉竞争 |
| MultiChoice 组件 | `function MultiChoice`（内嵌在 `drill/page.tsx` 第 385-460 行） | ✅ 4 选 1 + "其他…" 兜底；步骤 3、4、6 复用 |
| Composer | **未复用**（演练是选项驱动，不需要自由输入） | ⚠️ 步骤 9 拿 AI 收束话术、步骤 7 "我要换一句" 走 `Step7` 自管 textarea |
| ChatBubble | **未复用**（演练是单屏选项，无多轮对话气泡） | ⚠️ 步骤 8 同事反驳用普通 `<div>` 卡片（非 ChatBubble） |
| 危机跳转 | `step === 9` 时 `fetchReply` → API 返回 `data.crisis === true` → `setCrisis(true)` → 渲染 `CrisisBanner` | ✅ 符合 T-09 设计稿：L0 命中后前端跳 `/crisis` |
| `intent_override: 'drill'` | `step === 9` 的 API 调用显式传 `intent_override: 'drill'` | ✅ v2.0.7.1 preRoutedIntent 跳过 Router，符合 T-04 |
| 草稿持久化 | `paused` 态文案"草稿已保存。下次进来会回到这一步。" 但**未实际写入 localStorage** | ❌ **缺**：`paused` 切换仅本会话内存态，刷新即丢 |
| 步骤 9 收束话术 | fetch `/api/conversations` 创建 conversation → `/messages` POST → 拿 `reply.try_this + next_step + acknowledge` 拼接 ≤ 60 字 | ✅ 形态对；fallback 链 `data.reply || data.userSays || opts.openers[0]` |
| 步骤 10"演练后" | `<Step10>` 显示"我刚刚练过了一次「{title}」" + "（默读一遍上面那句）" + [读完了] | ✅ polish P-04 落地：第一人称 |
| 步骤 11 保存 | `<Step11>` POST `/api/scripts` → 状态机 `idle/saving/saved/failed` → 失败可见反馈 | ✅ v2.0.6 fix；不静默 |
| 步骤 12 收束 | `<Step12>` "我刚刚练过了一次。" + [点头] 动作按钮 → 跳 `/progress` | ⚠️ polish §6.5 期望"回 `/today`"，当前跳 `/progress` 是 v1.0 路径 |
| 步骤 12 副按钮 | [加进我的剧本]（重复步骤 11 逻辑，不应再触发保存） + [回到成长路]（跳 `/today`） | ⚠️ "加进我的剧本" 在步骤 11 已完成，步骤 12 重复入口是冗余 |
| ARIA | `aria-label={'当前：' + STEP_LABELS[step]}` on 圆点容器；其余 button 无 aria-label | ⚠️ 步骤 9 缺 `aria-live="polite"`（saving/saved/failed 是但缺收束话术 streaming 时的可见性） |
| 焦点管理 | 步骤切换时**未自动 focus** 到下一步主按钮 | ⚠️ 键盘可达但不流畅 |
| 步骤 1"开始"按钮文案 | "开始" | ✅ polish P-10 已落地（去"演练"二字） |

### 1.2 现状总结

- **状态机、步骤结构、polish P-02 / P-04 / P-10 已落地**：核心形态与 prototype §6.4 对齐。
- **5 处未对齐**：
  1. 切换动效（fade + 位移 150ms）未实做；
  2. BottomNav 在演练页未隐藏（视觉竞争）；
  3. 草稿持久化未实做（仅内存 `paused`，刷新即丢）；
  4. 步骤 12 跳 `/progress`（v1.0）而非 `/today`（v2.0）；
  5. 步骤 12 重复"加进我的剧本"按钮（冗余）。
- **不修改源代码**：本稿仅描述目标态，实施由 Coordinator 批准后另立任务。

---

## 2. 12 步状态机 · 前端视角

### 2.1 全局状态枚举

| 状态 | 触发 | 进入方式 | 离开方式 | 备注 |
| --- | --- | --- | --- | --- |
| `INTRO` | 路由 `/drill?code=X` 加载 | 主页点节点 / 草稿恢复 | 点 [开始] → `STEP_2` | 显示场景卡 + 难度 + 估计时长 |
| `STEP_2` | 觉察 | `setStep(2)` | 选情绪 → `STEP_3` | 单选 `bodySignal` |
| `STEP_3` | 命名 | `setStep(3)` | 选情绪词 → `STEP_4` | `MultiChoice(emotions)` |
| `STEP_4` | 需求 | `setStep(4)` | 选想要 → `STEP_5` | `MultiChoice(wants)` |
| `STEP_5` | 边界 | `setStep(5)` | 双选填齐 → `STEP_6` | 双 `MultiChoice`（wills + wonts） + [下一步] |
| `STEP_6` | 开场 | `setStep(6)` | 选 opener → `STEP_7` | `MultiChoice(openers)` |
| `STEP_7` | 演练 | `setStep(7)` | 选变体或换一句 → `STEP_8` | `Step7`（变体列表 + "我要换一句" textarea） |
| `STEP_8` | 应对 | `setStep(8)` | 选 counter_reply → `STEP_9` | `Step8`（counter 引用 + 3 选 1） |
| `STEP_9` | 收束 | `setStep(9)` | useEffect fetchReply；读到 → `STEP_10` | 流式显示 1 句 30 字以内话术 |
| `STEP_10` | 演练后 | `setStep(10)` | 读完 → `STEP_11` | 默读一遍 + [读完了] |
| `STEP_11` | 保存 | `setStep(11)` | 保存/改天/跳过 → `STEP_12` | POST `/api/scripts` |
| `STEP_12` | OUTRO | `setStep(12)` | 用户主动离开（点头/回到成长路）→ `IDLE` | 收束页 |
| `PAUSED` | 用户点 [暂停] | `setPaused(true)` | [继续 / 改天继续 / 直接退出] | 草稿持久化 |
| `CRISIS` | API 返回 `data.crisis === true` | `setCrisis(true)` | `onSafe` → 回到中断步 | 跳 `<CrisisBanner>` |
| `LOADING` | `step === 9 && fetchReply in flight` | `setLoading(true)` | 收束话术到位 → `setLoading(false)` | 与 STEP_9 同态显示 |

### 2.2 状态机图（前端视角）

```
            ┌─[开始]── STEP_2
            │
[INTRO] ────┤
            │     ┌─[选项]── STEP_3 ─[选项]─ STEP_4 ─[双填齐]─ STEP_5
            │     │
            │     └─[暂停]── PAUSED ─[继续]─ STEP_N ──────┐
            │     │                                       │
            │     │                                       │
            │     │   ┌────[换一句]── Step7 textarea     │
            │     │   │                                  │
            │     │   STEP_7 ─[选变体]── STEP_8          │
            │     │                          │           │
            │     │                          ├─[选 reply] STEP_9
            │     │                          │           │
            │     │                          │  [fetch AI]
            │     │                          │           │
            │     │                          │   ┌──── API 返回 crisis? ──yes── CRISIS
            │     │                          │   │                                │
            │     │                          │  no                                │ [onSafe]
            │     │                          │   │                                ↓
            │     │                          │ STEP_9 ─[读到]─ STEP_10 ─[读完]─ STEP_11
            │     │                          │                                    │
            │     │                          │                                    ├─[保存成功]── STEP_12
            │     │                          │                                    ├─[失败]── 停留 STEP_11 重试
            │     │                          │                                    └─[跳过/改天]── STEP_12
            │     │                          │
            │     │                          │
            │     └─[直接退出]── IDLE (回到 /today，草稿持久化)
            │
            └── [改天继续]── IDLE (草稿保留，下次进 /today 顶部提示)
```

### 2.3 与全局状态机（docs/02-Prototype.md §8.1）的对齐

| prototype 状态 | 前端局部状态 | 对应 |
| --- | --- | --- |
| `IDLE` | 路由未进入 `/drill` | ✅ |
| `PRACTICE_INTRO` | `step === 1` | ✅ |
| `PRACTICE_ACTIVE` | `step ∈ [2..11]` | ✅ |
| `PRACTICE_PAUSED` | `paused === true` | ✅ |
| `PRACTICE_DONE` | `step === 12` | ✅ |
| `CRISIS` | `crisis === true` | ✅（跨页面一致，与 T-09 设计稿一致） |
| `ENDING` | 离开 `/drill` 回到 `/today` | ✅ |

### 2.4 草稿持久化契约（设计层）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `drill_draft.{code}` | `localStorage` key | 单 code 单草稿 |
| value | `{ step: number; stepName: string; data: StepState; pausedAt: ISOString }` | 暂停时持久化 |
| 读取时机 | `/drill` 加载时：若 `code` 命中草稿 + `pausedAt` 在 3 天内 → 自动跳到 `step` 提示"你有一次未完成的演练" | 3 天后归档为"过往的尝试"（**不计入**） |
| 写入时机 | `setPaused(true)` 时立即写入 | 强一致性 |
| 清除时机 | `step === 12` 完成时；用户选 [改天继续] → 保留；用户选 [直接退出] → 保留 | prototype §7.3 |

> **不变量**：草稿**不**写入服务器（M2 阶段），仅 `localStorage`；M3 接入 Supabase 后由 BE 接管。

---

## 3. 步骤切换 UI

### 3.1 MultiChoice 组件（已存在，待提升）

> 当前位置：`drill/page.tsx:385-460`。

#### 3.1.1 现状

```tsx
// 4 选 1 + "其他…" 兜底（自由输入）
// 选中态：border-primary + bg-primary-soft
// 未选中态：border-border + bg-surface + hover:border-primary/40
// "其他…" 展开后：textarea + [用这个] 按钮
```

#### 3.1.2 设计意图（与 prototype §6.4 一致）

- **必填**：单选 → 选中后**自动进入下一步**（不显示 [下一步] 按钮）。
- **"其他…" 兜底**：永远可点；展开 textarea 后**不自动收起**，避免误触。
- **回退**：步骤切换**不记录历史栈**（不实现浏览器前进/后退）；如需修改，用户在 `Step7` 自管 textarea 即可。
- **键盘可达**：`Tab` 顺序 = 预设选项 → "其他…" → textarea → [用这个]；`Enter` 提交（textarea 内 `Cmd+Enter`）。

#### 3.1.3 不复用 Composer / ChatBubble 的理由

| 组件 | 复用场景 | 演练是否复用 | 理由 |
| --- | --- | --- | --- |
| `Composer` | 自由对话 / 危机页的文本输入 | ❌ | 演练是**选项驱动**，步骤 9 收束话术是 LLM 流入而非用户输入 |
| `ChatBubble` | 多轮对话气泡 | ❌ | 步骤 8 同事反驳 + 步骤 9 收束话术是**单卡片**（非气泡堆叠） |
| `CrisisBanner` | 兜底页 | ✅ 已复用 | 危机跳转时全屏覆盖 |

> 步骤 9 的"我刚刚可以这样开始用它"卡片，**视觉上**与 `ChatBubble` 同型（圆角 + 底色），但**语义**上是收束话术，**不是对话**。建议 FE 在 polish 时考虑把 `ChatBubble` 抽出一个 `<NarrativeCard variant="calm">` 子组件（不做本任务）。

### 3.2 步骤切换动效（prototype §11 未实做）

| 触发 | 动效 | 时长 | 限制 |
| --- | --- | --- | --- |
| `step` 变化 | 当前卡片 fade-out 50ms → 下一卡片 fade-in + 4px 上移 | 150ms 总长 | `motion-safe:` 前缀，遵守 `prefers-reduced-motion` |
| 选项点击 | 选中态 bg 渐变到 primary-soft | 100ms | 同上 |
| 步骤 9 fetch | 流式显示：每 50ms 字符 fade-in | 直到收束 | 与 ChatBubble 流式一致（M2+ 接 SSE 后启用） |

> 当前 `drill/page.tsx` **无动效**——本稿仅描述目标态，**不修改源代码**。

### 3.3 步骤切换的键盘焦点

| 触发 | focus 目标 | 理由 |
| --- | --- | --- |
| 进入 STEP_N（N ≥ 2） | 步骤标题 `<h2>` + `tabIndex={-1}` | 屏幕阅读器立即读出当前步骤名 |
| 进入 STEP_5（双选） | "下一步" 按钮 | 双填齐后才出现 |
| 进入 STEP_9 | 收束话术卡片（`aria-live="polite"`） | 流式显示可达 |
| 进入 STEP_11 | [加进我的剧本] 按钮 | 默认态就是首选动作 |
| 进入 STEP_12 | [点头] 按钮 | polish P-05 落地 |
| `crisis === true` | `<CrisisBanner>` 内部热线第 1 条 | T-09 设计稿 §3.6：键盘用户最快拨出 |

### 3.4 步骤内容契约（与 PE L3-01 草稿对接）

| 步骤 | 组件 | 数据来源 | PE 草稿字段 |
| --- | --- | --- | --- |
| 1 INTRO | `Step1` | `scenario.title + scenario.one_liner` | L3-01 §0 "今天下班前 5 分钟..." |
| 2 觉察 | `Step2`（hard-coded 6 选项） | 固定选项 | — |
| 3 命名 | `MultiChoice` | `opts.emotions` | L3-01 §1.1：`['胸闷','焦虑','委屈','烦躁']` |
| 4 需求 | `MultiChoice` | `opts.wants` | L3-01 §1.2 |
| 5 边界 | `Step5`（双 MultiChoice） | `opts.wills + opts.wonts` | L3-01 §1.3 + §1.4 |
| 6 开场 | `MultiChoice` | `opts.openers` | L3-01 §1.5 |
| 7 演练 | `Step7`（变体 + textarea） | `opts.user_says_variants + data.opener` | L3-01 §1.6 |
| 8 应对 | `Step8`（counter 引用 + 3 选 1） | `opts.counter + opts.counter_replies` | L3-01 §1.7 + §1.8 |
| 9 收束 | `Step9`（流式 fetch） | API `/api/conversations/[id]/messages` 返回 `reply` | L3-01 §1.9 fallback 字段（**待 A 审议**） |
| 10 演练后 | `Step10`（默读引导） | 固定文案 + `scenario.title` | — |
| 11 保存 | `Step11`（POST `/api/scripts`） | `data.reply` + `scenario.title + sceneTag` | — |
| 12 OUTRO | 收束页（polish P-04 / P-05） | `data.reply` 兜底链 | — |

> **PE L3-01 §1.9 待办**：`fallback` 字段当前**不在 `StepOptions` 接口**；当前实现用 `opts.openers[0]` 兜底（`drill/page.tsx:111`）。**建议**：BE 在 `/scenarios/:code/fallback` 端点统一返回 fallback（与 KE 一致），FE 不改 `StepOptions`。

---

## 4. 与 SkillNode.tsx 的关系（演练进度反馈到技能树）

### 4.1 反馈方向

```
SkillNode.tsx（主页）                    drill/page.tsx（演练）
  │                                          │
  ├─ user click node                         │
  │   ↓ href={`/drill?code=${code}`}        │
  │                                          ├─ useEffect: step === 1 → INIT
  │                                          │
  │                                          ├─ step === 9 → fetchReply
  │                                          │
  │                                          ├─ step === 12 → practiced++
  │                                          │
  │                                          ├─ localStorage: drill_draft.{code}
  │                                          │
  │                                          ↓
  ├─ router.back() / link to /today         │
  │                                          │
  └─ today/page.tsx revalidate              │
      ├─ read localStorage.drill_draft       │
      └─ computeSkillStatus(skill, ctx)     │
         ├─ if draftStep && !expired → in_progress
         └─ if practiced >= 1 → mastered_basic
```

### 4.2 关键不变量

1. **演练完成（step === 12）→ 节点 mastered_basic**：无需手动通知 FE 主页；通过 localStorage `drill_progress.{code} = { practiced: N }` 共享。
2. **草稿持久化 → 节点 in_progress**：通过 `drill_draft.{code}` 共享。
3. **唯一发光规则不受影响**：草稿节点 `in_progress` 时不与 `recommended` 冲突；同一节点**不能同时**是 `in_progress` 和 `recommended`（状态机互斥）。

### 4.3 接口边界

| 数据 | 写入方 | 读取方 | 存储位置 |
| --- | --- | --- | --- |
| `practiced` | `drill/page.tsx` 步骤 12 | `today/page.tsx` `computeSkillStatus` | `localStorage.drill_progress.{code}` |
| `draftStep` | `drill/page.tsx` `setPaused(true)` | `today/page.tsx` + 主页顶部草稿提示 | `localStorage.drill_draft.{code}` |
| `practiced_at` | `drill/page.tsx` 步骤 12 | `progress/page.tsx` "我 → 进度" | 同上 |
| `current_opener` | `drill/page.tsx` 步骤 6 / 7 | `scripts/page.tsx` 步骤 11 保存 | 通过 `/api/scripts` 落库 |

### 4.4 与 T-01 设计稿的接口契约

| T-01 字段 | T-03 写入触发 | 写入值 |
| --- | --- | --- |
| `practiced` | step === 12 完成 | `localStorage.drill_progress.{code}.practiced++` |
| `draftStep` | `setPaused(true)` | `{ stepIndex, stepName }`（**类型扩展**见 T-01 §3.3） |
| `draftStep.expired` | 主页读取时计算 | `now - pausedAt > 3d` → 归档为"过往的尝试"，不计入 |
| `status === 'mastered_basic'` | step === 12 完成 + practiced === 1 | 当前节点降级 + 顶部温和连击 +1 |

> T-03 **不修改** `SkillNode.tsx` 或 `today/page.tsx`；本稿只描述数据契约。落地时由 Coordinator 批准后另立任务。

---

## 5. 顶部进度条设计

### 5.1 形态（与 prototype §6.4 对齐 · polish P-02 已落地）

```
┌─ 回到成长路 ────────────── [● ● ● ● ● ● ● ○ ○ ○ ○ ○] 当前：应对 ─────── [⏸ 暂停] ─┐
```

| 元素 | 设计 | 与 prototype §6.4 对照 |
| --- | --- | --- |
| 左：回到成长路 | `<Link href="/today">` + `<ArrowLeft>` + 小字 | ✅ |
| 中：12 个圆点 + 当前步骤名 | 当前实现已落地（`drill/page.tsx:213-220`） | ✅ polish P-02：**不写"7/12"**，只写"当前：应对" |
| 右：暂停 | `<button>` + `<Pause>` icon + "暂停" 文字 | ✅ |

### 5.2 进度条视觉规范

| 项 | 值 | 理由 |
| --- | --- | --- |
| 圆点尺寸 | `h-1.5 w-1.5` | 与 T-01 SkillNode 一致 |
| 当前圆点 | `bg-primary`（靛蓝） | 与 prototype §4.1 Primary 一致 |
| 未到圆点 | `bg-border`（中性灰） | 不抢眼 |
| 步骤名 | `text-xs text-neutral-500` | 次要层级 |
| `aria-label` | `'当前：' + STEP_LABELS[step]` | 当前实现已落地 |

### 5.3 关键决策：**不显示"5/12"**

> 与 prototype polish P-02 一致：圆点本身已传达进度；当前步骤用文字标识（"当前：应对"）。

**理由**：

1. 数字会制造"还有 X 步"的时间压力（与 prototype §2 P4 "可中断 > 强推进" 反向）。
2. 圆点本身是视觉进度的**隐喻**（用户无需精确知道"还差几步"）。
3. polish P-02 已在 `drill/page.tsx:219` 落地（"当前：{STEP_LABELS[step]}"）。

### 5.4 与 T-01 SkillNode 的进度表示差异

| 页面 | 进度表示 | 含义 |
| --- | --- | --- |
| 主页 SkillNode（in_progress） | "练到 觉察"（步骤名） | **未做步骤数**，仅步骤名 |
| 演练页 顶部 | "当前：应对"（步骤名） | **当前在第几步**（圆点辅助） |
| 演练页 圆点 | 12 个圆点 | **已完成到第几步** |

> 三处都用"步骤名"传达进度，避免数字。这是 T-01 与 T-03 的**统一进度语态**。

---

## 6. 暂停 / 退出交互设计

### 6.1 暂停（**符合 prototype §7.3 + S-6 不二次确认**）

#### 6.1.1 暂停按钮（任意步骤可达）

```
[⏸ 暂停]   ← 右上角常驻，text-xs text-neutral-500
```

- **位置**：顶部进度条右侧。
- **触发**：任意步骤点 [暂停] → `setPaused(true)` + 写 `localStorage.drill_draft.{code}`。
- **无二次确认**：符合 prototype §7.3 + `rules/safety.md` S-6 设计红线（不催促）。

#### 6.1.2 暂停态全屏覆盖

```
┌────────────────────────────────────────┐
│                                        │
│         歇一下                         │
│                                        │
│   草稿已保存。下次进来会回到这一步。    │
│                                        │
│   [ 继续 ]          ← 主按钮           │
│   [ 改天继续 ]      ← 次按钮           │
│   [ 直接退出（不计入进度） ] ← 文字按钮 │
│                                        │
└────────────────────────────────────────┘
```

> 当前 `drill/page.tsx:134-164` 已实做；**polish 已落地**。

### 6.2 退出设计（**关键决策：演练中不显示"直接退出"，仅在 `paused` 态提供**）

#### 6.2.1 现状与 prototype 对齐

| 维度 | 当前实现 | prototype §6.4 期望 | 评估 |
| --- | --- | --- | --- |
| 演练中"直接退出" | ❌ 未提供（仅"暂停"按钮） | 退出 / 暂停 / 保存 三按钮全可达 | ⚠️ 不全 |
| 暂停态"直接退出" | ✅ 在 `paused` 屏底部 [直接退出] | §7.3 "改天继续" / "直接退出" 二选一 | ✅ |

#### 6.2.2 设计意图

**不**在演练中直接显示 [直接退出]，理由：

1. **演练 12 步本身 ≤ 3 分钟**（prototype §6.4 时间估算），"中途退出"成本远低于"暂停 + 退出两步"。
2. 演练中加 [直接退出] 会制造"我是不是该放弃了"的暗示（与 prototype §2 P4 "可中断 > 强推进" 反向）。
3. **真实退出路径** = 暂停 → 直接退出，二步可达，仍在 5 秒内完成。

**如 Coordinator 决定演练中需 [直接退出]**：建议位置在 [暂停] 旁（次级文字按钮），文案"先停一下"，按下后**先**进暂停态，让用户**再确认**。

### 6.3 退出路径收敛

| 入口 | 跳转目标 | 草稿处理 | 计入进度 |
| --- | --- | --- | --- |
| `paused` 态 [继续] | 回到暂停步 | 保留 | — |
| `paused` 态 [改天继续] | `/today` | 保留（> 3 天归档） | 不计入 |
| `paused` 态 [直接退出] | `/today` | 保留 | 不计入 |
| 顶部 [回到成长路] | `/today` | 保留（不调用 `setPaused`） | 不计入（演练未完成） |
| Step12 [点头] | `/progress`（⚠️ 应改 `/today`，见 §11.2） | 清除（演练完成） | 计入（practiced++） |
| Step12 [回到成长路] | `/today` | 清除 | 计入 |
| Crisis [我现在安全] | 回到中断步 | 保留 | — |

### 6.4 与 S-6 设计红线的一致性

> `rules/safety.md` S-6：退出 / 暂停 / 保存**永远 3 按钮可达**，**不二次确认**。

| 项 | 设计 | S-6 一致 |
| --- | --- | --- |
| 暂停 | 任意步 1 键可达，无确认 | ✅ |
| 退出 | 暂停态 [直接退出]，无确认 | ✅ |
| 保存 | 步骤 11 + 步骤 12（重复）共 2 个入口，无确认 | ✅ |
| 不二次确认 | 演练中所有"破坏性"操作无 `confirm()` 弹窗 | ✅ |

---

## 7. 步骤 7-8 危机触发跳转

### 7.1 触发链路

```
[STEP_7] 用户输入 "我要换一句" textarea 内容触发危机词
[STEP_8] counter_replies 选项之一或用户的二次输入
        ↓
[Step7.onPick / Step8.onPick] → setData → setStep
        ↓
   ⚠ 当前实现：步骤 7/8 不调 API，**无法在 client-side 检测危机**
```

> **关键 gap**：当前 `drill/page.tsx` 步骤 7/8 **不调用** `/api/conversations/[id]/messages`；危机检测**只在步骤 9**（`fetchReply`）时进行。
> 详见 `drill/page.tsx:60-121`：仅 `fetchReply` 调 API，**无 `crisis-detector.ts` 前置**。

### 7.2 与 T-09 设计稿的接口

> T-09 §8.3.2：演练步骤 7 角色扮演 → 用户回"我被你搞得想死" → API 返回 `crisis: true` → 跳 `/crisis`。

**本稿与 T-09 设计稿的不一致**：

| T-09 期望 | T-03 现状 | 评估 |
| --- | --- | --- |
| 步骤 7/8 走 API → L0 检测 | 不走 API，仅本地切换 | ⚠️ **M2 PoC 范围**：步骤 7/8 是**选项点击**，无 API 调用 → **无法触发 L0** |
| 步骤 11 保存前可触发 | 步骤 11 调用 `/api/scripts`，**不调** conversation API | ⚠️ **同样无法触发 L0** |
| 步骤 9 fetchReply | ✅ 走 API | ✅ L0 命中 |

**M2 PoC 决策建议**：

- **接受 M2 范围内缺口**：步骤 7/8 / 11 不触发危机路径（M2 阶段靠 prototype §7.3 "退出" 兜底）。
- **T-09 X-2 / X-3 / X-4 跨页面用例**（演练步骤 7 / 剧本保存 / 步骤 11 保存前触发）**列为 follow-up**，M3 实施时给步骤 7/8/11 加 client-side L0 检测或额外 API 调用。
- **本稿不实做**：遵循"调研 + 设计稿"边界。

### 7.3 步骤 9 危机跳转（已落地）

```
step === 9
  ↓ useEffect → fetchReply()
  ↓
POST /api/conversations (create drill conversation)
  ↓
POST /api/conversations/[id]/messages (with intent_override='drill')
  ↓
msgJson.data.crisis === true
  ↓
setCrisis(true)
  ↓
render <CrisisBanner onSafe={() => setCrisis(false)} />
```

> 与 T-09 设计稿 §8.3.2 一致；`onSafe` 回调 `setCrisis(false)` → 回到中断步。

### 7.4 跨页面一致性（与 T-09 §8.4 对照）

| 不变量 | T-03 实现 | 通过 |
| --- | --- | --- |
| 演练入口走同一 `process()` 入口（API 路由） | ✅ `/api/conversations/[id]/messages` 统一 | ✅ |
| 跳 `/crisis` 后显示同一份 `CrisisBanner` | ✅ 单组件，props `onSafe` | ✅ |
| 危机时不丢失草稿 | ⚠️ `paused` 草稿未持久化（`crisis` 触发时无 `setPaused`） | ⚠️ follow-up：建议 `setCrisis` 时同步写 localStorage |
| 危机后回到原页面 | ✅ `onSafe` → `setCrisis(false)` → 回到 STEP_9 | ✅ |
| 触发 Q 审计事件 | ⚠️ trace_id 上报到 console（M2 占位） | ⚠️ T-09 follow-up F-4 |

---

## 8. 步骤 11 保存"加进我的剧本"按钮（与 T-11 接口）

### 8.1 步骤 11 形态

```
┌────────────────────────────────────────────────┐
│  把这句话加进我的剧本？                          │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │ 今晚我有安排了，做不完的部分明天上午我     │  │
│  │ 处理完会同步给你。                         │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  [加进剧本]   [改天]   [跳过]                   │
│                                                │
│  （saving 状态：存着… / 已存 / 没存上…）         │
└────────────────────────────────────────────────┘
```

### 8.2 API 契约（`POST /api/scripts`）

**请求**：

```ts
{
  title: string,           // scenario.title · '拒绝同事甩活'
  scene_tag: string,       // scenario.scene_tags[0] · 'workplace'
  content: string,         // data.reply || opts.openers[0]
}
```

**响应**：

```json
{
  "data": {
    "id": "uuid",
    "title": "...",
    "scene_tag": "workplace",
    "content": "...",
    "created_at": "ISO8601"
  }
}
```

### 8.3 状态机（前端视角）

```
[idle]  ─点 [加进剧本]──→ [saving]  ─成功──→ [saved]   ─onNext(true)──→ STEP_12
                                       ─失败──→ [failed]（停留 STEP_11，可重试 / 跳过）
[idle]  ─点 [改天]─────→ [saving] skipped ─→ onNext(false) ──→ STEP_12
[idle]  ─点 [跳过]─────→ onNext(false) ──→ STEP_12
```

### 8.4 与 T-11 设计稿的接口边界

| T-11 任务 | 期望 | T-03 现状 | 边界 |
| --- | --- | --- | --- |
| T-11 路径 `/scripts` | 列已存剧本 | 与 T-03 无关 | ✅ |
| T-11 POST `/api/scripts` | 入库 + 列表新增 | T-03 步骤 11 调此端点 | ✅ |
| T-11 提升为底部 Tab | 4 Tab（今日/自由对话/我的剧本/我） | T-03 不涉及 Tab 改动 | ✅ |
| T-11 字段约束 | `title + scene_tag + content` | T-03 步骤 11 入参一致 | ✅ |

> **不变量**：T-03 步骤 11 保存的剧本 = T-11 `/scripts` 页展示的同一份数据。

### 8.5 步骤 12 重复 [加进我的剧本] 按钮的处理

> 当前实现 `drill/page.tsx:185-200` 在步骤 12 渲染了 [加进我的剧本] 按钮（跳 `/scripts`），但**不再触发保存**（已在步骤 11 完成）。

**建议（不修改源代码）**：

- 步骤 12 的 [加进我的剧本] 按钮**仅作导航**（跳 `/scripts`），不重复触发 API。
- 文案改为 [去我的剧本看]（更明确），与步骤 11 的 [加进剧本] 区分。
- 若步骤 11 选 [跳过]，步骤 12 仍可二次触发保存（即步骤 12 才有真正的"再补救"机会）——**建议保留**当前实现作为兜底，但需明确文案。

> 本稿仅描述设计意图，落地由 Coordinator 批准后另立任务。

---

## 9. 关键代码片段（`drill/page.tsx` 核心结构，≤ 250 行）

> ⚠️ 本片段是**设计稿占位**（仅作形态与结构示意），**不直接落地到 src/**。落地时由 Coordinator 批准后另立实施任务。

```tsx
// ===== 类型 =====
type StepNo = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

interface StepState {
  bodySignal?: string;   // STEP_2
  emotion?: string;      // STEP_3
  iWant?: string;        // STEP_4
  iWill?: string;        // STEP_5
  iWont?: string;        // STEP_5
  opener?: string;       // STEP_6
  userSays?: string;     // STEP_7
  counter?: string;      // STEP_8
  reply?: string;        // STEP_8/9
}

// ===== 步骤常量 =====
const STEP_LABELS: Record<StepNo, string> = {
  1: 'INTRO', 2: '觉察', 3: '命名', 4: '需求', 5: '边界',
  6: '开场', 7: '演练', 8: '应对', 9: '收束', 10: '演练后',
  11: '保存', 12: 'OUTRO',
};

const DRAFT_KEY = (code: string) => `drill_draft.${code}`;
const PROGRESS_KEY = (code: string) => `drill_progress.${code}`;

// ===== 主组件 =====
function DrillInner() {
  const router = useRouter();
  const search = useSearchParams();
  const code = search.get('code') || 'workplace-shifting';
  const scenario = useMemo(() => scenarios.find((s) => s.code === code) || scenarios[0], [code]);
  const opts = useMemo<StepOptions>(() => getScenarioOptions(code), [code]);

  // ===== 状态 =====
  const [step, setStep] = useState<StepNo>(1);
  const [data, setData] = useState<StepState>({});
  const [crisis, setCrisis] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(false);

  // ===== 草稿加载（M2 阶段仅 localStorage）=====
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY(code));
      if (!raw) return;
      const draft = JSON.parse(raw) as { step: StepNo; data: StepState; pausedAt: string };
      const ageDays = (Date.now() - new Date(draft.pausedAt).getTime()) / 86400000;
      if (ageDays > 3) {
        localStorage.removeItem(DRAFT_KEY(code));
        return;
      }
      setStep(draft.step);
      setData(draft.data);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // ===== 草稿持久化 =====
  useEffect(() => {
    if (paused) {
      try {
        localStorage.setItem(DRAFT_KEY(code), JSON.stringify({
          step, data, pausedAt: new Date().toISOString(),
        }));
      } catch {}
    }
  }, [paused, code, step, data]);

  // ===== API: 步骤 9 收束 =====
  const fetchReply = async () => {
    if (data.reply) return;
    setLoading(true);
    try {
      const createRes = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'drill' }),
      });
      const createJson = await createRes.json();
      const conversationId = createJson?.data?.id as string | undefined;
      if (!conversationId) { setData((d) => ({ ...d, reply: opts.openers[0] })); return; }
      const msgRes = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content: `我刚刚练完「${scenario.title}」：我${data.iWant || ''}，我${data.iWill || ''}，我${data.iWont || ''}。我刚刚说出口的是：${data.userSays || ''}。请给我一句 30 字以内的平静话术。`,
          client_msg_id: crypto.randomUUID(),
          intent_override: 'drill',
          scenario: scenario.title,
        }),
      });
      const msgJson = await msgRes.json();
      if (msgJson?.data?.crisis) { setCrisis(true); return; }
      const reply = msgJson?.data?.reply;
      const oneLine = [reply?.try_this, reply?.next_step, reply?.acknowledge].filter(Boolean).join(' ').slice(0, 60);
      setData((d) => ({ ...d, reply: oneLine || data.userSays || opts.openers[0] }));
    } catch {
      setData((d) => ({ ...d, reply: data.userSays || opts.openers[0] }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (step === 9) void fetchReply(); }, [step]); // eslint-disable-line

  // ===== 路由: 危机 =====
  if (crisis) {
    // 同时持久化草稿，避免危机返回后丢失
    try { localStorage.setItem(DRAFT_KEY(code), JSON.stringify({ step, data, pausedAt: new Date().toISOString() })); } catch {}
    return <CrisisBanner onSafe={() => { setCrisis(false); /* 回到 STEP_9 */ }} />;
  }

  // ===== 路由: 暂停 =====
  if (paused) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <h2 className="text-lg font-medium">歇一下</h2>
        <p className="mt-2 text-sm text-neutral-500">草稿已保存。下次进来会回到这一步。</p>
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" onClick={() => setPaused(false)} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">继续</button>
          <button type="button" onClick={() => router.push('/today')} className="rounded-md border border-border bg-background px-4 py-2 text-sm">改天继续</button>
          <button type="button" onClick={() => router.push('/today')} className="rounded-md border border-border bg-background px-4 py-2 text-sm text-neutral-500">直接退出（不计入进度）</button>
        </div>
      </div>
    );
  }

  // ===== 路由: OUTRO =====
  if (step === 12) {
    const finalLine = data.reply || data.userSays || data.opener || opts.openers[0];
    // 完成时清除草稿 + 推进 practiced
    try {
      localStorage.removeItem(DRAFT_KEY(code));
      const prev = parseInt(localStorage.getItem(PROGRESS_KEY(code)) || '0', 10);
      localStorage.setItem(PROGRESS_KEY(code), String(prev + 1));
    } catch {}
    return (
      <div className="mx-auto max-w-md py-12">
        <h1 className="text-2xl font-semibold">我刚刚练过了一次。</h1>
        <div className="mt-6">
          <button type="button" onClick={() => router.push('/today')} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Check className="h-4 w-4" aria-hidden />点头
          </button>
        </div>
        <div className="mt-8 rounded-xl border border-border bg-surface p-5 text-sm">
          <div className="text-xs text-neutral-500">我刚刚可以这样开始用它：</div>
          <p className="mt-2 leading-relaxed">{finalLine}</p>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => router.push('/scripts')} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs">去我的剧本看</button>
          <button type="button" onClick={() => router.push('/today')} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs">回到成长路</button>
        </div>
        <p className="mt-6 text-xs text-neutral-500">下次想练就练。</p>
      </div>
    );
  }

  // ===== 主体: 步骤渲染 =====
  return (
    <div className="mx-auto max-w-2xl pb-24">
      {/* 顶部进度条 */}
      <div className="mb-4 flex items-center justify-between">
        <Link href="/today" className="text-xs text-neutral-500 hover:text-foreground">
          <ArrowLeft className="inline h-3 w-3" /> 回到成长路
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex gap-1" aria-label={'当前：' + STEP_LABELS[step]}>
            {Array.from({ length: 12 }).map((_, i) => {
              const cls = i + 1 <= step ? 'h-1.5 w-1.5 rounded-full bg-primary' : 'h-1.5 w-1.5 rounded-full bg-border';
              return <span key={i} aria-hidden className={cls} />;
            })}
          </div>
          <span className="text-xs text-neutral-500">当前：{STEP_LABELS[step]}</span>
        </div>
        <button type="button" onClick={() => setPaused(true)} className="text-xs text-neutral-500 hover:text-foreground" aria-label="暂停演练">
          <Pause className="inline h-3 w-3" /> 暂停
        </button>
      </div>

      {/* 场景元信息 */}
      <h1 className="text-lg font-semibold">{scenario.title}</h1>
      <p className="mt-1 text-xs text-neutral-500">{scenario.layer} · 估计 3 分钟</p>

      {/* 当前步骤内容（条件渲染） */}
      <div className="mt-6">
        {step === 1 && <Step1 scenario={scenario} onStart={() => setStep(2)} />}
        {step === 2 && <Step2 value={data.bodySignal} onPick={(v) => { setData((d) => ({ ...d, bodySignal: v })); setStep(3); }} />}
        {step === 3 && <MultiChoice prompt="用一个词命名这个情绪：" options={opts.emotions} value={data.emotion} onPick={(v) => { setData((d) => ({ ...d, emotion: v })); setStep(4); }} />}
        {step === 4 && <MultiChoice prompt="我想要：" options={opts.wants} value={data.iWant} onPick={(v) => { setData((d) => ({ ...d, iWant: v })); setStep(5); }} />}
        {step === 5 && <Step5 wills={opts.wills} wonts={opts.wonts} will={data.iWill} wont={data.iWont} onChange={(f, v) => setData((d) => ({ ...d, [f]: v }))} onNext={() => setStep(6)} />}
        {step === 6 && <MultiChoice prompt="我可以这样开始：" options={opts.openers} value={data.opener} onPick={(v) => { setData((d) => ({ ...d, opener: v })); setStep(7); }} />}
        {step === 7 && <Step7 variants={opts.user_says_variants} opener={data.opener || ''} onNext={(t) => { setData((d) => ({ ...d, userSays: t })); setStep(8); }} />}
        {step === 8 && <Step8 counter={opts.counter} replies={opts.counter_replies} onPick={(c, r) => { setData((d) => ({ ...d, counter: c, reply: r })); setStep(9); }} />}
        {step === 9 && <Step9 loading={loading} reply={data.reply} onNext={() => setStep(10)} />}
        {step === 10 && <Step10 scenarioTitle={scenario.title} onNext={() => setStep(11)} />}
        {step === 11 && <Step11 reply={data.reply || data.userSays || data.opener || opts.openers[0] || ''} title={scenario.title} sceneTag={scenario.scene_tags[0] || 'workplace'} onNext={() => setStep(12)} />}
      </div>
    </div>
  );
}

// ===== 子组件 (Step1 / Step2 / MultiChoice / Step5 / Step7 / Step8 / Step9 / Step10 / Step11) =====
// 略 — 与当前实现一致，仅本主组件结构示意。
// 完整行数（含子组件）约 350 行；本主组件骨架约 150 行。
```

> 行数：主组件骨架约 150 行（含类型、常量、状态、effect、4 个早返路由、主渲染）。完整 `drill/page.tsx` 含子组件约 350 行（≤ 250 行预算**仅主骨架**满足）。

---

## 10. 与 BottomNav 的关系

### 10.1 现状

> `BottomNav.tsx` 是 `(app)/layout.tsx` 常驻组件，**所有** `(app)/*` 路由都显示底部 Tab。
> 当前 `drill/page.tsx` **未隐藏** BottomNav → 演练页底部也显示 4 Tab。

### 10.2 与 prototype §6.4 的张力

| prototype §6.4 期望 | 当前实现 | 评估 |
| --- | --- | --- |
| 演练全屏沉浸，底部 Tab 不抢眼 | BottomNav `sticky bottom-0` 抢眼 | ⚠️ 视觉竞争 |
| 用户从 `/today` 进入演练后专心 12 步 | 底部仍显示 4 Tab，可一键跳走 | ⚠️ **可能引导用户提前退出**（与 prototype P4 反向） |

### 10.3 设计决策：演练页**隐藏** BottomNav

**建议**（不修改源代码）：

1. **方案 A**（推荐）：`(app)/layout.tsx` 检测 `pathname === '/drill'` → 不渲染 `<BottomNav />`。
2. **方案 B**：`drill/page.tsx` 用 CSS `pb-24`（当前已加）撑开底部空间，但**保留** BottomNav —— 优点：用户可一键退出到底部 Tab；缺点：与沉浸感冲突。
3. **方案 C**：演练中 BottomNav **半透明 + 缩小**（仅留退出入口）—— 折中方案，需新增 prop。

**本稿推荐方案 A**：
- **理由**：prototype §6.4 演练线框**没有**底部 Tab；polish §18.1 B1 "可中断" ≠ "鼓励切换"。
- **退出路径**：演练页**自身**提供 [回到成长路]（左上）和 [暂停]（右上），足够。
- **实施成本**：`(app)/layout.tsx` 增加 `usePathname()` 判断即可，约 5 行。

> 本稿不修改源代码；落地由 Coordinator 批准后另立任务。

### 10.4 与 `(app)/layout.tsx` 的契约

| 路由 | BottomNav | GlobalHeader | 演练专属元素 |
| --- | --- | --- | --- |
| `/today` | ✅ | ✅ | — |
| `/drill` | ❌ | ✅ | 演练专属顶部（[回到成长路] + 圆点 + [暂停]） |
| `/conversation` | ✅ | ✅ | — |
| `/scripts` | ✅ | ✅ | — |
| `/progress` | ✅ | ✅ | — |
| `/settings` | ✅ | ✅ | — |
| `/crisis` | ❌ | ❌ | 兜底页全屏（已实做） |
| `/onboarding` | ❌ | ❌ | 入门页全屏 |

---

## 11. 风险点

### 11.1 P0 风险（必避）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-01 草稿丢失** | `paused` 仅内存态，刷新即丢 | 本稿设计已实做 localStorage（实施时落地）；3 天归档 |
| **R-02 步骤 7/8 危机漏触发** | 选项驱动不调 API，L0 不生效 | T-09 X-2/X-3 follow-up；M2 接受 |
| **R-03 步骤 12 跳 `/progress`** | 与 v2.0 期望跳 `/today` 不符 | polish P-04 配套：本稿建议改 `/today` |
| **R-04 步骤 12 重复 [加进我的剧本]** | 步骤 11 已保存，步骤 12 再显示入口冗余 | 本稿建议改 [去我的剧本看] |
| **R-05 切换无动效** | prototype §11 要求 fade + 4px 位移 | `motion-safe:` 落地 |
| **R-06 BottomNav 抢眼** | 演练页未隐藏，视觉竞争 | §10.3 方案 A |

### 11.2 P1 风险（follow-up）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-07 步骤切换键盘焦点** | 当前无自动 focus | §3.3 焦点契约；键盘可达但不流畅 |
| **R-08 步骤 9 流式显示** | 当前一次性显示 | M2+ 接 SSE 后启用流式 |
| **R-09 步骤 12 跳 `/today` vs `/progress`** | 当前跳 `/progress`（v1.0） | 待 Coordinator 拍板；本稿建议 `/today`（polish P-04 配套） |
| **R-10 步骤 11 失败重试 UX** | 当前停留在 STEP_11，无重试按钮 | 本稿建议加 [再试一次] |
| **R-11 MultiChoice 选中后自动跳下一步** | 当前实现已落地，但无"撤销" | 不做撤销（prototype §6.4 "可跳过" 通过"其他…" 兜底） |
| **R-12 Step7 textarea 边界** | 当前无字数限制 | prototype §6.4 "练习而非评判"——字数不限，避免限制 |

### 11.3 P2 风险（远期）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-13 步骤 9 fallback 内容** | LLM 异常时降级到 `data.userSays \|\| opts.openers[0]` | 当前实现已落地；M2+ 可引入更多 fallback 链路 |
| **R-14 草稿 3 天归档文案** | 用户 3 天后回来，草稿不见，无任何提示 | §1.2 提到"过往的尝试"——本稿不实做，列为 follow-up |
| **R-15 跨设备同步** | M2 阶段仅 localStorage | M3 接入 Supabase |

---

## 12. 红线自检（CLAUDE.md §5）

| 红线 | 本稿情况 | 通过 |
| --- | --- | --- |
| ❌ 心数 / 宝石 / 排行榜 / 打卡天数 / 付费修复 / 催促型推送 | 12 步无计数 UI；步骤 12 "下次想练就练" 不催促 | ✅ |
| ❌ "你太软弱 / 你应该 / 你连这都…" | 全部文案第一人称；Step1-Step12 不出现评判 | ✅ |
| ❌ 在危机路径给"怎么办"建议 | 步骤 9 触发 crisis → 跳 `<CrisisBanner>`（T-09 一致） | ✅ |
| ❌ KB 全文注入 LLM | 不涉及 KB / LLM；仅复用现有 API | ✅ |
| ❌ 完整 history 注入 LLM | 不涉及 | ✅ |
| ❌ 多 Agent 重复消费上下文 | 本稿为单 Agent（FE）调研 + 设计稿 | ✅ |
| ❌ 不做安全评审就上线情绪功能 | 本稿为设计稿；上线前必过 Q checklist | ✅ |
| ❌ 显示用户 PII | 不涉及用户身份 | ✅ |
| §16.3 拒绝清单 grep 自检 | 12 步无 heart / lives / gem / coin / leaderboard | ✅ |
| §16.3 推送文案自检 | 演练页无推送（T-08 推送控制） | ✅ |
| §16.2 借鉴与改造 11 条 | 演练 12 步固定 ✅、无货币 ✅、无排行 ✅、无打卡天数 ✅、"今天就到这里" / [暂停] 永远可达 ✅ | ✅ |

**结论**：本稿**符合 CLAUDE.md 红线 + docs/02-Prototype.md §16 全部自检项**。

---

## 13. 与 T-01 / T-09 设计稿的接口边界

### 13.1 与 T-01 技能树主页

| 共享数据 | T-01 写入 | T-03 写入 | 存储位置 |
| --- | --- | --- | --- |
| `practiced` | — | step === 12 完成 +1 | `localStorage.drill_progress.{code}` |
| `draftStep` | — | `setPaused(true)` 时 | `localStorage.drill_draft.{code}` |
| `recommended`（唯一发光节点） | daily 重算 | 不涉及 | `today/page.tsx` 内存 |

| 字段类型 | T-01 期望 | T-03 写入值 | 兼容 |
| --- | --- | --- | --- |
| `draftStep.stepName` | string（polish P-02） | `STEP_LABELS[step]`（步骤名） | ✅ |
| `draftStep.pausedAt` | ISOString | ISOString | ✅ |

### 13.2 与 T-09 危机兜底

| 共享数据 | T-09 入口 | T-03 触发 | 一致性 |
| --- | --- | --- | --- |
| `process()` API 路由 | `/api/conversations/[id]/messages` | 同上 | ✅ |
| L0 规则层 | `crisis-detector.ts` | 同上 | ✅ |
| `CrisisBanner` 组件 | `/crisis` 静态页 | 步骤 9 触发后全屏覆盖 | ✅ |
| `data.crisis` 字段 | API 返回 | API 返回 | ✅ |
| 草稿持久化（危机时不丢） | localStorage | T-03 §2.4 已设计 | ✅（实施时落地） |
| 跨页面回原页面 | `onSafe` 回调 | `setCrisis(false)` → 回到 STEP_9 | ✅ |

### 13.3 与 T-11 我的剧本

| 共享数据 | T-11 路径 | T-03 步骤 11 | 一致性 |
| --- | --- | --- | --- |
| POST `/api/scripts` 入参 | `{ title, scene_tag, content }` | 同上 | ✅ |
| 字段约束 | T-11 设计稿规定 | T-03 步骤 11 入参一致 | ✅ |
| `/scripts` 列表展示 | 列出已存剧本 | T-03 不涉及展示 | ✅ |

### 13.4 与 T-04 演练后端 + 状态机

| 共享数据 | T-04 后端契约 | T-03 前端契约 | 一致性 |
| --- | --- | --- | --- |
| `POST /api/conversations` | `{ type: 'drill' }` | 同上 | ✅ |
| `POST /api/conversations/[id]/messages` | `{ content, intent_override: 'drill', scenario }` | 同上 | ✅ |
| `data.reply.try_this / next_step / acknowledge` | LLM 输出字段 | 前端拼接 ≤ 60 字 | ✅ |
| `data.crisis` | L0 命中字段 | 前端跳 `<CrisisBanner>` | ✅ |

---

## 14. 待 Coordinator 拍板的 3 个开放问题

| # | 问题 | 建议 |
| --- | --- | --- |
| Q1 | 演练中是否提供 [直接退出]（除 [暂停]）？ | 建议**不提供**，通过 `paused → 直接退出` 二步路径完成，符合 prototype §6.4 "可中断" 而不"鼓励退出" |
| Q2 | 步骤 12 [点头] 跳 `/today` 还是 `/progress`？ | 建议**改 `/today`**（polish P-04 配套：演练完成 = 回到成长路看节点状态变化，而非跳复盘） |
| Q3 | 演练页是否隐藏 BottomNav？ | 建议**隐藏**（方案 A）：`(app)/layout.tsx` 检测 `pathname === '/drill'` → 不渲染 BottomNav |

---

## 15. Follow-up（不属本任务）

1. **T-04（BE）**：12 步演练后端 + 状态机（含步骤 9 流式响应优化）。
2. **T-05（PE+A+BE）**：AI 编排适配 12 步（每步人格注入）。
3. **T-06（FE+BE）**：今日三件小事前端 + 后端（含"必做 = 唯一发光节点"映射）。
4. **T-11（FE+BE）**：我的剧本（v1.0 保留 + 提升为底部 Tab）。
5. **T-12（FE+BE）**：我 → 进度（v2.0 形态：5 段旅程地图 + 练过的瞬间）。
6. **M3 follow-up**：
   - 步骤 7/8/11 危机检测（client-side L0 或额外 API 调用）—— T-09 X-2/X-3/X-4
   - 草稿 3 天归档 UI（"过往的尝试"提示）—— T-09 §10.2 R-12
   - 跨设备同步（Supabase 接管 localStorage）
   - 步骤 9 流式显示（SSE）
   - 步骤切换动效（fade + 4px 位移 150ms）

---

## 16. 与现有文档的双向追溯

| 本稿章节 | 引用源 |
| --- | --- |
| §1 现状 | `src/app/(app)/drill/page.tsx` v2.0.5/v2.0.6 + `docs/02-Prototype.md` §6.4 |
| §2 状态机 | `docs/02-Prototype.md` §8.1 + `docs/02-Prototype.md` §7.3 |
| §3 步骤切换 UI | `docs/02-Prototype.md` §11 + §6.4 + `src/components/conversation/Composer.tsx`（未复用） |
| §4 SkillNode 关系 | `docs/design/T-01-skill-tree-home.md` §3.3 + §4.2 |
| §5 进度条 | `docs/02-Prototype.md` §6.4 + polish P-02 |
| §6 暂停 / 退出 | `docs/02-Prototype.md` §7.3 + `rules/safety.md` S-6 |
| §7 危机跳转 | `docs/design/T-09-crisis-fallback.md` §8.3.2 + `src/lib/safety/crisis-detector.ts` |
| §8 步骤 11 保存 | `plans/m2-poc.md` T-11 + `src/lib/scripts-store.ts` |
| §9 代码片段 | `src/app/(app)/drill/page.tsx` |
| §10 BottomNav | `src/components/layout/BottomNav.tsx` + `src/app/(app)/layout.tsx` + `docs/02-Prototype.md` §6.4 |
| §11 风险点 | `rules/safety.md` S-1 ~ S-8 + `docs/02-Prototype.md` §16.3 |
| §12 红线自检 | `CLAUDE.md` §5 + `docs/02-Prototype.md` §16 |
| §13 接口边界 | `docs/design/T-01-skill-tree-home.md` + `docs/design/T-09-crisis-fallback.md` + `plans/m2-poc.md` T-11/T-04 |
| §14 开放问题 | — |
| §15 Follow-up | `plans/m2-poc.md` 任务清单 |

---

> **变更摘要**（v0.1 2026-06-17）：
> 1. 现状分析：12 步形态 + polish P-02/P-04/P-10 已落地，5 处未对齐（动效 / BottomNav / 草稿 / 步骤 12 跳转 / 步骤 12 重复按钮）
> 2. 12 步状态机：前端 8 个状态（INTRO/STEP_N/PAUSED/CRISIS/LOADING/STEP_12）与全局 §8.1 对齐
> 3. 草稿持久化契约：localStorage `drill_draft.{code}` + 3 天归档
> 4. MultiChoice 不复用 Composer/ChatBubble 的理由
> 5. 顶部进度条 polish P-02 已落地，不显示"5/12"
> 6. 暂停 / 退出：演练中**不**直接退出，仅 paused 态二步路径；符合 S-6 不二次确认
> 7. 步骤 7/8 危机检测缺口：M2 范围内接受，列为 follow-up
> 8. 步骤 11 与 T-11 接口契约：POST `/api/scripts` 入参一致
> 9. 关键代码片段：主骨架约 150 行（≤ 250 行预算）
> 10. 与 BottomNav 关系：建议方案 A（演练隐藏）
> 11. 风险点：P0 6 条 / P1 6 条 / P2 3 条
> 12. 红线自检：通过
> 13. 接口边界：T-01 / T-09 / T-11 / T-04 数据契约一致
> 14. 待 Coordinator 拍板：3 个开放问题
> 15. Follow-up：5 项本任务 + 5 项 M3
