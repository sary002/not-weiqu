# T-10 · 自由对话（v1.0 兜底式陪聊保留）· 设计稿

> **任务编号**：T-10（plans/m2-poc.md）
> **关联切片**：S-PoC-04 兜底前置 + S-PoC-01 演练外的"非结构化陪伴"路径
> **关联用户故事**：阿瑶「不想练 12 步，今天就想聊两句」→ 进入自由对话 → AI 陪着听；过程中若说"我今晚不想活了" → 兜底页呈现
> **Owner（设计）**：FE（UI / 组件契约）+ BE（API / 编排）+ PE（人格口径）
> **Reviewer**：C、PM、KE、Q
> **阶段**：调研 + 设计（**不修改 src/ 下任何源代码**）
> **本稿状态**：待 Coordinator 审核
> **版本**：v0.1（2026-06-17）

---

## 0. 阅读须知

- 本稿只描述形态、规则、组件契约、API 行为、测试用例。**不输出可运行代码、不动 src/ 任何文件**。
- 一切设计决策必须可回溯到：
  - `CLAUDE.md` §5 红线
  - `rules/safety.md` S-1 ~ S-8
  - `docs/02-Prototype.md` §5.4 自由对话 + §6.8 危机兜底
  - `plans/m2-poc.md` T-10 + T-09（强依赖）
  - `src/lib/ai/orchestrator.ts` v2.0.7.1（1 次 LLM + L0 规则层优先）
  - `src/lib/safety/crisis-detector.ts` 6 类 32 模式
  - `docs/design/T-09-crisis-fallback.md`（必读，本稿为其下游）
  - `docs/design/T-01-skill-tree-home.md` §8 BottomNav 兼容性
- T-10 是 M2 PoC 中**兜底式陪聊的入口设计**——与 T-09 危机兜底、T-03/T-04 演练形成三条平行的"输入路径"，行为一致性是本稿的核心约束。

---

## 1. 现状分析

### 1.1 v1.0 自由对话（baseline）

| 维度 | v1.0 实现 |
| --- | --- |
| 入口 | 顶部菜单 `/conversation`（非底部 Tab） |
| 形态 | 单页：开场白气泡 + 用户消息 + Composer 输入 |
| 路由 | `src/app/(app)/conversation/page.tsx` |
| API | `POST /api/conversations`（type='free'）→ `POST /api/conversations/[id]/messages` |
| AI | v1.0 双 LLM：`analyze` → `reply`，共 2 次调用 |
| 开场白 | 静态 "我在这。想聊什么都行；不聊也行。" |
| 危机响应 | `response.data.crisis === true` → 渲染 CrisisBanner（本地） |
| 兜底文案 | LLM 自由生成（受人格 few-shot 约束），偶发偏长/偏敷衍 |
| 退出 | 无显式退出按钮，靠底部 BottomNav 切到其他 Tab |
| 多轮 | 草稿 / 上下文仅前端 state，未持久化 |
| 演练差异 | **完全独立路径**——12 步演练有专属 `/drill` 页与 API |

### 1.2 v2.0 形态下的入口位置（需求）

| 维度 | v2.0 期望 | v1.0 差异 |
| --- | --- | --- |
| 入口 | BottomNav 第 2 Tab（与 T-01 一致） | 从顶部菜单降到**底部常驻入口** |
| 与演练关系 | **平行入口**（v1.0 兜底式陪聊保留） | 用户可绕过 12 步直接进入自由对话 |
| 与危机关系 | **危机兜底 4 入口之一**（T-09 §8.1） | 任何一条用户消息都可能触发 L0 检测 |
| 形态 | **保留** v1.0 单页聊天（不引入卡片/选项） | 不引入结构化交互，保持"陪着听"的语义 |
| AI | v2.0.7.1 1-LLM（Router+Skill 合并） | 1 次 LLM 调用 + 5min cache |
| 兜底 | 与 T-09 完全对齐（同一 CrisisBanner） | 文案走 `buildCrisisLocal` 本地模板（0 LLM） |

### 1.3 关键不变量（来自 T-09 + T-01 + m2-poc）

| 不变量 | 出处 | 含义 |
| --- | --- | --- |
| **三入口一致性** | T-09 §8.1 | 自由对话 / 演练 / 剧本 任何一条用户输入触发了 L0 规则，行为完全一致 |
| **L0 优先级 > L1 Router > L2 Skill** | orchestrator.ts v2.0.7.1 | 规则命中则不调 LLM |
| **BottomNav 第 2 Tab** | T-01 §8.2 + BottomNav.tsx | `TABS[1] = {href: '/conversation', label: '自由对话', Icon: MessageCircle}` |
| **不问"练不练"** | `docs/02-Prototype.md` §5.4 | 自由对话 ≠ 演练前置页；不出现"开始 12 步演练"按钮 |
| **不催促、不评判** | `rules/safety.md` S-2 | 兜底话术不出现"你没事吧"/"加油"/"坚持" |

### 1.4 T-10 需交付的 4 件事

1. **入口形态确认**：自由对话作为 BottomNav 第 2 Tab 与"今日"是平行入口（不嵌套）。
2. **与危机兜底解耦不分离**：复用 `crisis-detector.ts` + `CrisisBanner`，但呈现时机从"路由跳转"改为"API 返回内嵌触发"（沿用 v1.0 模式）。
3. **与演练的边界**：自由对话**永远不走** `intent_override='drill'`；演练步骤 7-8 角色扮演**永远不走** `intent_override='free_dialogue'`。
4. **Composer / ChatBubble 复用**：自由对话**复用**现有组件，不新增第二套输入/气泡实现。

---

## 2. v2.0 形态：BottomNav 第 2 Tab

### 2.1 BottomNav 当前态（来自 `src/components/layout/BottomNav.tsx`）

```ts
const TABS = [
  { href: '/today', label: '今日', Icon: Home },
  { href: '/conversation', label: '自由对话', Icon: MessageCircle },
  { href: '/scripts', label: '我的剧本', Icon: BookOpen },
  { href: '/progress', label: '我', Icon: User },
] as const;
```

**结论**：第 2 Tab 已**预先定义**为 `/conversation`。T-10 不需新增 Tab，只确认这一位置的语义。

### 2.2 Tab 语义顺序的设计意图

| 序 | Tab | 含义 | 用户故事对应 |
| --- | --- | --- | --- |
| 1 | 今日 | 结构化引导（推荐技能 + 演练 + 三件小事） | S-PoC-01 |
| 2 | 自由对话 | 非结构化陪伴（兜底式陪聊） | S-PoC-04 前置 / S-PoC-01 后置 |
| 3 | 我的剧本 | 沉淀（演练后保存的应对话术） | S-PoC-01 步骤 11 |
| 4 | 我 | 元数据（进度 / 设置 / 数据） | S-PoC-02 / S-PoC-03 |

**自由对话置于第 2 位的关键意图**：

- 它是"今日"的**弱替代**——用户今天不想练 12 步，就直接进自由对话。
- 它是"我的剧本"的**弱上游**——自由对话中产生的"你说的这句挺好"，可一键加入剧本（M3 实现，M2 仅留 1 个轻提示）。
- **不放在 Tab 1**：避免把"今日推荐"挤掉（推荐是结构化引导的主入口）。
- **不放在 Tab 3 或 4**：避免用户找不到（3/4 是沉淀与元数据，不适合"开始"语义）。

### 2.3 与 T-01 §BottomNav 兼容性

> 引用 `docs/design/T-01-skill-tree-home.md` §8.2 + 当前 `BottomNav.tsx` 实现。

| 项 | 现状 | T-10 评估 |
| --- | --- | --- |
| BottomNav 在 `/conversation` 时 active 态 | `path === '/conversation'` 命中，`aria-current='page'` | ✅ 沿用 |
| 主页底部 + BottomNav | 主页自然结束 → BottomNav 接住；自由对话页同样 | ✅ 无冲突 |
| 滚动条与 BottomNav 视觉竞争 | 自由对话消息列表会越长越长 | ⚠️ 需评估：消息列表容器高度限制 + 局部滚动 |
| 兜底页（`/crisis`）与 BottomNav | 兜底页是否还显示 BottomNav？ | 见 §3.4 设计决策 |

### 2.4 自由对话页布局（与 v1.0 一致 + 1 项细化）

```
┌────────────────────────────────────────────────┐
│  GlobalHeader                                  │
│  ────────────────────────────────────────────  │
│  跟不委屈说                          我在这，随时退出 │
│  ────────────────────────────────────────────  │
│                                                │
│  ┌────────────────────────────────────────┐    │
│  │  [AI]  我在这。                          │    │
│  │        想聊什么都行；不聊也行。           │    │
│  │                                         │    │
│  │                  [用户] 今天有点累       │    │
│  │                                         │    │
│  │  [AI]  听到了。                           │    │
│  │        你愿意再多说一句吗？               │    │
│  │                                         │    │
│  │                  [用户] 我今晚不想活了   │    │
│  │                                         │    │
│  │  [AI]  （触发 crisis → 跳 /crisis）     │    │
│  └────────────────────────────────────────┘    │
│                                                │
│  ┌────────────────────────────────────────┐    │
│  │ [想说什么都行…]                  [Send] │    │
│  └────────────────────────────────────────┘    │
│  ────────────────────────────────────────────  │
│  BottomNav：今日 / 自由对话 / 我的剧本 / 我     │
└────────────────────────────────────────────────┘
```

**容器高度约束**（v1.0 当前实现 `h-[calc(100vh-8rem)]`）：保留不变。说明：8rem 估算 = GlobalHeader(3.5rem) + BottomNav(4rem) + 边距。

### 2.5 v2.0.2 修复的保留（v1.0 已有）

> 引用 `src/app/(app)/conversation/page.tsx` 注释行 26-33 / 80-94。

| 修复 | 来源 | T-10 决策 |
| --- | --- | --- |
| 进入页面就有 AI 开场白气泡 | v2.0.2 fix | ✅ 保留 |
| `turn_count` 由前端传后端 | v2.0.3 fix | ✅ 保留 |
| 后端 fallback 已引用用户原话 + 按 turn 切换措辞 | v2.0.3 fix | ✅ 保留 |
| 过滤孤立"我在这"防重复 | v2.0.3 fix | ✅ 保留 |
| `silent_retry` hint 显式提示 | v2.0.3 fix | ✅ 保留 |
| 网络异常不再用"我在这" | v2.0.2 fix | ✅ 保留 |

---

## 3. 与危机兜底的耦合（T-09 §8.1 跨页面一致性）

### 3.1 入口矩阵（自由对话在 4 入口中的位置）

> 引用 `docs/design/T-09-crisis-fallback.md` §8.1，**本稿只补充自由对话这一行**。

| 入口 | 路由 | 是否走 `process()` | L0 检测位置 | 跳 `/crisis` 触发条件 |
| --- | --- | --- | --- | --- |
| **自由对话** | `/conversation` 每条用户消息 | ✅ | API `POST /api/conversations/[id]/messages` | `response.data.crisis === true` |
| 演练 | `/drill` 步骤 7/8 + 步骤 11 保存前 | ✅ | 同上 | 同上 |
| 剧本保存 | `/scripts` 保存时备注 | ✅ | 同上 | 同上 |
| 直接访问 | `/crisis` | ❌（静态页） | — | 始终显示兜底页 |

### 3.2 自由对话触发危机的完整链路

```
用户在自由对话输入"我今晚不想活了"
  ↓
Composer.onSubmit → send(text)
  ↓
POST /api/conversations/[id]/messages
  ↓
route.ts → process({ user_input, context, intent_override: undefined })
  ↓
[orchestrator] detectCrisis(user_input) → ruleCrisis.is_crisis = true
  ↓
unified = buildCrisisLocal()             ← 本地模板，0 LLM
  ↓
return { crisis: true, analyze.risk: 'crisis', action_hint: 'show_crisis_resources', routing.calls_used: 0 }
  ↓
route.ts 看到 out.analyze.risk === 'crisis'
  ↓
return 200 + { data: { crisis: true, analyze, reply, routing } }
  ↓
前端 setCrisis({ type: 'crisis' }) → 渲染 <CrisisBanner />
  ↓
CrisisBanner 渲染（焦点自动到第 1 条热线）
```

### 3.3 CrisisBanner 复用（来自 T-09 §3.2）

| CrisisBanner props | T-10 自由对话页用法 |
| --- | --- |
| `onSafe: () => void` | 清空 crisis state + 清空 messages state → 回到空态（开场白） |
| `onKeepTalking: () => void` | `router.push('/crisis')`（与 v1.0 一致；详见 §3.4） |

**关键差异**（与 T-09 §3.2 的设计意图对照）：

- 自由对话**不显示** CrisisBanner 底部"今天就到这里"按钮在 crisis 退出后回到 `/today`——而是回到**当前对话页**（`onSafe` 清空 state），因为用户主动选择"我现在安全"意味着继续留在自由对话，而非跳出整个应用。
- 此设计决策**与 T-09 §3.5 默认行为不一致**，需要在 T-10 实施时由 C 仲裁（详见 §11 风险点 R-01）。

### 3.4 兜底页跳转的两种触发方式

| 触发方式 | 当前实现 | 优缺点 |
| --- | --- | --- |
| **A. 内嵌触发**（v1.0 + 当前 v2.0） | `data.crisis === true` → 渲染 `<CrisisBanner>` 组件 | 无需路由跳转；动画/焦点控制更细；缺点是 crisis state 与 messages state 分离 |
| **B. 路由跳转**（T-09 §3 默认） | `router.push('/crisis')` | 与其他入口（演练、剧本）行为一致；缺点是路由栈多一层 |

**T-10 决策**：**沿用方式 A**（内嵌触发），不切换。原因：

1. v1.0 已是内嵌触发，切换到 B 会引入回归（v1.0 行为对比用例）。
2. 自由对话的对话上下文（messages state）需要保留——`onSafe` 后回到对话页继续聊。
3. T-09 §3 CrisisBanner 缺口（紧急联系人 / 退出路径）由统一组件修复，与触发方式无关。

### 3.5 CrisisBanner 与 BottomNav 共存

| 场景 | BottomNav 是否显示 | 理由 |
| --- | --- | --- |
| 自由对话正常态 | ✅ 显示 | 用户可切到其他 Tab |
| 自由对话触发 crisis（渲染 CrisisBanner） | ⚠️ **建议隐藏** | 减少干扰，让用户专注于兜底资源 |
| `/crisis` 直接访问 | ❌ 不显示 | 兜底页是全屏组件，BottomNav 是干扰 |

**T-10 决策**：自由对话触发 crisis 时**隐藏** BottomNav（FE 在 page.tsx 加 `crisis && <BottomNav hidden />` 或类似条件渲染）。**与 T-09 §3.5 兜底页 `/crisis` 直接访问行为一致**。

---

## 4. 与演练的边界（演练步骤 7-8 vs 自由对话）

### 4.1 语义对照

| 维度 | 自由对话 | 演练步骤 7-8 |
| --- | --- | --- |
| **目的** | 非结构化陪伴，用户主导 | 结构化引导，AI 主导 |
| **AI 角色** | "不委屈"陪伴者 | 演练对手（"同事"） |
| **输出格式** | 自由文本（acknowledge/name_it/need/try_this/next_step 5 段） | 短句回复 + hint（reply + hint） |
| **intent** | `free_dialogue` | `drill` |
| **用户期待** | "你听我说" | "我陪你练一次" |
| **收束** | 用户决定何时退出 | 12 步固定流程 |
| **加剧本** | ❌ M2 不支持（M3 实现） | ✅ 步骤 11 一键加剧本 |
| **危机响应** | ✅ 经同一 `process()` | ✅ 经同一 `process()` |

### 4.2 关键边界（不混淆）

| 场景 | T-10 决策 | 理由 |
| --- | --- | --- |
| 自由对话页 → 用户输入 | `intent_override = undefined`（由 orchestrator 决定） | 用户没说"我要练"，按 free_dialogue 处理 |
| 演练步骤 7-8 → 用户输入 | `intent_override = 'drill'` | 演练有 12 步骨架，强制走 drill skill |
| 演练步骤 7-8 → 用户说危机话术 | L0 规则层优先 → crisis | T-09 §5.2 场景 A：双保险 |
| 自由对话 → 用户说"我想练拒绝同事" | **不自动跳演练** | 自由对话是"陪着听"，不抢答；用户主动进入 `/drill` 才会切换 |
| 演练步骤 9 → 收束话术 | `intent_override = 'drill'` | 即使文本像"今晚有安排了"，也走 drill skill（避免 LLM 误判为 free_dialogue） |
| 自由对话 → AI 回复 | 5 段（ack/name_it/need/try_this/next_step） | 走 `unifiedReplyFree` schema |
| 演练步骤 9 → AI 回复 | 1 段（reply + hint） | 走 `unifiedReplyDrill` schema |

### 4.3 入口互斥的代码层不变量

> 引用 `orchestrator.ts` v2.0.7.1 + T-09 §5.2 preRoutedIntent 修正。

```ts
// callUnifiedInternal 末尾（v2.0.7.1）：
if (preRoutedIntent && parsed.data.intent !== preRoutedIntent) {
  return { ...parsed.data, intent: preRoutedIntent };  // 强制覆盖
}
```

**T-10 不变量**：

- 自由对话**绝不传** `intent_override`（即 `preRoutedIntent` 为 undefined）。
- 演练步骤 7-8/9/11 **必传** `intent_override='drill'`。
- 即使用户在自由对话说"我想练"，前端**不切换** `intent_override`，由 LLM 自然生成 free_dialogue 回复（不抢答）。
- 即使用户在演练步骤 7 说"我今晚不想活了"，L0 优先 → crisis（preRoutedIntent 与 L0 同向，无冲突）。

### 4.4 状态机整合（与 docs/02-Prototype.md §8.1 对齐）

```
[IDLE] (今日 / 其他)
   ├─ 用户点 BottomNav 第 2 Tab → [FREE_DIALOGUE_ACTIVE]
   └─ 用户点「今日推荐」技能 → [PRACTICE_ACTIVE]

[FREE_DIALOGUE_ACTIVE]
   ├─ 危机信号 → [CRISIS]  ← L0 规则层触发，0 token
   ├─ 用户退出（导航 / 关闭） → [IDLE]（草稿不保留，v1.0 行为）
   └─ 持续对话（无显式结束）

[CRISIS]
   ├─ 用户确认安全（onSafe） → [FREE_DIALOGUE_ACTIVE]（messages 清空，回到开场白）
   └─ 用户想继续（onKeepTalking） → 跳 /crisis 静态页

[PRACTICE_ACTIVE] (演练中)
   ├─ 危机信号 → [CRISIS]
   ├─ 用户暂停 → [PRACTICE_PAUSED]
   ├─ 用户退出 → [IDLE]（草稿保留）
   └─ 12 步完成 → [PRACTICE_DONE]
```

**与 T-09 §8.2 状态机的差异**：

- T-09 状态机 `[CRISIS]` → 用户确认安全 → `[ENDING]` → 跳 `/today`。
- T-10 自由对话的 `[CRISIS]` → 用户确认安全 → `[FREE_DIALOGUE_ACTIVE]`（**回到当前对话页**，而非 `/today`）。

---

## 5. Composer / ChatBubble 复用与扩展

### 5.1 复用现状（v1.0 已实现）

| 组件 | 路径 | 自由对话用法 | T-10 决策 |
| --- | --- | --- | --- |
| `Composer` | `src/components/conversation/Composer.tsx` | `<Composer onSend={send} disabled={loading} />` | ✅ 直接复用，**不修改** |
| `ChatBubble` | `src/components/conversation/ChatBubble.tsx` | `<ChatBubble role={m.role} content={m.content} meta={m.meta} />` | ✅ 直接复用，**不修改** |

**复用依据**：

- T-01 §8.2 强调 BottomNav 各 Tab 页**共享** composer/chat 组件，避免第二套实现。
- T-11「我的剧本」也会复用同一 Composer（输入新剧本）。
- M2 范围仅 1 个微技能（拒绝同事甩活），组件复用面**越广**，实施成本越低。

### 5.2 复用边界（什么不改）

| 项 | T-10 决策 | 理由 |
| --- | --- | --- |
| Composer 的 placeholder "想说什么都行…" | ✅ 保留 | 与 v1.0 一致；不区分"练 / 聊"语境 |
| Composer 的 maxLength=2000 | ✅ 保留 | 足够 1 条自由对话；与 T-09 §4.3 API 契约一致 |
| ChatBubble 的 `meta.try_this` 复制按钮 | ✅ 保留 | 自由对话 try_this 段也可复制（虽然 v1.0 未走 try_this 路径，但 schema 已支持） |
| ChatBubble 的动效（rounded/transition） | ✅ 保留 | **不破坏** CrisisBanner 的"无动效"约束——两者不共存 |

### 5.3 扩展点（M2 PoC 范围 vs follow-up）

| 扩展点 | M2 范围 | follow-up | 说明 |
| --- | --- | --- | --- |
| Composer 显示"已发送 / 对方正在输入"状态 | ❌ | M3 | v1.0 已用 `loading` 状态实现 loading dots；M2 不增量 |
| ChatBubble 支持引用（点气泡回复） | ❌ | M3 | M2 不引入交互复杂度 |
| Composer 显示"今天的对话已保存到剧本？" | ❌ | M3 | M3 实现"加进我的剧本"轻提示 |
| ChatBubble 显示 KB 来源 | ❌ | M3 | T-15 评测集跑通后再考虑展示 |
| Composer 顶部显示"上次聊到这里"恢复入口 | ❌ | M3 | M2 PoC 无会话持久化；M3 接入 Supabase 后实现 |

### 5.4 与 CrisisBanner 的边界

| 项 | 边界 |
| --- | --- |
| Composer 在 crisis 时 | **不渲染**（`if (crisis) return <CrisisBanner />` 提前 return） |
| ChatBubble 在 crisis 时 | **不渲染**（同上） |
| Loading dots 在 crisis 时 | **不渲染**（同上） |
| CrisisBanner 内是否有 Composer | ❌ **永远没有**（T-09 §3.1：不收集 PII） |

---

## 6. API 契约

### 6.1 POST /api/conversations（创建自由对话）

> 来源：`src/app/api/conversations/route.ts` v1.0 + `docs/05-API-Design.md` §9.2。

**输入**：

```ts
{
  scenario_id?: string;          // 可选；自由对话固定 null
  type?: 'free' | 'drill';       // 自由对话传 'free'，演练传 'drill'
}
```

**输出（201 Created）**：

```json
{
  "data": {
    "id": "uuid",
    "user_id": "demo-user",
    "scenario_id": null,
    "type": "free",
    "status": "active",
    "started_at": "2026-06-17T10:00:00Z",
    "last_active_at": "2026-06-17T10:00:00Z"
  },
  "meta": { "trace_id": "uuid", "server_time": "2026-06-17T10:00:00Z" }
}
```

**T-10 决策**：

- v1.0 当前实现**已满足**自由对话的最小需求（无字段变更）。
- 不引入 `title` / `summary` / `tags` 字段（M3 接 Supabase 后扩展）。
- 不引入 `client_msg_id` 字段（自由对话无断网恢复诉求；演练可能需要，M2 末再评估）。

### 6.2 POST /api/conversations/[id]/messages（发消息）

> 来源：`src/app/api/conversations/[id]/messages/route.ts` v2.0.4 + `docs/05-API-Design.md` §10.1。

**输入**：

```ts
{
  content: string;              // ≤ 2000 字符（必填）
  client_msg_id?: string;       // 可选；幂等键
  turn_count?: number;          // 前端从 messages.length / 2 + 1 计算
  scenario?: string;            // 自由对话固定 undefined
  intent_override?: 'crisis' | 'drill' | 'free_dialogue';  // 自由对话固定 undefined
}
```

**输出（正常 free_dialogue 路径）**：

```json
{
  "data": {
    "analyze": {
      "facts": ["情绪聊天"],
      "emotions": [],
      "needs": [],
      "pattern": "其他",
      "layer": "L1",
      "risk": "low",
      "crisis_signals": [],
      "confidence": 0.5,
      "note": "v2.0.7.1 router:free_dialogue"
    },
    "reply": {
      "acknowledge": "听到了。",
      "name_it": "你愿意再多说一句吗？",
      "need": "",
      "try_this": "",
      "next_step": "",
      "tone": "calm_warm",
      "word_count": 16,
      "meta": {
        "should_continue": true,
        "fallback": "skill_fd_ok",
        "kb_refs": [],
        "action_hint": undefined
      }
    },
    "kb_refs": [{ "id": "kb-2026-l03-boundary-01", "title": "边界的内核" }],
    "routing": {
      "intent": "free_dialogue",
      "brief": "情绪聊天",
      "skill_called": "skill-free-dialogue (llm)",
      "calls_used": 1
    }
  },
  "meta": { "trace_id": "uuid", "server_time": "2026-06-17T10:00:00Z" }
}
```

**输出（crisis 路径）**：见 T-09 §4.3。

### 6.3 GET /api/conversations/[id]（查询会话）

> 当前 v1.0 **未实装**（`[id]/route.ts` 不存在，只有 `[id]/messages/route.ts`）。

**T-10 决策**：

- **M2 PoC 阶段不实装** `GET /api/conversations/[id]`（无会话持久化诉求）。
- M3 接入 Supabase 后实装，用于：
  - 会话列表页（v3.0 才有）
  - 草稿恢复（M2.5 引入持久化后）
- 自由对话的"上次聊到这里"功能依赖此端点 → M3 实现。

### 6.4 错误码契约

| 错误码 | 触发条件 | HTTP | 前端处理 |
| --- | --- | --- | --- |
| `NW-CO-0010` | content 为空 | 400 | 不展示错误；前端 Composer 已禁用空提交 |
| `NW-CO-0011` | content > 2000 字符 | 422 | Toast "先说最想说的那一段" |
| `NW-ST-0001` | 服务端异常 | 500 | 兜底"我们这会儿有点忙，再说一次？"（v2.0.2 fix） |
| Rate Limit | 20 次/分钟（`msg:send`） | 429 | "慢一点说，我在这" |

---

## 7. v2.0.7.1 1-LLM 架构适配（intent='free_dialogue'）

### 7.1 自由对话在 orchestrator 中的路径

```
process(input)
  ├─ ruleCrisis = detectCrisis(input.user_input)         [L0: 0 token]
  ├─ if ruleCrisis.is_crisis → buildCrisisLocal()        [CRISIS PATH: 0 LLM]
  ├─ elif input.intent_override === 'drill'
  │     → callUnifiedWithIntent(..., 'drill')            [DRILL PATH: 1 LLM]
  ├─ elif input.intent_override === 'free_dialogue'
  │     → callUnifiedWithIntent(..., 'free_dialogue')    [FREE DIALOGUE PATH: 1 LLM]
  └─ else (intent_override = undefined)
        → cacheGet(key) ?? callUnified(...)               [DEFAULT PATH: 0~1 LLM]
                                                          ↑ 自由对话默认走这条
```

**T-10 决策**：

- 自由对话**默认**走 DEFAULT PATH（`intent_override = undefined`），由 orchestrator 自动 cache（5 分钟内同输入复用）。
- **不主动**传 `intent_override='free_dialogue'`。理由：
  1. LLM 的 Router 已经能识别 free_dialogue（unified prompt 内部判定），不需要前端强制。
  2. 传 intent_override 会跳过 Router + cache，是浪费。
  3. 演练步骤 9 必须传 `'drill'`，因为 LLM 在步骤 9 容易误判；自由对话无此问题。
- **例外**：如果 Q 评审发现 free_dialogue 误判率 > 5%，再切到 `callUnifiedWithIntent`。

### 7.2 1-LLM 调用细节（unified prompt）

> 来源：`src/lib/ai/prompts/unified.ts`（v2.0.7.1 Router+Skill 合并）。

```ts
const userPrompt = buildUnifiedUserPrompt(
  input.user_input,
  input.context.turn_count ?? 1,
  !!input.context.is_first_message,
  input.context.scenario,         // 自由对话 = undefined
);
```

**T-10 行为**：

- `scenario = undefined`：unified prompt 不注入演练上下文。
- `is_first_message = true`：首次消息有开场白。
- `turn_count >= 3`：fallback 切换措辞（pools[2]）。

### 7.3 cache 命中策略（v2.0.7.2）

```ts
// orchestrator.ts line 322-335
const key = cacheKey(
  input.user_input,
  input.context.turn_count ?? 1,
  !!input.context.is_first_message,
);
const cached = cacheGet(key);
if (cached && isCacheable(cached)) {
  callsUsed = 0;
  unified = cached;
}
```

**T-10 不变量**：

- 同一用户输入（≤100 char）+ 同一 turn_count + 同一 is_first_message → 5 分钟内 cache 命中。
- crisis / drill **不走 cache**（`isCacheable` 内部判定）。
- free_dialogue **走 cache**（符合"情绪聊天有重复模式"的场景特征）。

### 7.4 KB 召回（仅 free_dialogue）

```ts
// orchestrator.ts line 339-345
let kbRefs: KBRef[] = [];
if (unified.intent === 'free_dialogue' && !ruleCrisis.is_crisis) {
  kbRefs = await searchKB({
    query: input.user_input.slice(0, 100),
    top_k: 3,
  });
}
```

**T-10 决策**：

- 自由对话**会**做 KB 召回（top_k=3）；crisis / drill **不**做。
- KB 召回结果通过 `reply.meta.kb_refs` 回传（前端 M3 再展示，M2 仅日志记录）。
- searchKB 当前是占位实现（`src/lib/kb/search.ts` 标签匹配），M3 换 pgvector。

### 7.5 自由对话回复字段填充（5 段 vs 1 段）

| intent | reply schema | 字段填充 |
| --- | --- | --- |
| `free_dialogue` | `freeReplySchema` | acknowledge / name_it / need / try_this / next_step |
| `drill` | `drillReplySchema` | reply（短句）/ hint（可选） |
| `crisis` | `crisisReplySchema` | acknowledge / name_it / need(空) / try_this(空) / next_step(空) |

**前端组装（来自 `src/app/(app)/conversation/page.tsx` 第 80-94 行）**：

```ts
const parts = [
  r.acknowledge,
  r.name_it,
  r.need,
  r.try_this,
  r.next_step,
].filter((s) => s && !/^我在这[。！]?$/.test(s.trim()));
```

**T-10 不增量修改**——v1.0 的过滤 + 拼接逻辑已正确处理 free_dialogue 5 段拼接。

---

## 8. 与 crisis-detector.ts 的前置检测

### 8.1 检测位置

> 引用 `docs/design/T-09-crisis-fallback.md` §2.4 + `orchestrator.ts` 第 305 行。

```ts
// orchestrator.ts line 303-310
export async function process(input: ProcessInput): Promise<ProcessOutput> {
  const traceId = uuid();
  const ruleCrisis = detectCrisis(input.user_input);  // ← L0 规则层，0 token
  ...
}
```

**T-10 不变量**：

- 自由对话**每条**用户消息都经 `detectCrisis()`——**0 例外**。
- 即使前端没传 `scenario`，即使前端没传 `intent_override`，L0 规则层永远先执行。
- 这是 T-09 §8.4 跨页面一致性的核心不变量（三入口走同一 `process()`）。

### 8.2 自由对话特有的误触发风险

> 来自自由对话"情绪聊天"语境的开放性——用户可能说半句话、可能用隐喻。

| 风险 | 例子 | L0 行为 | T-10 决策 |
| --- | --- | --- | --- |
| 口语化夸张 | "今天累死了" | 不触发（C-1 用例） | ✅ T-09 §6.4 已验证 |
| 隐喻 | "同事让我喘不过气" | 不触发（C-2 用例） | ✅ T-09 §6.4 已验证 |
| 隐喻 + 时间修饰 | "喘不过气好几天了" | 触发（acute_distress） | ✅ T-09 §2.3 已覆盖 |
| 关键词拆分 | "我撑不下去" | 触发（self_harm） | ✅ T-09 §2.2 已覆盖 |
| 暗示型 | "活着没意思" | 不触发（T-09 §2.5 已知边界） | ⚠️ M3 扩展 |

**T-10 行动**：不修改 `crisis-detector.ts` 关键词表（与 T-09 范围一致）；T-10 范围仅"使用" L0 检测，**不扩展**。

### 8.3 危机触发的 UX 行为

```
用户输入"我今晚不想活了"
  ↓
[正常态] Composer 显示输入 → 按 Send
  ↓
[API] 200ms 内返回 crisis=true（L0 0 token）
  ↓
[前端] setCrisis({ type: 'crisis' }) → setMessages 添加 assistant crisis bubble
  ↓
[前端] 重新渲染：if (crisis) return <CrisisBanner />
  ↓
[CrisisBanner] 焦点自动到第 1 条热线（T-09 §3.6）
  ↓
用户点 "我现在安全" → setCrisis(null) + setMessages([]) → 回到开场白
或
用户点 "我想继续聊" → router.push('/crisis') → 进入 /crisis 静态页
```

**v1.0 当前实现**（page.tsx 第 115-117 行）：

```tsx
if (crisis) {
  return <CrisisBanner onSafe={() => { setCrisis(null); setMessages([]); }} onKeepTalking={() => router.push('/crisis')} />;
}
```

**T-10 决策**：✅ 保留 v1.0 实现，不修改。理由：

- `onSafe` 清空 messages state 与 v1.0 行为一致。
- `onKeepTalking` 跳 `/crisis` 与 v1.0 行为一致。
- BottomNav 在 crisis 时隐藏（§3.5）由 FE 实施时补一行条件渲染。

### 8.4 草稿保留问题

| 入口 | crisis 触发后草稿 | T-10 决策 |
| --- | --- | --- |
| 自由对话 | **不保留**（v1.0 行为：`setMessages([])`） | ✅ 沿用 |
| 演练 | **保留**（T-09 §8.3.2：`drill_draft`） | T-09 实施 |
| 剧本保存 | **不删除已保存剧本**（T-09 §8.3.3） | T-09 实施 |

**T-10 理由**：

- 自由对话无"草稿恢复"诉求（M2 无会话持久化）。
- 用户点 "我现在安全" 意味着"我不需要刚才那些对话了"——清空 messages 是合理 UX。
- 与 v1.0 行为一致，避免引入回归。

### 8.5 Q 审计事件（与 T-09 §4.4 对齐）

| 字段 | 自由对话来源 | T-09 范围 |
| --- | --- | --- |
| `trace_id` | orchestrator uuid | ✅ 一致 |
| `user_input` MD5(salt+content) | API route | ✅ 一致 |
| `ruleCrisis.matched[]` | detectCrisis | ✅ 一致 |
| `routing.calls_used = 0` | orchestrator | ✅ 一致 |
| `routing.skill_called = 'skill-crisis (local)'` | orchestrator | ✅ 一致 |
| `hour_local` | API route 第 54 行 | ✅ 一致 |
| `is_first_message` | context.turn_count === 1 | ✅ 一致 |

**T-10 行动**：不修改 Q 审计——T-09 §4.4 已覆盖所有 4 入口，自由对话自动复用。

---

## 9. 关键代码片段（设计稿 / ≤ 200 行）

> 以下是**设计意图代码**——不进入 src/，仅描述目标态；实际实施由 T-10 实施阶段（FE+BE）落代码。

### 9.1 自由对话页核心（`src/app/(app)/conversation/page.tsx`）

> 当前 v1.0 实现已基本满足 T-10 形态，**T-10 仅补 1 项**（crisis 时隐藏 BottomNav）。

```tsx
// 设计意图：v1.0 + T-10 增量（crisis 时隐藏 BottomNav）
// 来源：docs/design/T-10-free-dialogue.md §2 / §3
'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Composer } from '@/components/conversation/Composer';
import { ChatBubble } from '@/components/conversation/ChatBubble';
import { CrisisBanner } from '@/components/crisis/CrisisBanner';
import { BottomNav } from '@/components/layout/BottomNav';   // [T-10] 新增导入

interface Message {
  role: 'user' | 'assistant';
  content: string;
  meta?: {
    try_this?: string;
    next_step?: string;
    acknowledge?: string;
    name_it?: string;
    need?: string;
  };
  crisis?: boolean;
}

export default function ConversationPage() {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '我在这。\n\n想聊什么都行；不聊也行。' },
  ]);
  const [loading, setLoading] = useState(false);
  const [crisis, setCrisis] = useState<{ type: string } | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // [v1.0] 页面加载 → 创建自由对话会话
  useEffect(() => {
    fetch('/api/conversations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'free' }),  // [T-10] 显式传 'free'
    })
      .then((r) => r.json())
      .then((d) => setConversationId(d.data?.id ?? null))
      .catch(() => setConversationId(null));
  }, []);

  // [v1.0] 自动滚动到底部
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' });
  }, [messages, loading]);

  // [v1.0] 发送消息（含 crisis 检测响应）
  const send = async (text: string) => {
    if (!text.trim() || !conversationId) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content: text,
          client_msg_id: crypto.randomUUID(),
          turn_count: Math.floor(messages.length / 2) + 1,
          // [T-10] 自由对话不传 intent_override（走 orchestrator Router）
        }),
      });
      const data = await res.json();
      if (data.data?.crisis) {
        setCrisis({ type: 'crisis' });
        setMessages((m) => [...m, { role: 'assistant', content: '', crisis: true }]);
      } else if (data.data?.reply) {
        const r = data.data.reply;
        const parts = [
          r.acknowledge,
          r.name_it,
          r.need,
          r.try_this,
          r.next_step,
        ].filter((s) => s && !/^我在这[。！]?$/.test(s.trim()));
        const hint = r.meta?.hint;
        const isRepeated = hint === 'silent_retry';
        const content = parts.length > 0
          ? (isRepeated
              ? parts.join('\n\n') + '\n\n（我们这会儿没接住，可以稍后再来，或退出也行。）'
              : parts.join('\n\n'))
          : '我在听。这件事听起来不容易——你愿意再具体说说吗？';
        setMessages((m) => [...m, { role: 'assistant', content, meta: r }]);
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: '我们这会儿有点忙，再说一次？' }]);
    } finally {
      setLoading(false);
    }
  };

  // [v1.0] crisis 渲染分支
  if (crisis) {
    return (
      <>
        {/* [T-10] 增量：crisis 时隐藏 BottomNav（§3.5） */}
        <CrisisBanner
          onSafe={() => { setCrisis(null); setMessages([]); }}
          onKeepTalking={() => router.push('/crisis')}
        />
      </>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">跟不委屈说</h1>
        <span className="text-xs text-muted-foreground">我在这，随时退出</span>
      </header>

      <div ref={scrollerRef} class className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} content={m.content} meta={m.meta} />
        ))}
        {loading && (
          <div className="flex gap-1 pl-2">
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
          </div>
        )}
      </div>

      <Composer onSend={send} disabled={loading} />
      {/* [v1.0] BottomNav 由全局 layout 渲染；crisis 时通过条件渲染隐藏 */}
    </div>
  );
}
```

### 9.2 API route 核心（`src/app/api/conversations/[id]/messages/route.ts`）

> 当前 v1.0 实现**已满足** T-10 需求，**T-10 不增量修改**——只标注关键设计意图。

```ts
// 设计意图：v1.0 当前实现 + T-10 文档化
// 来源：docs/design/T-10-free-dialogue.md §6.2 / §8

import { NextRequest, NextResponse } from 'next/server';
import { withTrace, withRateLimit } from '@/lib/api/middleware';
import { jsonError } from '@/lib/utils/error';
import { process } from '@/lib/ai/orchestrator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('msg:send', 20, 60_000);
  if (!rl.ok) return rl.response;

  const { id: conversationId } = await params;

  try {
    const body = (await req.json()) as {
      content: string;
      client_msg_id?: string;
      turn_count?: number;
      scenario?: string;
      intent_override?: 'crisis' | 'drill' | 'free_dialogue';
    };

    // [T-10 沿用 v2.0.4] 空内容 → 400
    if (body.content === undefined || body.content === null || body.content.trim() === '') {
      return jsonError('NW-CO-0010', trace_id);
    }
    // [T-10 沿用 v2.0.4] 超长 → 422
    if (body.content.length > 2000) {
      return jsonError('NW-CO-0011', trace_id);
    }

    // [T-10 沿用 v2.0.3] turn_count 由前端传过来
    const turnCount = Math.max(1, body.turn_count ?? 1);

    // [T-10] 自由对话不传 intent_override → 走 orchestrator Router + cache
    const out = await process({
      user_id: 'demo-user',
      conversation_id: conversationId,
      user_input: body.content,
      context: {
        user_id: 'demo-user',
        conversation_id: conversationId,
        recent_messages: [],
        turn_count: turnCount,
        is_first_message: turnCount === 1,
        hour_local: new Date().getHours(),
        scenario: body.scenario,  // [T-10] 自由对话 = undefined
      },
      intent_override: body.intent_override,  // [T-10] 自由对话 = undefined
    });

    // [T-10] crisis 场景：返回 200 + action_hint，前端渲染兜底页
    if (out.analyze.risk === 'crisis') {
      return NextResponse.json({
        data: {
          crisis: true,
          analyze: out.analyze,
          reply: out.reply,
          routing: out.routing,
        },
        meta: { trace_id, server_time: new Date().toISOString() },
      });
    }

    // [T-10] 正常 free_dialogue 路径
    return NextResponse.json({
      data: {
        analyze: out.analyze,
        reply: out.reply,
        kb_refs: out.kb_refs,
        routing: out.routing,
      },
      meta: { trace_id, server_time: new Date().toISOString() },
    });
  } catch (e) {
    console.error('msg:send error', e);
    return jsonError('NW-ST-0001', trace_id);
  }
}
```

### 9.3 Orchestrator 中自由对话路径（`src/lib/ai/orchestrator.ts`）

> 当前 v2.0.7.1 实现**已满足** T-10 需求，**T-10 不增量修改**——只标注设计意图。

```ts
// 设计意图：v2.0.7.1 当前实现 + T-10 文档化
// 来源：docs/design/T-10-free-dialogue.md §7

export async function process(input: ProcessInput): Promise<ProcessOutput> {
  const traceId = uuid();
  const ruleCrisis = detectCrisis(input.user_input);  // [T-10] L0 规则层，0 token
  let callsUsed = 0;

  let unified: UnifiedOutput;

  if (ruleCrisis.is_crisis) {
    // [T-10] 不进入此分支（除非用户说危机话术）
    unified = buildCrisisLocal();
  } else if (input.intent_override) {
    // [T-10] 自由对话不传 intent_override，不会进入此分支
    callsUsed = 1;
    unified = await callUnifiedWithIntent(input, input.intent_override, traceId);
  } else {
    // [T-10] 自由对话默认走此分支（cache + Router + Skill 合并为 1 LLM）
    const key = cacheKey(
      input.user_input,
      input.context.turn_count ?? 1,
      !!input.context.is_first_message,
    );
    const cached = cacheGet(key);
    if (cached && isCacheable(cached)) {
      callsUsed = 0;
      unified = cached;
    } else {
      callsUsed = 1;
      unified = await callUnified(input, traceId);
      if (isCacheable(unified)) cacheSet(key, unified);
    }
  }

  // [T-10] 自由对话 KB 召回
  let kbRefs: KBRef[] = [];
  if (unified.intent === 'free_dialogue' && !ruleCrisis.is_crisis) {
    kbRefs = await searchKB({ query: input.user_input.slice(0, 100), top_k: 3 });
  }

  const reply = adaptToReplyOutput(unified, ruleCrisis);
  const analyze = buildAnalyzeStub(unified, ruleCrisis);

  return {
    trace_id: traceId,
    analyze,
    reply,
    kb_refs: kbRefs,
    crisis: ruleCrisis,
    tokens: { in: 0, out: 0 },
    routing: {
      intent: unified.intent,
      brief: unified.brief,
      skill_called: ruleCrisis.is_crisis
        ? 'skill-crisis (local)'
        : callsUsed === 0
          ? 'cache-hit'
          : unified.intent === 'drill'
            ? 'skill-drill (llm)'
            : 'skill-free-dialogue (llm)',  // [T-10] 自由对话标记
      calls_used: callsUsed,
    },
  };
}
```

---

## 10. 测试用例（3 个核心 case）

> 引用 `docs/02-Prototype.md` §19 测试 + `docs/design/T-09-crisis-fallback.md` §6 红线用例。

### 10.1 Case 1：FD-01 自由对话正常路径

**用例**：阿瑶进入自由对话，输入"今天有点累"。

**步骤**：

1. 进入 `/conversation`
2. 页面渲染：开场白气泡 "我在这。想聊什么都行；不聊也行。"
3. 在 Composer 输入 "今天有点累"，按 Send
4. 等待 ≤ 3 秒
5. AI 气泡出现："听到了。你刚才说的「今天有点累」，我想再听一点。"

**断言**：

| # | 断言 | 验证手段 |
| --- | --- | --- |
| 1 | `POST /api/conversations` 返回 201 + `data.type='free'` | curl |
| 2 | `POST /api/conversations/[id]/messages` 返回 200 + `data.reply.acknowledge` 非空 | curl |
| 3 | `data.analyze.risk === 'low'` | curl |
| 4 | `data.routing.intent === 'free_dialogue'` | curl |
| 5 | `data.routing.calls_used === 1`（首次 cache miss） | curl |
| 6 | `data.kb_refs` 长度 ≤ 3 | curl |
| 7 | 前端 ChatBubble 正确渲染 5 段拼接结果 | E2E |
| 8 | Composer 在 loading 时禁用 | E2E |

**验收**：8 项全过。

### 10.2 Case 2：FD-02 自由对话触发危机（L0 命中）

**用例**：阿瑶在自由对话输入"我今晚不想活了"。

**步骤**：

1. 进入 `/conversation`（已有会话 ID）
2. 在 Composer 输入 "我今晚不想活了"，按 Send
3. 等待 ≤ 1 秒（L0 0 token，比 1 LLM 快）
4. 前端跳到 `<CrisisBanner />`
5. 焦点自动到第 1 条热线（"北京心理危机研究与干预中心 010-82951332"）
6. 点 "我现在安全" → 回到开场白
7. 或点 "我想继续聊" → 跳 `/crisis` 静态页

**断言**：

| # | 断言 | 验证手段 |
| --- | --- | --- |
| 1 | `POST /api/conversations/[id]/messages` 返回 200 + `data.crisis === true` | curl |
| 2 | `data.analyze.risk === 'crisis'` | curl |
| 3 | `data.analyze.crisis_signals` 包含 "不想活" | curl |
| 4 | `data.routing.skill_called === 'skill-crisis (local)'` | curl |
| 5 | `data.routing.calls_used === 0`（L0 命中，0 LLM） | curl |
| 6 | `data.reply.meta.action_hint === 'show_crisis_resources'` | curl |
| 7 | `data.reply.meta.should_continue === false` | curl |
| 8 | 前端渲染 CrisisBanner，BottomNav 隐藏 | E2E |
| 9 | "我现在安全" 后 messages 清空，回到开场白 | E2E |
| 10 | trace_id 唯一且上报（console.log 占位） | E2E |

**验收**：10 项全过。

### 10.3 Case 3：FD-03 自由对话与演练边界（不互窜）

**用例**：阿瑶先在自由对话聊，再进入演练步骤 7 角色扮演。两次输入都用"我今晚不想活了"。

**步骤**：

1. 进入 `/conversation`，输入"我今晚不想活了" → 跳 CrisisBanner
2. 点 "我现在安全" → 回到开场白
3. 进入 `/today` → 进入"拒绝同事甩活"演练 → 步骤 7
4. 在步骤 7 角色扮演输入"我今晚不想活了"
5. 跳到 CrisisBanner（同 T-09 X-2 用例）
6. 点 "我现在安全" → 回到 `/drill` 第 7 步（草稿保留）

**断言**：

| # | 断言 | 验证手段 |
| --- | --- | --- |
| 1 | 自由对话触发 crisis 后，`onSafe` 回到 `/conversation` 开场白 | E2E |
| 2 | 演练步骤 7 触发 crisis 后，`onSafe` 回到 `/drill` 第 7 步 | E2E |
| 3 | 两次 API 调用 `routing.intent` 不同：自由对话=crisis（来自 L0），演练=crisis（来自 L0 + preRoutedIntent 冗余） | curl |
| 4 | 两次 API 调用 `routing.skill_called` 都为 `'skill-crisis (local)'` | curl |
| 5 | 两次 API 调用 `routing.calls_used` 都为 0 | curl |
| 6 | 自由对话触发后 BottomNav 隐藏；演练触发后 BottomNav 也隐藏 | E2E |
| 7 | 自由对话的 messages 在 crisis 后清空；演练的 drill_draft 保留 | E2E |

**验收**：7 项全过 → 跨页面一致性（§3.2）验证通过。

---

## 11. 风险点

### 11.1 P0 风险（必避）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-01 crisis 退出后回到 `/today` 还是 `/conversation`** | T-09 §3.5 默认 onSafe → `/today`；T-10 §3.3 设计 onSafe → 清空 messages 回到开场白 | **C 仲裁**：M2 PoC 阶段自由对话与演练/剧本一致（统一行为），还是自由对话独立（UX 更自然）？本稿建议 **M2 阶段演练回 `/drill` 第 N 步（保留草稿），自由对话回开场白（清空 messages）**——但需 C 在评审时确认 |
| **R-02 自由对话误传 `intent_override='drill'`** | 前端代码 bug 导致演练页面残留 state 污染自由对话 | 单元测试：自由对话 page.tsx 不传 `intent_override`；E2E：演练→自由对话切换后 `intent_override` 为 undefined |
| **R-03 BottomNav 在 crisis 时未隐藏** | FE 实施漏掉条件渲染 | E2E：FD-02 case 断言 8 |
| **R-04 L0 规则层误触发口语化"累死"** | T-09 §2.5 已识别；自由对话场景更多口语 | Q 评测集 v0.5 覆盖；C-1 / C-2 用例 100% 不触发 |
| **R-05 LLM 异常时 fallback 退化到 free_dialogue，绕过 crisis** | orchestrator v2.0.7.1 已修（preRoutedIntent + fallbackForIntent('crisis')） | T-09 §5.2 场景 A 验证 |
| **R-06 自由对话吞掉 crisis 响应** | API 返回 `data.crisis=true` 但前端没渲染 CrisisBanner | 单元测试：page.tsx `if (data.data?.crisis)` 分支覆盖 |
| **R-07 草稿丢失导致用户重新输入** | 自由对话无草稿（M2 阶段），用户在 crisis 后失去上文 | v1.0 行为一致；UX 上"我现在安全"意味着"我不需要刚才那些对话了"——文案可补充 |

### 11.2 P1 风险（follow-up）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-08 自由对话无会话持久化** | 刷新页面后 messages 清空（v1.0 行为） | M3 接入 Supabase；M2 PoC 接受现状 |
| **R-09 cache 命中导致回复过于模板化** | 同一用户输入 5 分钟内复用同一 fallback | T-15 评测集覆盖；cache TTL 可调（5min → 3min） |
| **R-10 KB 召回结果不稳定** | searchKB 占位实现（标签匹配），top_k=3 可能召回无关 KB | M3 换 pgvector；M2 阶段仅日志记录 |
| **R-11 自由对话回复过长** | 5 段拼接后 > 200 字，用户阅读疲劳 | PE 守则：每段 ≤ 60 字；fallback 也控制 ≤ 30 字 |
| **R-12 暗示型危机漏报** | "活着没意思"未覆盖 | T-09 §2.5 已识别；M3 扩展关键词表 |
| **R-13 `loading` 动效在 reduced_motion 时未禁用** | Tailwind animate-bounce 不响应 LPM | T-09 §3.6 禁用所有动效；自由对话 loading dots 需对齐 |
| **R-14 自由对话页 BottomNav 视觉竞争** | 消息列表越长，BottomNav 与列表重叠 | `bg-surface/95 backdrop-blur` 已处理；M2 验证视觉 |

### 11.3 P2 风险（远期）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-15 自由对话无情绪历史趋势** | 用户看不到"我这一周聊了 N 次" | M3 接入"我的进度" |
| **R-16 自由对话无法加剧本** | v1.0 行为；M2 不增量 | M3 实现"加进我的剧本"轻提示 |
| **R-17 多语言** | 自由对话仅支持中文 | M3 i18n |
| **R-18 自由对话夜间模式** | 凌晨场景视觉过亮 | M3 与 LPM 解耦的"深夜模式" |
| **R-19 自由对话评估指标** | 没有"用户满意度 / 留存"度量 | M3 引入满意度 emoji；M2 仅技术指标 |

---

## 12. 验收清单（T-10 实施后）

> 由 Q 在 T-16 / T-17 完成时填写。本节作为 FE + BE 实施后的**自检模板**。

### 12.1 必过项

- [ ] `npm test` 全绿（22 → ≥ 28 测试，T-09 增 6 + T-10 增 2）
- [ ] `npm run typecheck` 全绿
- [ ] 自由对话正常路径 FD-01 E2E 跑通
- [ ] 自由对话危机触发 FD-02 E2E 跑通
- [ ] 自由对话与演练边界 FD-03 E2E 跑通
- [ ] L0 命中后 `routing.calls_used === 0`（trace 日志验证）
- [ ] L0 命中后 `routing.skill_called === 'skill-crisis (local)'`
- [ ] LLM 异常时 fallback 不绕开 L0（preRoutedIntent 机制保留）
- [ ] BottomNav 在 crisis 时隐藏
- [ ] Composer / ChatBubble 直接复用，无第二套实现
- [ ] 兜底页禁用所有动效（与 T-09 §3.6 一致）
- [ ] 兜底页键盘可达（Tab 顺序同 T-09 §11.1）
- [ ] 兜底页屏幕阅读器朗读顺序合理（ARIA-label 正确）
- [ ] 危机事件 trace_id 唯一且上报（占位 console.log）

### 12.2 文案 / 视觉签字

- [ ] PE 签字：自由对话开场白（"我在这。想聊什么都行；不聊也行。"）沿用 v1.0
- [ ] PE 签字：自由对话 fallback 措辞（"听到了。"/"嗯。"/"我在听。"）沿用 v2.0.7.1
- [ ] PE 签字：crisis 兜底话术沿用 T-09 §4.2（"我们现在不太好。"等）
- [ ] FE 签字：自由对话页布局（§2.4）+ 视觉规范
- [ ] FE 签字：BottomNav 隐藏逻辑（§3.5）
- [ ] Q 签字：FD-01 / FD-02 / FD-03 三个 case 全过

### 12.3 拒绝清单自检

- [ ] 自由对话页无 `heart` / `lives` / `gem` / `coin` / `streak-repair` 字段
- [ ] 自由对话页无 `leaderboard` / `league` / `rank` 元素
- [ ] 自由对话页无 "失去" / "丢失" / "你没事吧" / "加油" / "你很勇敢"
- [ ] 自由对话页无 "红色感叹号" / "抖动" / "闪烁" 动效
- [ ] 自由对话页无 "坚持 N 天" / "打卡" / "X 天挑战" 展示
- [ ] 自由对话页无付费墙 / 升级按钮
- [ ] 自由对话页不显示 "开始 12 步演练" / "进入演练" 等强引导
- [ ] 自由对话 AI 回复不催促（"你应该..."/"你必须..."）

---

## 13. follow-up（移交 Coordinator）

| # | 项 | 优先级 | Owner |
| --- | --- | --- | --- |
| F-1 | C 仲裁 R-01（crisis 退出后回到 `/today` 还是 `/conversation`） | P0（M2 实施前） | C |
| F-2 | 自由对话会话持久化（M3 Supabase） | P1（M3） | BE + A |
| F-3 | 自由对话"加进我的剧本"轻提示 | P1（M3） | FE + PE |
| F-4 | 自由对话满意度 emoji 度量 | P2（M3） | Q + PM |
| F-5 | 自由对话夜间模式（与 LPM 解耦） | P2（M3） | FE |
| F-6 | 暗示型危机关键词扩展（"活着没意思"等） | P1（M3） | PE + KE |
| F-7 | `loading` 动效在 reduced_motion 时禁用 | P1（M2 末） | FE |
| F-8 | KB 召回结果前端展示 | P2（M3） | FE |
| F-9 | 自由对话多语言 | P3（M4+） | A + FE |
| F-10 | 自由对话页"我这一周聊了 N 次"统计 | P2（M3） | BE + FE |

---

## 14. 与现有文档的双向追溯

| 本稿章节 | 引用源 |
| --- | --- |
| §1 现状 | `src/app/(app)/conversation/page.tsx` + `plans/m2-poc.md` T-10 |
| §2 BottomNav | `src/components/layout/BottomNav.tsx` + `docs/design/T-01-skill-tree-home.md` §8.2 |
| §3 危机兜底 | `docs/design/T-09-crisis-fallback.md` §3 / §8 |
| §4 演练边界 | `src/lib/ai/orchestrator.ts` v2.0.7.1 preRoutedIntent + `docs/02-Prototype.md` §8.1 状态机 |
| §5 Composer / ChatBubble | `src/components/conversation/Composer.tsx` + `src/components/conversation/ChatBubble.tsx` |
| §6 API 契约 | `src/app/api/conversations/route.ts` + `src/app/api/conversations/[id]/messages/route.ts` + `docs/05-API-Design.md` §9-§10 |
| §7 1-LLM 适配 | `src/lib/ai/orchestrator.ts` v2.0.7.1 + `docs/v2.0.7-llm-architecture.md` |
| §8 crisis-detector | `src/lib/safety/crisis-detector.ts` + `docs/design/T-09-crisis-fallback.md` §2 |
| §9 代码片段 | `src/app/(app)/conversation/page.tsx` + `src/app/api/conversations/[id]/messages/route.ts` + `src/lib/ai/orchestrator.ts` |
| §10 测试用例 | `docs/07-Test-Plan.md` §19 + `docs/design/T-09-crisis-fallback.md` §6 |
| §11 风险 | `rules/safety.md` S-1 ~ S-8 + `docs/quality/gamification-safety-checklist.md` |
| §12 验收 | `plans/m2-poc.md` 验收结果 + `docs/design/T-09-crisis-fallback.md` §11 |
| §13 follow-up | `docs/09-Roadmap.md` §3.3 + T-10 / T-15 / T-16 后续 |

---

> **变更摘要**（v0.1 2026-06-17）：
> 1. 现状分析：v1.0 → v2.0.7.1 入口从顶部菜单降到 BottomNav 第 2 Tab
> 2. BottomNav 兼容性：自由对话页 + BottomNav 共存 + crisis 时隐藏
> 3. 危机兜底耦合：复用 T-09 4 入口 + CrisisBanner + onSafe/onKeepTalking 沿用 v1.0
> 4. 演练边界：自由对话不传 `intent_override`，演练步骤 7/9 必传 `'drill'`
> 5. 组件复用：Composer / ChatBubble 直接复用，**不增量**
> 6. API 契约：3 个端点（M2 实装 2 个，`GET /[id]` M3 实现）
> 7. 1-LLM 适配：走 orchestrator Router + cache 路径，不显式传 `intent_override`
> 8. crisis-detector：6 类 32 模式直接复用，T-10 不扩展关键词表
> 9. 代码片段：3 段（page.tsx + route.ts + orchestrator），均为 v1.0/v2.0.7.1 已实现的设计意图文档化
> 10. 测试用例：3 个核心 case（FD-01 正常 / FD-02 危机 / FD-03 边界）
> 11. 风险：P0 7 条 / P1 7 条 / P2 5 条
> 12. 验收：3 类必过项 + 文案签字 + 拒绝清单自检
> 13. follow-up：10 项移交 Coordinator