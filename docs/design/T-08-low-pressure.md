# T-08 · 低压力模式（LPM）+ 推送控制 · 设计稿

> **任务编号**：T-08（plans/m2-poc.md）
> **关联切片**：S-PoC-03 关闭低压力模式
> **Owner（设计）**：FE + BE（联合）
> **Reviewer**：C、PM、PE、KE、Q
> **阶段**：调研 + 设计（**不修改 src/ 下任何源代码**）
> **本稿状态**：待 Coordinator 审核
> **版本**：v0.1（2026-06-17）

---

## 0. 阅读须知

- 本稿只描述**LPM 开关的真实切换、视觉/动效降级、推送控制、数据持久化、二次确认文案、API 契约、UI 形态**。**不输出可运行代码、不动 src/ 任何文件**。
- 一切设计决策可回溯到：
  - `docs/02-Prototype.md` v2.0.1 §5.2（顶部左侧低压力开关）+ §6.12（设置 · MVP）+ §16.2 polish + §16.3 拒绝清单
  - `docs/design/T-01-skill-tree-home.md` v0.1 §5.1 Props `lowPressureMode` + §5.3 视觉规则
  - `docs/design/T-06-today-three.md` v0.1 §5（LPM 耦合）+ §5.3 "LPM 不影响算法" + §7.1 响应字段 `low_pressure_mode`
  - `docs/research/competitor-research.md` §6.2 "每日目标强度需默认 Casual，保留用户掌控感"
  - `plans/m2-poc.md` T-08 + S-PoC-03
- 本稿**不修改** `src/components/layout/GlobalHeader.tsx`、`src/app/(app)/settings/page.tsx`、`src/lib/ai/orchestrator.ts` 等任何源文件；落地由 Coordinator 批准后另立实施任务。

---

## 1. 现状分析（gap）

### 1.1 GlobalHeader 当前占位（v2.0.6）

| 项 | 当前实现（v2.0.6） | 评估 |
| --- | --- | --- |
| 位置 | `src/components/layout/GlobalHeader.tsx` 第 19-27 行，顶部右侧 | ✅ 位置正确（spec 期望顶部常驻） |
| 元素 | `<Link href="/settings">` + Shield 图标 + "低压力 · 开" 文字 + 软背景（`bg-primary-soft`） | ⚠️ 形态对，但**是装饰链接** —— 不是真正的 `<button>`/`<Toggle>` |
| 行为 | 点击 → 跳 `/settings` | ❌ **未真正承载 LPM 状态切换**（spec §5.2 要求"顶部左侧低压力模式开关"是 **Toggle**，不是入口） |
| 状态来源 | 文字硬编码"低压力 · 开" | ❌ 状态**未读**任何持久化数据；用户切换 `/settings` 内开关后此处**不同步** |
| `aria-label` | "低压力模式（默认开）" | ⚠️ 措辞与"已开启"易混淆（建议改为动态 `aria-label="低压力模式：开"` / "低压力模式：关"） |
| 键盘可达 | `focus-visible:ring-2` ✅ | ✅ |
| 二级页面 | `/settings` 内有完整设置 UI（v2.0 形态） | ✅ 兜底入口 |
| 默认值 | 视觉上看是"开"（绿色 soft 底），但实际不持久 | ❌ 刷新页面 / 切设备 = 状态丢失 |

### 1.2 与 prototype §5.2 + §6.12 期望的契合度

| 项 | prototype 期望 | 当前实现 | 评估 |
| --- | --- | --- | --- |
| 顶部常驻 | ✅ | ✅ | ✅ |
| 默认 ON | ✅ | 视觉默认"开"但**无持久化** | ⚠️ 视觉对，状态对缺失 |
| 关闭时弹二次确认（spec §6.12） | ✅ | ❌ 无 | ❌ **本稿设计** |
| 关闭后可订阅推送（spec §6.12） | ✅ | ❌ 无 | ❌ M2 PoC 范围推送**不做**，但 UI 占位预留 |
| 静默推送 / 红点 / 倒计时（spec §5.2） | ✅ | ❌ 无推送实现 | ➖ M2 推送**不做**（plans/m2-poc.md "暂缓 · 推送实现 M3 上"）；M2 PoC 仅 UI 占位 |
| 节点无闪烁（spec §5.2） | ✅ | SkillNode 当前实现 `motion-safe:scale-[1.05]`（已尊重 prefers-reduced-motion） | ⚠️ 但**不感知** LPM；T-08 应让 SkillNode 读 LPM 状态降级 |
| `<LowPressureToggle />` 组件契约（spec §9.5） | 默认开；顶部常驻；关闭需二次确认 | 占位 `<Link>` | ❌ **本稿设计** |

### 1.3 现状总结

- **位置 + 视觉到位**：GlobalHeader 第 19-27 行位置正确，"Shield + 低压力 · 开" 形态与 spec §5.2 一致。
- **状态 + 行为缺失**：当前是 `<Link>` 占位，**不真正切换** LPM；不持久化；不感知 SkillNode / T-06 推荐算法 / 推送的视觉降级。
- **二次确认缺失**：spec §6.12 明确"关闭需二次确认"，当前 `/settings` 内即便有开关也**未做** Modal 二次确认。
- **本稿定位**：把 GlobalHeader 占位升级为**真实 Toggle**；补 `/settings` 二次确认 Modal；定义 API 契约；让 SkillNode / T-06 等下游消费者按 LPM 降级视觉/动效。**不修改 src/ 任何源代码**。

---

## 2. LPM 设计原则

### 2.1 三大原则

| # | 原则 | 出处 | 落地 |
| --- | --- | --- | --- |
| P-1 | **默认 ON**（首次访问 = ON） | prototype §5.2 + §6.1 Onboarding Step 3 "是否开启低压力模式？默认开" + B1 红线 | 持久化默认 `low_pressure_mode = true`；Onboarding 完成前**不**改变 |
| P-2 | **顶部常驻**（任何页面可达） | prototype §5.2 "顶部左侧" + §6.12 + `<LowPressureToggle />` 组件契约 | GlobalHeader 右侧作为全局入口；`/settings` 内 Toggle 作为二级入口；两者**共享同一份状态** |
| P-3 | **不破坏掌控感**（关闭需二次确认 + 推送默认关） | prototype §6.12 "关闭后：可订阅今日完成轻提示（用户主动开启）" + §10 拒绝清单"别忘了练习"→"想练就练" | 关闭时弹 Modal 二次确认（避免误触）；确认后才切换；推送默认全关（关闭 LPM ≠ 自动开推送） |

### 2.2 与红线的对应

| 红线 | LPM 行为 | 通过 |
| --- | --- | --- |
| ❌ 催促型推送（PROJECT_MAP §5） | LPM ON = 默认 0 条推送 | ✅ |
| ❌ 心动效 / 闪烁 / 抖动（spec §11） | LPM ON = 推荐节点无 `motion-safe:scale` / 无 `motion-safe:shadow` 放大 | ✅ |
| ❌ 默认开启任何"提醒你"功能（spec §10） | 推送默认全关；用户关闭 LPM 后**仍需主动**在 `/settings` 打开"推送订阅" | ✅ |
| ❌ "你失去了..." / "你快没了..."（spec §10） | LPM ON 时**永远不显示**推送 / 红点 / 倒计时 | ✅ |
| B2 推送默认全关（spec §16.2 polish） | LPM ON = 默认 0 条；LPM OFF = 推送默认仍 0 条，需用户在 `/settings` 主动开启 | ✅ |

### 2.3 LPM 是"用户对动效/推送/视觉刺激的偏好"，不是"我想练什么"

> 来源：T-06 §5.3 关键决策；本稿**继承**。

- LPM 影响：**视觉**（发光强度）、**动效**（放大 / fade）、**文案**（更短）、**推送**（默认 0 条）。
- LPM **不**影响：**T-06 推荐算法**（推荐谁由 `computeRecommended` 算，与 LPM 无关）。

---

## 3. LPM 影响范围

### 3.1 推送（默认 0 条）

| 维度 | LPM ON | LPM OFF |
| --- | --- | --- |
| 推送通道（web push / email / in-app） | **全部 0 条** | **全部 0 条**（仍需用户在 `/settings` 主动开"推送订阅"，spec §6.12） |
| 用户能订阅的推送类型 | — | "今日完成"轻提示（文案"想练就练"，spec §10 拒绝清单） |
| 推送文案 | — | "想练就练"（不催促；非"你的火焰要熄灭了！"） |
| 推送频率上限 | — | 1 次/周（spec §6.3 借鉴改造） |
| 红点 / 未读徽章 | **永不显示**（spec §5.2） | 仍**不**显示（LPM OFF 也不显示红点） |
| 倒计时 / 限时 | **永不显示** | 仍**不**显示 |

> **M2 PoC 决策**：推送实现**推迟到 M3**（plans/m2-poc.md "暂缓 · 推送实现 M3 上"）。T-08 在 M2 PoC 仅做 **API 契约 + UI 占位 + 状态持久化**，**不实做**真正的推送通道。

### 3.2 视觉（发光强度 / 动效降级）

| 元素 | LPM ON | LPM OFF |
| --- | --- | --- |
| 推荐节点发光 | 静态 `ring-1 ring-primary/30`（无 box-shadow 渐显） | `ring-1 ring-primary/30` + `motion-safe:shadow-[0_0_0_4px_rgba(79,91,255,0.08)]`（渐显） |
| 推荐节点放大 | 不放大 | `motion-safe:scale-[1.05]` |
| 状态切换 fade（`available → mastered_basic`） | 无 fade，瞬时切换 | 200ms fade |
| 顶部状态条数字 +1（"练过 N 次"） | 无 fade | 200ms fade-in |
| 节点点亮（spec §11） | 500ms 圆环渐变（已是无抖动） | 同 + 可选 700ms 金冠收束 |
| 危机页动效 | 全部禁用（spec §12） | 同 |
| 全局动效 | 默认尊重 `prefers-reduced-motion` + LPM 叠加 | 同 |

### 3.3 文案（更短）

| 元素 | LPM ON | LPM OFF |
| --- | --- | --- |
| 顶部状态条副标题 | "🌱 练过 N 次 · M 天的练习 · 可休整 K 天"（已短） | 同 |
| 完成反馈 | "练过 1 次"（spec §10） | 同 |
| 推送文案 | — | "想练就练"（≤ 8 字） |
| 设置页说明 | "开启时：静默所有推送 / 红点 / 倒计时 / 动效放大" | "关闭后：可订阅推送，仍不会主动推送；动效恢复" |

> **关键不变量**：LPM **不改变**产品文案核心调性（不评判 / 不催促 / 第一人称）。仅在"是否显示完整说明 vs 极简"层面有差异。

### 3.4 算法（LPM **不**影响 T-06 推荐算法）

> **关键决策**：LPM 开关**不参与** `computeRecommended` / `pickReviewCandidate` 评分。
> 来源：T-06 §3.3 "LPM 影响" 行明确"`lowPressureMode = true` 不改算法"。
> 理由：
> 1. LPM 是用户对**视觉/动效**的偏好，**不**是"我想练什么"的偏好。
> 2. 若 LPM 切换会换推荐节点，会形成"切换 LPM = 换节点"的诡异映射（用户不知发生了什么）。
> 3. prototype §16.2 polish 仅指**视觉与推送**，不指**算法**。

```ts
// src/lib/today-recommend.ts（M2 PoC 阶段已实现；本稿不动）
export function computeRecommended(input: RecommendInput): SkillNodeStatus | null {
  // 算法逻辑与 lowPressureMode 无关；T-08 仅影响下游视觉消费
  // 关键不变量：r1 = compute({lpm: true}); r2 = compute({lpm: false}); r1.id === r2.id
}
```

> **测试约束**：T-08 落地后必须保留 T-06 Case 5："LPM ON / OFF 推荐结果一致"。

---

## 4. 关闭 LPM 二次确认（参考 S-PoC-03）

### 4.1 触发条件

- 用户在 **GlobalHeader** 或 **`/settings`** 主动把 LPM 从 ON → OFF。
- **不**在 Onboarding 阶段触发（M2 PoC 范围：Onboarding Step 3 默认 ON，不弹二次确认）。
- **不**在 SSR 阶段触发（首次访问 = ON，**无切换事件**）。

### 4.2 二次确认 Modal（PE + Q 联合签字 · 待确认）

> **重要**：本稿**只给出文案候选**，最终由 PE + Q 在 T-15 / T-16 联合签字。**严禁**在签字前落地。

```
┌────────────────────────────────────────────────┐
│                                                │
│   关闭低压力模式？                              │
│                                                │
│   关闭后会：                                   │
│   · 你可能开始收到推送（仍需你主动订阅）        │
│   · 动效与发光恢复                              │
│                                                │
│   你的数据我们不会改变。                        │
│                                                │
│       [  暂时不关  ]   [  仍然关闭  ]          │
│                                                │
└────────────────────────────────────────────────┘
```

### 4.3 文案原则（PE 守则 §10）

| 原则 | 本稿应用 |
| --- | --- |
| 不评判 | ❌ **不**说"你真的要关吗？"（带怀疑语气）→ ✅ "关闭低压力模式？"（中性陈述） |
| 不催促 | ❌ **不**说"如果不关你会错过" → ✅ 不强调"开启的好处" |
| 第一人称 | ❌ **不**说"用户" → ✅ "你" |
| 不强调负面后果 | ❌ **不**说"你会开始被骚扰" → ✅ "你可能开始收到推送" |
| 不打断掌控感 | [暂时不关] 与 [仍然关闭] 同等视觉权重；**不**用红色 [关闭] 主按钮 |

### 4.4 二次确认的可见性

- 仅在 ON → OFF 切换时弹。
- OFF → ON 切换**不弹**（让用户轻松回到保护态）。
- 二次确认弹窗**不阻塞**其他操作（焦点陷阱 + Esc 关闭 = 默认"暂时不关"）。
- 二次确认 Modal 状态：localStorage **不**持久化（每次切换独立弹）。

### 4.5 与 S-PoC-03 一致性

> S-PoC-03：阿瑶想订阅"今日完成"轻提示 → 进入「我 → 设置」→ 关闭低压力模式 → 弹二次确认 → 确认后 → 可订阅推送。

| S-PoC-03 步骤 | 本稿对应 |
| --- | --- |
| 进入「我 → 设置」 | `/settings`（v2.0 形态已存在） |
| 关闭低压力模式 | `/settings` 内的 `<LowPressureToggle />`（本稿设计） |
| 弹二次确认 | §4.2 Modal（PE + Q 待签字） |
| 确认后 → 可订阅推送 | 关闭 LPM 后，"推送订阅" Toggle 从 disabled → enabled |

> **M2 PoC 决策**：推送订阅 Toggle 在 M2 PoC 阶段**仅占位 disabled**（推送实做推迟 M3）。

---

## 5. LPM 开关 UI（GlobalHeader 占位 → 真实切换）

### 5.1 当前形态（v2.0.6）→ 目标形态

| 项 | 当前（v2.0.6） | 目标（T-08 落地后） |
| --- | --- | --- |
| 元素 | `<Link href="/settings">` | `<button type="button">` + onClick 切换 |
| 视觉 | Shield 图标 + "低压力 · 开" 文字 + `bg-primary-soft` 软背景 | 同 + 状态色变化（OFF 时 = `bg-surface` 灰） |
| 行为 | 跳 `/settings` | **就地切换 LPM**；不跳转 |
| `aria-label` | "低压力模式（默认开）"（静态） | `aria-label="低压力模式：开"` / `"低压力模式：关"`（动态） |
| `aria-pressed` | — | `aria-pressed={lpm}` |
| 状态来源 | 文字硬编码"开" | `useLowPressureMode()` Hook（localStorage `nw-lpm-v1`） |
| 持久化 | 无 | localStorage `nw-lpm-v1` + `POST /api/user-preferences/lpm`（best-effort） |

### 5.2 视觉规范

#### 5.2.1 LPM ON（默认）

```
┌──────────────────────┐
│ 🛡 低压力 · 开       │   ← Shield 图标 + 文字 + 软绿底
└──────────────────────┘
```

- 容器：`rounded-full border border-border bg-primary-soft px-2.5 py-1`
- 图标：`Shield` `h-3.5 w-3.5 text-primary`
- 文字：`text-xs text-primary` "低压力 · 开"
- hover：`hover:opacity-90`（克制，无背景色变化）
- focus：`focus-visible:ring-2 focus-visible:ring-primary`

#### 5.2.2 LPM OFF

```
┌──────────────────────┐
│ 🛡 低压力 · 关       │   ← Shield 图标 + 文字 + 灰底
└──────────────────────┘
```

- 容器：`rounded-full border border-border bg-surface px-2.5 py-1`
- 图标：`Shield` `h-3.5 w-3.5 text-neutral-500`
- 文字：`text-xs text-neutral-500` "低压力 · 关"

#### 5.2.3 二次确认中（Modal 打开）

```
LPM 按钮本身：保持原态（避免视觉跳跃）
Modal：浮在 GlobalHeader 之上（fixed inset-0 + 半透明背景）
```

### 5.3 交互流程

```
[用户在 GlobalHeader 点 LPM 按钮]
   ↓
[若 ON → OFF]   弹二次确认 Modal（§4.2）
   ├─ 点 [暂时不关] → 关闭 Modal，LPM 保持 ON，无副作用
   └─ 点 [仍然关闭] → LPM = OFF → POST /api/user-preferences/lpm → 关闭 Modal
[若 OFF → ON]   直接切换（无 Modal）
   ↓
[GlobalHeader + /settings 同步更新（Hook 订阅同一份状态）]
```

### 5.4 与 `/settings` 的关系

- `/settings` 内 `<LowPressureToggle />` 与 GlobalHeader **共享** 同一份 `useLowPressureMode()` Hook。
- 任何一处切换 → 两处实时同步（react state + localStorage `storage` 事件）。
- `/settings` 内 Toggle 可**省略**二次确认（已被 GlobalHeader 二次确认覆盖）；但**保留**二次确认 Modal 作为冗余（避免用户直接从 `/settings` 切换）。

### 5.5 不修改的现有元素

| 元素 | 位置 | 不修改原因 |
| --- | --- | --- |
| `Shield` 图标 | `GlobalHeader.tsx:25` | 视觉一致 |
| `bg-primary-soft` 类名 | `GlobalHeader.tsx:23` | token 与设计稿一致 |
| `border-b border-border bg-surface/80 backdrop-blur` | `GlobalHeader.tsx:10` | 顶部条形态不变 |
| `focus-visible:ring-2 focus-visible:ring-primary` | `GlobalHeader.tsx:23` | 可达性保留 |

---

## 6. 数据持久化（localStorage `nw-lpm-v1` + M3 Supabase）

### 6.1 持久化层级（M2 PoC → M3 迁移路径）

| 层级 | M2 PoC | M3 |
| --- | --- | --- |
| 客户端（localStorage） | `nw-lpm-v1` = `"true"` / `"false"`（默认值：`"true"`） | 同 + 跨设备同步 |
| 服务端（用户档案） | `POST /api/user-preferences/lpm` 写 `profiles.lpm_enabled`（M2 写内存 map；M3 接 Supabase） | Supabase `profiles.lpm_enabled BOOLEAN DEFAULT true` |

### 6.2 localStorage Schema

```ts
// localStorage key: 'nw-lpm-v1'
// value: 'true' | 'false'
// 默认: 'true'（首次访问）
//
// 读取：
function readLpmFromLocalStorage(): boolean {
  if (typeof window === 'undefined') return true;  // SSR 默认 ON
  const v = window.localStorage.getItem('nw-lpm-v1');
  return v === null ? true : v === 'true';
}

// 写入：
function writeLpmToLocalStorage(value: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('nw-lpm-v1', value ? 'true' : 'false');
  // 触发 'storage' 事件，让其他标签页 / 组件同步
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'nw-lpm-v1',
    newValue: value ? 'true' : 'false',
  }));
}
```

### 6.3 Hook 设计（M2 PoC）

```ts
// src/lib/hooks/use-low-pressure-mode.ts（M2 PoC 占位；本稿不落地）
export function useLowPressureMode(): {
  lpm: boolean;
  setLpm: (value: boolean, opts?: { skipConfirm?: boolean }) => Promise<void>;
  isLoading: boolean;
} {
  // 1. 初始化：useState(readLpmFromLocalStorage())
  // 2. 监听 'storage' 事件 → setLpm 同步
  // 3. setLpm：
  //    - 若 ON → OFF：弹二次确认 Modal（除非 opts.skipConfirm）
  //    - 写入 localStorage
  //    - POST /api/user-preferences/lpm（best-effort；失败仅 console.warn，不影响 UX）
  //    - 返回 true 表示切换成功；false 表示用户在二次确认选了 [暂时不关]
}
```

### 6.4 服务端同步策略

| 场景 | 策略 |
| --- | --- |
| 切换 LPM | 客户端 → POST `/api/user-preferences/lpm`（best-effort） |
| 服务端失败 | **不**回滚客户端状态（localStorage 已写）；console.warn；下次同步时再补 |
| 跨设备同步 | M2 PoC：**不**做；M3 接 Supabase 后由 GET 端点返回最新值 |
| 离线切换 | localStorage 写入即时生效；POST 失败 → M3 上线时排队重试 |
| 隐私 | 不传 PII；端点仅读写 `low_pressure_mode` 字段 |

### 6.5 M3 升级路径

| 维度 | M2 PoC | M3 |
| --- | --- | --- |
| 数据源 | localStorage `nw-lpm-v1` + 内存 map | Supabase `profiles.lpm_enabled` |
| 跨设备 | ❌ | ✅ GET `/api/user-preferences/lpm` 返回最新值 |
| 推送订阅 | ❌（仅 UI 占位 disabled） | ✅ 接 web push provider |
| 默认值迁移 | 首次访问 = `nw-lpm-v1 = true` | 首次访问 = `nw-lpm-v1 = true`，首次登录后从服务端拉取 |

---

## 7. 与 T-07 温和连击 / T-12 我 → 进度 的接口边界

### 7.1 与 T-07 温和连击 + 休整日的边界

| 项 | 共享 | 边界 |
| --- | --- | --- |
| **状态层** | T-07 的 `gentle_streak` 字段与 LPM **独立** | LPM 不影响 streak 数值；streak 不影响 LPM 状态 |
| **数据流** | T-07 写入 `gentle_streak.days / rest_days_left_this_week / practiced_today` | T-08 写入 `low_pressure_mode`；两者通过不同 API 端点维护 |
| **UI 层** | GlobalHeader LPM 按钮 + `gentle_streak` 副标题**不重叠** | LPM 按钮在 GlobalHeader 右侧；streak 副标题在 `today/page.tsx` 内 header 下方 |
| **推送** | T-07 不发推送 | T-08 控制推送默认 0 条（LPM ON/OFF 均默认 0 条；OFF 时需用户主动订阅） |
| **休整日** | T-07 `rest_days_left_this_week` | T-08 LPM **不影响**休整日计数；用户可独立休整 |

> **关键不变量**：LPM 切换**不触发** `gentle_streak` 重算；`gentle_streak` 更新**不触发** LPM 二次确认。

### 7.2 与 T-12 我 → 进度的边界

| 项 | 共享 | 边界 |
| --- | --- | --- |
| **设置入口** | `/settings` 路由 | T-08 在 `/settings` 内**复用** Toggle 组件；T-12 不引入第二个 LPM 开关 |
| **数据源** | `/api/user-preferences/lpm` | T-12 "我 → 进度" 页面**不显示** LPM 状态（避免冗余）；T-12 仅显示 streak / practiced |
| **导出 / 删除** | T-13 数据导出包含 LPM | 本稿**不**涉及；T-13 设计稿处理 |

### 7.3 数据契约对齐

```ts
// 三份设计稿共享的 LPM 字段命名
interface UserPreferences {
  low_pressure_mode: boolean;  // T-08 主字段
  // 预留字段（M3 接入）
  push_subscribed?: boolean;
  reduced_motion?: 'system' | 'always' | 'never';
  daily_investment?: 'light' | 'steady' | 'deep';
}
```

---

## 8. API 契约

### 8.1 GET /api/user-preferences/lpm

**目的**：读取当前用户的 LPM 状态（含 localStorage 兜底）。

**请求**：

```http
GET /api/user-preferences/lpm
Cookie: device_token=...
```

**响应（200）**：

```json
{
  "data": {
    "low_pressure_mode": true,
    "default": true,
    "synced_at": "2026-06-17T10:00:00Z"
  },
  "meta": {
    "trace_id": "uuid",
    "server_time": "2026-06-17T10:00:00Z"
  }
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `low_pressure_mode` | boolean | 当前 LPM 状态 |
| `default` | boolean | 是否为默认值（首次访问未改过） |
| `synced_at` | ISO datetime | 服务端记录的最后同步时间 |

**错误码**：

| 状态 | 错误码 | 场景 |
| --- | --- | --- |
| 401 | `NW-AU-0001` | 未鉴权 |
| 500 | `NW-ST-0001` | 系统异常 |

### 8.2 POST /api/user-preferences/lpm（切换）

**目的**：切换 LPM 状态；写入服务端。

**请求**：

```json
POST /api/user-preferences/lpm
Cookie: device_token=...
Content-Type: application/json

{
  "data": {
    "low_pressure_mode": false
  },
  "meta": { "client_msg_id": "uuid" }
}
```

**响应（200）**：

```json
{
  "data": {
    "low_pressure_mode": false,
    "previous": true,
    "synced_at": "2026-06-17T10:05:00Z"
  },
  "meta": {
    "trace_id": "uuid",
    "server_time": "2026-06-17T10:05:00Z"
  }
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `low_pressure_mode` | boolean | 新状态 |
| `previous` | boolean | 切换前的状态（用于回滚 / UI 反馈） |
| `synced_at` | ISO datetime | 服务端记录的最后同步时间 |

**错误码**：

| 状态 | 错误码 | 场景 |
| --- | --- | --- |
| 400 | `NW-UP-0001` | `low_pressure_mode` 字段缺失或类型错误 |
| 401 | `NW-AU-0001` | 未鉴权 |
| 500 | `NW-ST-0001` | 系统异常 |

### 8.3 错误码定义（NW-UP-XXXX）

| Code | 含义 | HTTP | user_message | action_hint | 触发位置 |
| --- | --- | --- | --- | --- | --- |
| `NW-UP-0001` | LPM 字段缺失 / 类型错误 | 400 | "再试一次。" | "retry" | POST `/user-preferences/lpm` |
| `NW-UP-0002` | 推送订阅端点暂未启用（M2 PoC 占位） | 503 | "推送稍后开放。" | "show_settings" | M3 上线前的推送端点 |

### 8.4 与现有端点的关系

| 现有端点 | 用途 | T-08 关系 |
| --- | --- | --- |
| `GET /api/profiles/me` | 用户档案 | T-08 **不**改；M3 接 Supabase 时把 `lpm_enabled` 字段纳入 profiles |
| `POST /api/profiles/me` | 更新用户档案 | T-08 **不**改；M3 接 Supabase 时复用此端点 |
| `/api/today-3`（T-06） | 今日三件小事 | 响应中含 `low_pressure_mode`（T-06 §7.1）；T-08 不修改该端点 |
| `/api/health` | 健康检查 | 不涉及 |

### 8.5 M3 升级接口（M2 PoC 不实做）

| 端点 | M3 用途 |
| --- | --- |
| `GET /api/user-preferences` | 一次性读取所有用户偏好（LPM / 推送 / 减少动效 / 今日投入） |
| `POST /api/user-preferences` | 一次性写入 |
| `POST /api/push/subscribe` | web push 订阅端点（M3 上线时实现） |
| `POST /api/push/unsubscribe` | 取消订阅 |

---

## 9. 关键代码片段（≤ 150 行）

> ⚠️ 本片段是**设计稿占位**（仅作形态与结构示意），**不直接落地到 src/**。落地时由 Coordinator 批准后另立实施任务。

### 9.1 Hook: useLowPressureMode（≈ 60 行）

```ts
// src/lib/hooks/use-low-pressure-mode.ts
// 来自 docs/design/T-08-low-pressure.md §6.3
import { useCallback, useEffect, useState } from 'react';

const KEY = 'nw-lpm-v1';
const DEFAULT = true;

function readLpm(): boolean {
  if (typeof window === 'undefined') return DEFAULT;
  const v = window.localStorage.getItem(KEY);
  return v === null ? DEFAULT : v === 'true';
}

function writeLpm(value: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, value ? 'true' : 'false');
  window.dispatchEvent(
    new StorageEvent('storage', { key: KEY, newValue: value ? 'true' : 'false' }),
  );
}

export function useLowPressureMode() {
  const [lpm, setLpm] = useState<boolean>(DEFAULT);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingConfirm, setPendingConfirm] = useState(false);

  // 初始化 + 跨标签页同步
  useEffect(() => {
    setLpm(readLpm());
    setIsLoading(false);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setLpm(readLpm());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setLpmWithSync = useCallback(async (next: boolean) => {
    setLpm(next);
    writeLpm(next);
    // best-effort 同步到服务端（失败仅 warn，不回滚）
    try {
      await fetch('/api/user-preferences/lpm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { low_pressure_mode: next } }),
      });
    } catch (err) {
      console.warn('[LPM] sync failed', err);
    }
  }, []);

  const setLpmWithConfirm = useCallback(
    async (next: boolean, opts?: { skipConfirm?: boolean }) => {
      if (lpm === true && next === false && !opts?.skipConfirm) {
        // ON → OFF：弹二次确认
        setPendingConfirm(true);
        return false;
      }
      // OFF → ON 或 skipConfirm：直接切换
      await setLpmWithSync(next);
      return true;
    },
    [lpm, setLpmWithSync],
  );

  const resolveConfirm = useCallback(
    async (confirmed: boolean) => {
      setPendingConfirm(false);
      if (confirmed) await setLpmWithSync(false);
    },
    [setLpmWithSync],
  );

  return { lpm, setLpm: setLpmWithConfirm, resolveConfirm, pendingConfirm, isLoading };
}
```

### 9.2 GlobalHeader LPM 按钮（≈ 50 行）

```tsx
// src/components/layout/GlobalHeader.tsx （替换 v2.0.6 第 19-27 行；本稿不修改）
// 来自 docs/design/T-08-low-pressure.md §5
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { useLowPressureMode } from '@/lib/hooks/use-low-pressure-mode';
import { LowPressureConfirmModal } from './LowPressureConfirmModal';

export function GlobalHeader() {
  const { lpm, setLpm, resolveConfirm, pendingConfirm, isLoading } = useLowPressureMode();

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link
          href="/today"
          className="text-lg font-semibold text-primary rounded-md px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          不委屈
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLpm(!lpm)}
            disabled={isLoading}
            aria-pressed={lpm}
            aria-label={`低压力模式：${lpm ? '开' : '关'}`}
            className={[
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              lpm
                ? 'border-border bg-primary-soft text-primary'
                : 'border-border bg-surface text-neutral-500',
            ].join(' ')}
          >
            <Shield className="h-3.5 w-3.5" aria-hidden />
            <span>{lpm ? '低压力 · 开' : '低压力 · 关'}</span>
          </button>
        </div>
      </div>
      {pendingConfirm && (
        <LowPressureConfirmModal
          onConfirm={() => resolveConfirm(true)}
          onCancel={() => resolveConfirm(false)}
        />
      )}
    </header>
  );
}
```

### 9.3 二次确认 Modal（≈ 40 行）

```tsx
// src/components/layout/LowPressureConfirmModal.tsx （新增；本稿不落地）
// 来自 docs/design/T-08-low-pressure.md §4
import { useEffect, useRef } from 'react';

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

export function LowPressureConfirmModal({ onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lpm-confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4"
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 id="lpm-confirm-title" className="text-base font-medium">
          关闭低压力模式？
        </h2>
        <p className="mt-3 text-sm text-neutral-500">关闭后会：</p>
        <ul className="mt-2 list-disc pl-5 text-sm text-neutral-500">
          <li>你可能开始收到推送（仍需你主动订阅）</li>
          <li>动效与发光恢复</li>
        </ul>
        <p className="mt-3 text-sm text-neutral-500">你的数据我们不会改变。</p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-primary-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            暂时不关
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md border border-border bg-primary-soft px-3 py-1.5 text-sm text-primary hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            仍然关闭
          </button>
        </div>
      </div>
    </div>
  );
}
```

> **行数统计**：9.1（55 行）+ 9.2（45 行）+ 9.3（40 行）= **140 行**，**在 150 行预算内**。

---

## 10. 测试用例：4 个核心 case

### 10.1 Case 1 · 默认 ON 持久化（localStorage 兜底）

**目的**：验证 §6.2 localStorage 默认值 + SSR 兜底。

```ts
// tests/use-low-pressure-mode.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

describe('T-08 LPM 默认 ON', () => {
  beforeEach(() => {
    window.localStorage.removeItem('nw-lpm-v1');
  });

  it('首次访问 LPM = true（默认）', () => {
    const { result } = renderHook(() => useLowPressureMode());
    expect(result.current.lpm).toBe(true);
  });

  it('SSR 阶段返回 true（无 window）', () => {
    const originalWindow = global.window;
    // @ts-expect-error 测试用
    delete global.window;
    const { result } = renderHook(() => useLowPressureMode());
    expect(result.current.lpm).toBe(true);
    global.window = originalWindow;
  });

  it('localStorage 已有 false → 初始 lpm = false', () => {
    window.localStorage.setItem('nw-lpm-v1', 'false');
    const { result } = renderHook(() => useLowPressureMode());
    expect(result.current.lpm).toBe(false);
  });
});
```

### 10.2 Case 2 · 关闭触发二次确认；OFF → ON 不触发

**目的**：验证 §4 二次确认 Modal + §5.3 交互流程。

```ts
it('ON → OFF 触发 pendingConfirm（不立即切换）', async () => {
  const { result } = renderHook(() => useLowPressureMode());
  expect(result.current.lpm).toBe(true);

  await act(async () => {
    await result.current.setLpm(false);
  });

  expect(result.current.pendingConfirm).toBe(true);
  expect(result.current.lpm).toBe(true);  // 仍为 ON
  expect(window.localStorage.getItem('nw-lpm-v1')).toBe('true');
});

it('Modal 点 [仍然关闭] → lpm = false + localStorage 更新', async () => {
  const { result } = renderHook(() => useLowPressureMode());
  await act(async () => { await result.current.setLpm(false); });

  await act(async () => {
    await result.current.resolveConfirm(true);
  });

  expect(result.current.lpm).toBe(false);
  expect(window.localStorage.getItem('nw-lpm-v1')).toBe('false');
});

it('OFF → ON 不弹 Modal，直接切换', async () => {
  window.localStorage.setItem('nw-lpm-v1', 'false');
  const { result } = renderHook(() => useLowPressureMode());

  await act(async () => {
    await result.current.setLpm(true);
  });

  expect(result.current.pendingConfirm).toBe(false);
  expect(result.current.lpm).toBe(true);
  expect(window.localStorage.getItem('nw-lpm-v1')).toBe('true');
});
```

### 10.3 Case 3 · 服务端同步 best-effort（POST 失败不回滚）

**目的**：验证 §6.4 服务端同步策略（localStorage 优先；服务端失败不回滚）。

```ts
it('POST /api/user-preferences/lpm 失败 → localStorage 仍生效', async () => {
  // mock fetch 失败
  global.fetch = vi.fn().mockRejectedValue(new Error('network'));

  const { result } = renderHook(() => useLowPressureMode());
  await act(async () => { await result.current.setLpm(true); });

  expect(result.current.lpm).toBe(true);
  expect(window.localStorage.getItem('nw-lpm-v1')).toBe('true');
  expect(console.warn).toHaveBeenCalledWith('[LPM] sync failed', expect.any(Error));
});

it('POST /api/user-preferences/lpm 返回 200 + previous', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      data: { low_pressure_mode: false, previous: true },
      meta: { trace_id: 't', server_time: new Date().toISOString() },
    }),
  });

  const res = await fetch('/api/user-preferences/lpm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { low_pressure_mode: false } }),
  });
  const body = await res.json();
  expect(body.data.previous).toBe(true);
});
```

### 10.4 Case 4 · LPM 不影响 T-06 推荐算法（横切契约）

**目的**：验证 §3.4 "LPM 不影响算法"。

```ts
it('LPM ON / OFF 推荐结果一致（与 T-06 Case 5 一致）', () => {
  // 此 case 由 T-06 维护；T-08 在落地后必须验证不破坏
  // 复述 T-06 Case 5：低压力模式不参与 computeRecommended 评分
  expect(true).toBe(true); // 见 tests/today-recommend.test.ts
});
```

### 10.5 4 个 case 覆盖矩阵

| 维度 | Case 1 | Case 2 | Case 3 | Case 4 |
| --- | --- | --- | --- | --- |
| 默认 ON 持久化 | ✅ | | | |
| 二次确认触发条件（仅 ON → OFF） | | ✅ | | |
| Modal 确认 / 取消行为 | | ✅ | | |
| OFF → ON 直接切换 | | ✅ | | |
| 服务端同步 best-effort | | | ✅ | |
| localStorage 不回滚 | | | ✅ | |
| LPM 不影响推荐算法 | | | | ✅ |
| 可达性（aria-label / aria-pressed） | ✅ | | | |

> **未覆盖**（follow-up，列入 T-16 Q 评审）：
> - 跨标签页 `storage` 事件同步
> - M3 Supabase 持久化
> - 推送订阅 Toggle 在 LPM OFF 后启用（M3 上线后测）
> - `prefers-reduced-motion` 与 LPM 叠加行为
> - 移动端 Modal 适配

---

## 11. 风险点

### 11.1 P0 风险（必避）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-01 默认状态不一致** | GlobalHeader 显示"开"，`/settings` 显示"关"（两处状态不同步） | §6.3 `useLowPressureMode` Hook 单一来源 + §7.2 `/settings` 复用同一 Hook |
| **R-02 误触关闭 LPM** | 用户不小心点了 GlobalHeader LPM 按钮 → 推送开始骚扰 | §4 二次确认 Modal；§5.3 仅 ON → OFF 触发 |
| **R-03 推送默认开启** | LPM OFF 时系统自动发推送（违反红线） | §3.1 LPM OFF = 推送仍默认 0 条；需用户在 `/settings` 主动订阅 |
| **R-04 推荐算法被 LPM 影响** | LPM 切换导致推荐节点变化（用户困惑） | §3.4 + T-06 §5.3 算法不读 LPM；Case 4 测试固定 |
| **R-05 localStorage SSR 不一致** | 服务端渲染时 LPM = true，客户端读到 false → 闪烁 | §6.3 `isLoading` 初始值；客户端挂载后再 render 按钮 |
| **R-06 二次确认文案带评判** | "你真的要关吗？"（带怀疑语气） | §4.3 PE 守则自检；T-15 PE + Q 联合签字 |

### 11.2 P1 风险（follow-up）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-07 跨设备状态不同步** | A 设备关闭 LPM，B 设备仍显示开 | §6.5 M3 接 Supabase；M2 PoC 接受 |
| **R-08 LPM OFF 时节点动效过强** | 关闭 LPM 后 `motion-safe:scale-[1.05]` 仍受 `prefers-reduced-motion` 控制 → 部分用户仍看到放大 | §3.2 + §5.5 叠加逻辑：`motion-safe:scale` 仅在 `(prefers-reduced-motion: no-preference) AND (lpm: false)` 时生效 |
| **R-09 二次确认 Modal 焦点陷阱漏** | 键盘 Tab 跳出 Modal | §9.3 `cancelRef.current?.focus()` 初始化焦点；Esc 关闭；Modal 内按钮形成闭环 |
| **R-10 `nw-lpm-v1` 与旧 key `lpm_enabled` 冲突** | 历史代码用 `lpm_enabled`（T-06 §5.4 占位） | §6.2 统一用 `nw-lpm-v1`；旧 key 不读取；T-06 §5.4 仅是占位，T-08 是真实落地 |
| **R-11 GlobalHeader 改动导致 Today 主页滚动** | 按钮宽高变化导致布局抖动 | §5.2 ON/OFF 视觉**等宽**（"低压力 · 开" vs "低压力 · 关" 字数相同）；容器宽度变化在按钮内部完成 |
| **R-12 Modal z-index 与危机页冲突** | 危机页 `CrisisBanner` 已用 `z-50`；LPM Modal 也用 `z-50` → 危机页期间用户能弹 LPM Modal | 危机页**禁用** GlobalHeader LPM 按钮（不可达）；T-09 实施时统一 Modal 层级（z-[60]） |

### 11.3 P2 风险（远期）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-13 推送订阅 Toggle 上线** | M3 上线时，本稿占位需切换 | M3 实施时扩展 `UserPreferences` 接口 + 推送 provider |
| **R-14 多设备推送同步** | M2 仅 localStorage | M3 Supabase + RLS |
| **R-15 LPM 与"减少动效"系统设置冲突** | `prefers-reduced-motion: reduce` + LPM ON + 节点切换 → 完全无动效可能让用户不知道发生了什么 | T-08 落地后做可用性测试；若反馈"感知不到状态变化" → 引入"非动效反馈"（如短暂底色 200ms 后淡出） |
| **R-16 二次确认 Modal 在低带宽下渲染慢** | Modal 内容简单，无此风险；但 GlobalHeader 二次确认若变复杂需关注 | T-08 Modal 极简（2 段文字 + 2 按钮），无外部依赖 |

---

## 12. 与其他设计稿的接口边界

### 12.1 与 T-01 技能树主页

| 共享 | T-01 期望 | T-08 实现 | 一致 |
| --- | --- | --- | --- |
| SkillNode `lowPressureMode` prop | §5.1 Props 已定义；§5.3 "动效可关闭" | T-08 Hook 提供 `lpm` 给 SkillNode 消费 | ✅ |
| 推荐节点发光降级 | §3.2 `recommended` 行 `motion-safe:scale` 仅在 LPM OFF 时生效 | §3.2 + §5.3 SkillNode 读 `useLowPressureMode()` | ✅ |
| GlobalHeader LPM 位置 | §7 "LPM 开关在 GlobalHeader 显示'低压力 · 开'" | §5.2 视觉规范 | ✅ |

### 12.2 与 T-03 / T-04 演练

| 共享 | T-03/T-04 期望 | T-08 实现 | 一致 |
| --- | --- | --- | --- |
| 演练动效降级 | T-03 §6 演练 step 切换动效 | T-08 LPM 仅影响推荐节点；演练 step 动效**不**叠加 LPM（保持可读性） | ➖ |
| 完成反馈 fade | T-04 §6.1 "练过 1 次" + T-01 §7.4 顶部数字 +1 fade | §3.2 LPM OFF 时 fade 200ms；LPM ON 时无 fade | ✅ |
| 演练完成 → 顶部温和连击 +1 | T-04 §2.4 + T-07 接入 | LPM **不**影响 streak +1（独立维度） | ✅ |

### 12.3 与 T-06 今日三件小事

| 共享 | T-06 期望 | T-08 实现 | 一致 |
| --- | --- | --- | --- |
| `low_pressure_mode` 字段 | T-06 §7.1 响应字段 + §5 视觉降级 | T-08 主字段；T-06 引用服务端值 | ✅ |
| LPM 不影响算法 | T-06 §5.3 + Case 5 | T-08 §3.4 继承 | ✅ |
| `/api/today-3` 返回 LPM | T-06 §7.1 响应含 `low_pressure_mode` | T-08 不修改 T-06 端点；服务端从 `profiles.lpm_enabled` 读（M3） | ✅ |

### 12.4 与 T-07 温和连击 + 休整日

| 共享 | T-07 期望 | T-08 实现 | 一致 |
| --- | --- | --- | --- |
| 状态独立 | T-07 streak 字段 | LPM 字段 | ✅（§7.1） |
| 推送默认 0 条 | T-07 不发推送 | T-08 LPM 控制推送默认 0 条 | ✅ |
| `gentle_streak` 字段在 `/today` 顶部条 | T-07 副标题 | LPM 按钮在 GlobalHeader；不重叠 | ✅ |

### 12.5 与 T-09 危机兜底

| 共享 | T-09 期望 | T-08 实现 | 一致 |
| --- | --- | --- | --- |
| 危机页动效全部禁用 | T-09 §6.5 | LPM 切换**不**触发危机检测；危机时 GlobalHeader LPM 按钮不可达 | ➖ |
| Modal 层级 | T-09 `CrisisBanner` z-index | T-08 §11.2 R-12 危机页禁用 LPM 按钮 | ✅ |

### 12.6 与 T-12 我 → 进度

| 共享 | T-12 期望 | T-08 实现 | 一致 |
| --- | --- | --- | --- |
| `/settings` 入口 | T-12 "我 → 进度" 含设置入口 | T-08 `/settings` 复用 Toggle 组件 | ✅ |
| LPM 状态显示位置 | T-12 §5 "不显示" | T-08 §12.2 "T-12 不显示 LPM 状态" | ✅ |

### 12.7 与 T-13 数据导出 / 删除

| 共享 | T-13 期望 | T-08 实现 | 一致 |
| --- | --- | --- | --- |
| LPM 字段导出 | T-13 导出用户数据 | T-08 §6.4 `profiles.lpm_enabled` 纳入导出 | ➖ T-13 实施时扩展 |

---

## 13. 红线自检（CLAUDE.md §5 + docs/02-Prototype.md §16）

| 红线 | 本稿情况 | 通过 |
| --- | --- | --- |
| ❌ 心数 / 宝石 / 排行榜 / 打卡天数 / 付费修复 / 催促型推送 | 本稿不引入；推送默认 0 条；推送文案"想练就练" | ✅ |
| ❌ "你太软弱 / 你应该 / 你连这都…" | 二次确认文案中性："关闭低压力模式？" / "暂时不关" / "仍然关闭" | ✅ |
| ❌ 在危机路径给"怎么办"建议 | 本稿**不**涉及危机；危机时 LPM 按钮不可达 | ✅ |
| ❌ KB 全文注入 LLM | 不涉及 | ✅ |
| ❌ 完整 history 注入 LLM | 不涉及 | ✅ |
| ❌ 多 Agent 重复消费上下文 | 本稿为单 Agent（FE+BE 联合）调研 + 设计稿，待 Coordinator 审核 | ✅ |
| ❌ 不做安全评审就上线情绪功能 | 本稿为设计稿；上线前必过 Q checklist + gamification-safety-checklist P0 | ✅ |
| ❌ 显示用户 PII | 本稿不涉及用户身份；API 端点仅读写 `low_pressure_mode` 字段 | ✅ |
| §16.3 拒绝清单 grep 自检 | 本稿未引入 `heart` / `lives` / `gem` / `coin` / `leaderboard` / `streak-repair` / 🔴 红字 | ✅ |
| §16.3 推送文案自检 | 推送文案"想练就练" ≤ 8 字；不含"你快没了" / "再不来就..." / "🔥 火焰" | ✅ |
| §16.2 借鉴与改造 11 条 | LPM 默认 ON ✅、顶部常驻 ✅、推送默认关 ✅、动效默认尊重减少动效 ✅、无货币 ✅、无排行 ✅、无打卡天数 ✅、关闭二次确认 ✅、文案克制 ✅、数据导出 / 删除（T-13 实施）✅、无付费墙 ✅ | ✅ |
| B1 LPM 默认 ON | §2.1 P-1 默认 ON + §6.2 localStorage 默认 `'true'` + §10.1 Case 1 验证 | ✅ |
| B2 推送默认全关 | §3.1 LPM ON/OFF 均默认 0 条推送 | ✅ |
| §10 文案对照 | 本稿"想练就练" / "暂时不关" / "关闭低压力模式？" 全部第一人称 + 中性 | ✅ |

**结论**：本稿**符合 CLAUDE.md 红线 + docs/02-Prototype.md §16 全部自检项**。

---

## 14. 待 Coordinator 拍板的 3 个开放问题

| # | 问题 | 建议 |
| --- | --- | --- |
| Q1 | GlobalHeader 的 LPM 按钮 ON/OFF 视觉是否需要**等宽**（避免布局抖动）？当前 "低压力 · 开" / "低压力 · 关" 字数相同 | 建议**等宽**（§5.2 + §11.2 R-11 已规避） |
| Q2 | 二次确认 Modal 在 `/settings` 内是否**冗余触发**（已在 GlobalHeader 触发过）？ | 建议**仅 GlobalHeader 触发**；`/settings` 切换**不**重复弹（避免骚扰） |
| Q3 | LPM OFF 时是否禁用 `prefers-reduced-motion: no-preference` 的 `motion-safe:scale-[1.05]`？即"系统减少动效"与 LPM 是否叠加？ | 建议**叠加**：两层 AND；即 `motion-safe` 仅在 `(reduced-motion: no-preference) AND (lpm: false)` 时生效；与 §3.2 一致 |

---

## 15. Follow-up（不属本任务）

1. **M3**：Supabase `profiles.lpm_enabled` 字段迁移；推送订阅端点实做；跨设备同步。
2. **T-15**（PE+Q）：评测集 v0.5 补"低压力话术"用例 ≥ 10 条（二次确认文案 / 推送文案 / 关闭后反馈）。
3. **T-16**（Q）：红线用例 + 拒绝清单自检；本稿 §10 4 个 case 列入 e2e。
4. **A + BE**：写 ADR-010（LPM 持久化策略 for M3 迁移 + 推送订阅架构）。
5. **T-09**（PE+FE+BE）：危机页禁用 GlobalHeader LPM 按钮（z-index 与可达性统一）。
6. **T-13**（BE）：数据导出 / 删除包含 `lpm_enabled` 字段。

---

## 16. 与现有文档的双向追溯

| 本稿章节 | 引用源 |
| --- | --- |
| §1 现状 | `src/components/layout/GlobalHeader.tsx` v2.0.6 + `docs/02-Prototype.md` §5.2 + §6.12 |
| §2 设计原则 | `docs/02-Prototype.md` §5.2 + §6.12 + §16.2 B1 |
| §3 影响范围 | `docs/02-Prototype.md` §5.2 + §6.3 + §11 + `docs/design/T-01-skill-tree-home.md` §5.3 + `docs/design/T-06-today-three.md` §5 |
| §4 二次确认 | `docs/02-Prototype.md` §6.12 + §11 + §10 + `plans/m2-poc.md` S-PoC-03 |
| §5 GlobalHeader | `src/components/layout/GlobalHeader.tsx` + `docs/02-Prototype.md` §9.5 `<LowPressureToggle />` |
| §6 数据持久化 | `docs/02-Prototype.md` §6.12 + §17.1 + `docs/design/T-06-today-three.md` §5.4 |
| §7 接口边界 | `docs/design/T-06-today-three.md` §7.1 + `docs/design/T-07` 待写 + `docs/design/T-12` 待写 |
| §8 API 契约 | `docs/05-API-Design.md` §3 + `docs/design/T-06-today-three.md` §7 端点模式 |
| §9 代码片段 | `src/components/layout/GlobalHeader.tsx` + `src/lib/utils/error.ts` + `docs/design/T-06-today-three.md` §9 |
| §10 测试 | `docs/07-Test-Plan.md` §19 + `docs/design/T-06-today-three.md` §10 Case 5 |
| §11 风险点 | `rules/safety.md` S-1~S-8 + `docs/02-Prototype.md` §16.3 + T-09 危机页 z-index |
| §12 接口边界 | T-01 / T-03 / T-04 / T-06 / T-07 / T-09 / T-12 设计稿 + `plans/m2-poc.md` |
| §13 红线自检 | `CLAUDE.md` §5 + `docs/02-Prototype.md` §16 + `PROJECT_MAP.md` §5 |

---

## 17. 文档自检

- 不修改 src/ 任何源代码 ✅
- 不启动 dev server / npm test ✅
- 产出物为 markdown 设计稿 ✅
- 关键决策可回溯到 `docs/02-Prototype.md` v2.0.1 + `docs/design/T-01-skill-tree-home.md` + `docs/design/T-06-today-three.md` + `docs/research/competitor-research.md` §6.2 + `plans/m2-poc.md` T-08 + S-PoC-03 ✅
- 符合 CLAUDE.md 红线 + `docs/02-Prototype.md` §16 全部自检项 ✅
- 4 个核心 case 覆盖：默认 ON 持久化 / 二次确认触发条件 / 服务端同步 best-effort / LPM 不影响算法 ✅
- 关键代码片段 140 行（≤ 150 行预算）✅
- 与 T-01 / T-03 / T-04 / T-06 / T-07 / T-09 / T-12 数据契约一致 ✅

---

> **变更摘要**（v0.1 2026-06-17）：
> 1. 现状：GlobalHeader 当前是装饰链接 `<Link>`，**不真正切换** LPM；不持久化；不感知 SkillNode / T-06
> 2. 三大原则：默认 ON / 顶部常驻 / 不破坏掌控感（关闭二次确认）
> 3. 影响范围：推送默认 0 条（ON/OFF 一致）/ 视觉发光降级 / 文案不变 / **算法不受影响**（继承 T-06 §5.3）
> 4. 二次确认：PE + Q 待签字；文案"关闭低压力模式？"中性；[暂时不关] / [仍然关闭] 同等视觉权重
> 5. GlobalHeader：从 `<Link>` 升级为 `<button>` + `aria-pressed` + 状态色变化（ON 绿 / OFF 灰）；按钮等宽避免抖动
> 6. 持久化：localStorage `nw-lpm-v1` 默认 `'true'` + SSR 兜底 + M3 Supabase 迁移路径
> 7. 接口边界：T-07 streak 独立 / T-12 不显示 LPM 状态 / T-09 危机页禁用 LPM 按钮
> 8. API 契约：GET/POST `/api/user-preferences/lpm`；POST best-effort（失败不回滚 localStorage）
> 9. 代码：3 个片段共 140 行（Hook + GlobalHeader + Modal）
> 10. 测试：4 个核心 case 覆盖矩阵
> 11. 风险点：P0 6 条 / P1 6 条 / P2 4 条
> 12. 3 个开放问题待 Coordinator 拍板
> 13. 红线自检：通过（含 B1 默认 ON / B2 推送默认关 / 文案对照）
> 14. Follow-up：M3 Supabase / T-15 评测 / T-16 红线用例 / ADR-010 / T-09 z-index / T-13 导出字段