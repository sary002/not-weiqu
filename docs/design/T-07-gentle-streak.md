# T-07 · 温和连击 + 休整日 · 设计稿

> **任务编号**：T-07（plans/m2-poc.md）
> **关联切片**：S-PoC-02 缺失连击（3 天没打开 → 第 4 天打开 → 显示 0 天，无"丢失"叙事）+ 全部 17 切片共用
> **关联任务**：T-01（FE 技能树主页）/ T-06（FE+BE 今日三件小事）/ T-08（FE+BE 低压力模式）/ T-12（FE+BE 我 → 进度）
> **Owner（设计）**：FE + BE（联合）
> **Reviewer**：C、PM、PE、KE、Q
> **阶段**：调研 + 设计（**不修改 src/ 下任何源代码**）
> **本稿状态**：待 Coordinator 审核
> **版本**：v0.1（2026-06-17）

---

## 0. 阅读须知

- 本稿只描述**形态、状态机、数据契约、API、UI、JSX 骨架**。**不输出可运行代码、不动 src/ 任何文件**。
- 一切设计决策可回溯到：
  - `docs/02-Prototype.md` v2.0.1 §6.2（顶部状态条）/ §7.6（温和连击改造）/ §8.3（状态机）/ §18 polish P-09（去 🔥 去"连续"）
  - `docs/research/competitor-research.md` §6.1（必须避免：Streak 丢失焦虑）
  - `docs/quality/gamification-safety-checklist.md` §3 RL-1 ~ RL-4（P0 红线）
  - `docs/design/T-01-skill-tree-home.md` v0.1 §7（顶部状态条双层方案）
  - `docs/design/T-06-today-three.md` v0.1 §6（与温和连击的耦合接口）
  - `plans/m2-poc.md` T-07 + S-PoC-02
- 本稿**不修改** `src/app/(app)/today/page.tsx`、`src/components/skilltree/SkillNode.tsx` 等任何源文件；落地由 Coordinator 批准后另立实施任务。
- **红线承诺**：本稿所有文案、动效、状态机均通过 `gamification-safety-checklist.md` P0/P1 自检；**绝不**出现"你失去 X 天""你快没了""再不来就..."等任何**丢失叙事**。

---

## 1. 现状分析（gap）

### 1.1 与 v2.0.1 polish + prototype §7.6 的契合度

| 项 | v2.0.1 / §7.6 期望 | 当前实现 | 评估 |
| --- | --- | --- | --- |
| 顶部文案"练过 N 次 · M 天的练习 · 可休整 K 天" | "3 天的练习"（去"连续"去"🔥"）| `today/page.tsx:78` 写死 `🌱 练过 {total} 次 · 3 天的练习 · 可休整 1 天` | ✅ 形态对；**写死** 3 天 / 1 天 |
| 缺失连击静默归零 | "缺失 1 天 = 静默归零"（不发推送、不弹窗、不写"已丢失"）| **完全缺失** | ❌ 本稿设计 |
| 休整日 = "不连续也不断签" | 每周 1-2 天可标记为休整日，不计入断签 | **完全缺失** | ❌ 本稿设计 |
| 缺失无任何"丢失"动效 | 数字归零**无动效**（避免"丢失"感知）| 当前实现仅 1 个静态数字 | ⚠️ 当前无动效 = 形态对，但数据流未接通 |
| 进度数据 `practiced` | 累计练习次数（**非**天数）| `totalPracticed` 来自 `sections[].skills[].practiced` 内存写死 | ✅ 字段名对；**写死** 12 次 |
| `practicedToday` 标志 | 顶部副标题不强调"今日已练" | `practicedToday = 0` 写死 | ⚠️ 字段存在但未消费 |
| 顶部"可休整 K 天"小字 | K 为本周剩余休整日，**不强调**"你必须休整" | "可休整 1 天" 写死 | ✅ 形态对 |
| LPM 开关 | 顶部常驻（LPM ON 时数字变化静默） | `GlobalHeader` 占位 | ⚠️ Toggle 化由 T-08 实施 |
| 缺失日推送记录 = 0 | 推送默认 0 条 | 当前未实现推送 | ✅ T-08 推送控制会承接 |
| 数据存储 | 内存 / `localStorage`（M2 PoC）| 全部内存写死 | ⚠️ M2 接受；M3 接 Supabase |

### 1.2 与其他任务的依赖关系

| 任务 | T-07 关系 | 当前状态 |
| --- | --- | --- |
| **T-01**（FE 技能树主页） | T-07 消费 T-01 §7 顶部状态条"双层方案"（GlobalHeader LPM + today 内温和连击） | T-01 v0.1 已落地 |
| **T-06**（FE+BE 今日三件小事） | T-06 §6 定义了 `gentle_streak` 接口 + 推荐算法引用；T-07 是 **接口提供方** | T-06 v0.1 已落地 |
| **T-08**（FE+BE LPM） | T-08 Toggle 化 `GlobalHeader.LPM`；T-07 顶部数字 fade-in 受 LPM 控制 | T-08 待写 |
| **T-12**（FE+BE 我 → 进度） | T-12 复用 T-07 数据（"温和连击：3 天的练习 · 可休整 1 天"） | T-12 待写 |
| **T-04**（BE 12 步演练后端） | T-04 §2.4 step 12 完成后触发 T-07 温和连击 +1 副作用 | T-04 v0.1 已落地 |
| **T-09**（危机兜底） | T-07 缺失静默归零不与危机信号耦合（危机由独立路径处理） | T-09 v0.1 已落地 |

### 1.3 现状总结

- **形态到位**：顶部副标题 "🌱 练过 N 次 · M 天的练习 · 可休整 K 天" 已在 `today/page.tsx:78` 落地；文案遵循 polish P-09（去"🔥"去"连续"加"可休整"）。
- **数据层缺失**：3 个数字（N 次 / M 天 / K 天）**全部写死**（12 / 3 / 1）；缺失日**未实现**静默归零；休整日**未实现**用户标记。
- **写入路径缺失**：T-04 step 12 完成 → 温和连击 +1 的副作用**未实做**；T-06 必做完成 → 温和连击 +1 **未实做**。
- **横向接口清晰**：T-06 已定义 `gentle_streak` 接口契约（`days` / `rest_days_left_this_week` / `practiced_today`）；T-07 本稿承接实现。
- **本稿定位**：把"温和连击 + 休整日"从**写死**升级到**真实数据 + 状态机 + API + UI 交互**，给 T-06 / T-12 / T-04 留出消费 hook。

---

## 2. 设计原则（不显示"你失去 X 天"）

### 2.1 核心立场

> **连击的"快乐"必须大于"丢失的恐惧"。**
> —— `docs/02-Prototype.md` §7.6 核心伦理原则

**借鉴自 Duolingo Streak 的设计，**改写**为情绪脆弱用户安全的形态：

| 维度 | Duolingo 原版 | 不委屈温和连击 | 来源 |
| --- | --- | --- | --- |
| 文案 | "🔥 23 days!" | "3 天的练习"（去"连续"去"🔥"）| prototype §6.2 / §18 P-09 |
| 数字增长动效 | 火焰升级、颜色变化 | 数字 fade-in 200ms（受 LPM 控制）| prototype §11 |
| 数字归零动效 | 火焰熄灭动画 + 红色"已丢失" | **无任何动效**（避免"丢失"感知）| prototype §11 + 竞品研究 §6.1 |
| 缺失叙事 | "你失去了 23 天连击" | **不显示**（缺席即不出现）| RL-2 评判性文案 + 竞品研究 §6.1 |
| 推送召回 | "Don't break your streak! 🦉" | 默认 0 推送；邀请式："我们在这里" | RL-4 强推进式推送 + 竞品研究 §6.1 |
| 付费修复 | "200 gems to repair" | **不存在** | 竞品研究 §6.1 / §6.2 |
| 休整日 | Streak Freeze（付费道具） | 每周 1-2 天免费休整，无任何"使用"叙事 | prototype §7.6 + §18 B4 |

### 2.2 红线（绝对禁止）

> 来自 `docs/quality/gamification-safety-checklist.md` §3 P0 红线。

| RL | 红线 | T-07 落地方式 |
| --- | --- | --- |
| **RL-1** 评分类元素 | 无"坚持 7 天解锁高级教练"等评分 | T-07 数字仅"练过 N 次 + M 天的练习 + 可休整 K 天"，**不**与"等级 / 解锁"挂钩 |
| **RL-2** 评判性文案 | 无"你失去了" "你快没了" "再不来就..." | T-07 §10 测试用例 + §11 红线用例 grep 自检**强制**通过 |
| **RL-3** "错" / 红叉 / 抖动 | 缺失日**无**抖动 / **无**红字 | T-07 §5 数字归零无动效；§8.3 静态色 |
| **RL-4** 强推进推送 | 默认 0 推送；最多 1 次/周邀请型 | T-08 推送控制；T-07 不涉及推送 |

### 2.3 设计原则（F → 落地）

| # | 原则 | 落地 |
| --- | --- | --- |
| P1 | **静默归零** | 缺失日 0 推送、0 弹窗、0 "丢失"动效、0 "丢失"文案 |
| P2 | **休整 = 不算断** | 休整日 `practiced = 0` 但 `streak` 不断；UI 文案"今天先休息" 而非 "已使用休整" |
| P3 | **顶部不抢眼** | 副标题 `text-sm text-neutral-500`，与"今日" `<h1>` 形成层级 |
| P4 | **数字 +1 fade-in 200ms** | LPM ON 时**无**动效；LPM OFF 时 fade-in |
| P5 | **数字归零无动效** | 永远不写"丢失"叙事；用户**不点**进进度页就感知不到归零 |
| P6 | **休整按钮永远可达** | LPM 状态**不**影响休整入口（"休息"是基本权利）|
| P7 | **可休整 K 天小字** | "可休整 K 天" 与 M 天并列；**不强调**"你必须休整" |
| P8 | **永远灰色** | 顶部条全部 `text-neutral-500`；**不**用 `text-primary`（避免"成长"叙事抢眼）|

---

## 3. 数据模型

### 3.1 `gentle_streak` 字段定义

> 来源：`docs/design/T-06-today-three.md` §6.1（接口契约）+ 本稿扩展。

```ts
/**
 * 温和连击状态（M2 PoC 形态：内存 / localStorage；M3 接 Supabase）
 * 关键不变量：
 *   - 缺失日（未练过 + 未休整）= 静默归零，0 叙事
 *   - 休整日 = 不计入断签，streak 持续
 *   - 任何字段**不**与"等级 / 解锁 / 评分"挂钩
 */
interface GentleStreak {
  /** 连续 N 天都有"练过"（缺失静默归零；休整日不计入断签） */
  days: number;

  /** 每周可休整天数（默认 1，最多 2；M2 写死 1） */
  restDaysPerWeek: number;

  /** 本周已使用休整天数（0 / 1 / 2） */
  restDaysUsedThisWeek: number;

  /** 本周剩余休整日（= restDaysPerWeek - restDaysUsedThisWeek） */
  restDaysLeftThisWeek: number;

  /** 今日是否已练过 ≥ 1 次 */
  practicedToday: boolean;

  /** 最近一次"练过"的日期 ISO 'YYYY-MM-DD'（休整日**不更新**） */
  lastPracticedDate: string | null;

  /** 最近一次"休整"的日期 ISO 'YYYY-MM-DD' */
  lastRestDate: string | null;

  /** 当前周起始日期 ISO 'YYYY-MM-DD'（用于重置 restDaysUsedThisWeek） */
  currentWeekStart: string;
}
```

### 3.2 字段语义与约束

| 字段 | 类型 | 约束 / 不变量 |
| --- | --- | --- |
| `days` | `number` | 0 ≤ days ≤ 999；缺失（非休整日未练）后下次练习时**重置为 1**；休整日**不**重置 |
| `restDaysPerWeek` | `number` | 默认 1，最多 2；用户在「我 → 设置」可调（**M2 写死 1**）|
| `restDaysUsedThisWeek` | `number` | 0 ≤ used ≤ restDaysPerWeek；每周一 0:00 重置为 0 |
| `restDaysLeftThisWeek` | `number` | = restDaysPerWeek - restDaysUsedThisWeek；用于 UI 显示与 [休整] 按钮可见性 |
| `practicedToday` | `boolean` | 今日 UTC 0:00 ~ 23:59 内是否练过 ≥ 1 次；休整日**不**算 practicedToday |
| `lastPracticedDate` | `string \| null` | ISO date；**仅**练习后更新；休整日**不**更新 |
| `lastRestDate` | `string \| null` | ISO date；休整后更新；用于去重（"今日已休整"幂等性）|
| `currentWeekStart` | `string` | 本周一 0:00 UTC ISO date；每周一更新 |

### 3.3 不变量（数学约束）

```ts
// 状态机不变量（每日 0:00 重算 + 副作用触发后增量更新）
assert(restDaysUsedThisWeek + restDaysLeftThisWeek === restDaysPerWeek);
assert(restDaysLeftThisWeek >= 0);
assert(days >= 0);

// 每日 0:00 UTC 触发 daily reset
// 若今日有"练过"  → days += 1
// 若今日"未练过 + 非休整" → days = 0（静默）
// 若今日"休整"  → days 不变（休整 = 不算断）
```

### 3.4 存储位置（M2 PoC）

| 位置 | 说明 |
| --- | --- |
| **服务端**：in-memory Map（`globalThis.__gentleStreakStore`）| M2 接受；M3 接 Supabase `gentle_streak` 表 + `rest_days_log` 表 |
| **客户端**：`localStorage.gentle_streak_cache`（可选 TTL 5min）| 降低 GET 频率；M3 改为 SWR 拉取 |
| **关联数据**：不持久化节点状态（由 T-01 维护）、不持久化 gentle_streak 全部历史（仅最近 1 周）|

### 3.5 与"今日"页的契约（T-06 引用）

```ts
// T-06 §7.1 GET /api/today-3 响应（与本稿 §8.1 一致）
{
  "gentle_streak": {
    "days": 3,                              // ← T-07 提供
    "rest_days_left_this_week": 1,          // ← T-07 提供
    "practiced_today": false                // ← T-07 提供
  }
}
```

---

## 4. 休整日规则

### 4.1 规则矩阵

| 用户行为 | 当日状态 | `days` 变化 | `restDaysUsedThisWeek` 变化 | UI 表现 |
| --- | --- | --- | --- | --- |
| 练过 ≥ 1 次 | `practiced_today = true` | +1（昨日 +1）| **不变** | 顶部"练过 N+1 次 · (M+1) 天的练习 · 可休整 K 天" |
| 点 [休整] 按钮 | `rested_today = true` | **不变** | +1 | 顶部条不变；推荐节点降级；"今日 X/3"变"今天先休息" |
| 未练过 + 未休整 | `idle_today = true` | **缺失日**：下次练习时 `days` 重置为 1（静默）| **不变** | 顶部**无**"你失去 X 天" 任何叙事；用户进首页才**间接**感知（"天的练习" 数字回 1）|
| 休整 + 练过 | 同一天内 | `days +1`（**不算休整**）| **不变**（休整 vs 练过互斥，UI 决定） | 优先显示练过态 |

### 4.2 静默归零（核心规则）

> **缺失 1 天 = 静默归零**（不发推送、不弹窗、不写"已丢失"）。
> —— prototype §7.6 / §8.3 / §18 B3

**实现规则**：

```ts
// 每日 0:00 UTC 触发 dailyReset()
function dailyReset(streak: GentleStreak, today: string): GentleStreak {
  // 1. 缺失日判定：昨日既未练过也未休整
  const yesterday = addDays(today, -1);
  const practicedYesterday = streak.lastPracticedDate === yesterday;
  const restedYesterday = streak.lastRestDate === yesterday;

  if (!practicedYesterday && !restedYesterday && streak.lastPracticedDate !== null) {
    // 缺失日（非休整日）= 静默归零
    // ⚠️ 关键：归零**不**立即发生；下次练习时在 incrementStreak() 内重置为 1
    // 这样用户在 0:00 不会看到"你失去了 3 天"——他们看不到 0
    // 这就是 prototype §7.6 要求的"无任何丢失叙事"
  }

  // 2. 每周一 0:00 重置休整日
  if (isMonday(today) && streak.currentWeekStart !== getWeekStart(today)) {
    streak.restDaysUsedThisWeek = 0;
    streak.currentWeekStart = getWeekStart(today);
  }

  return streak;
}

// 副作用：练习完成时调用
function incrementStreak(streak: GentleStreak, today: string): GentleStreak {
  streak.practicedToday = true;
  streak.lastPracticedDate = today;

  if (streak.lastPracticedDate === today && streak.days > 0) {
    // 连续 2 天都练过 → +1
    streak.days += 1;
  } else {
    // 缺失后首次练习 → 重置为 1（用户**感知不到**"你失去了 X 天"）
    streak.days = 1;
  }
  return streak;
}
```

**为什么缺失日不立即归零？**：
- 若在 0:00 立即把 `days` 改为 0，**任何**进入首页的用户都会看到"0 天的练习"——这本身就是"丢失"叙事。
- 延迟到下次练习时重置为 1：用户**只看到**"1 天的练习"，**永远不**看到 0。
- 副作用：UI 副标题**不变化**直到下次练习——但**没有任何"丢失"感知**。

### 4.3 休整日幂等性

| 场景 | 行为 |
| --- | --- |
| 用户点 [休整] 后再点 [取消] | **允许**（M2 范围）；`restDaysUsedThisWeek - 1` |
| 用户今日已休整，再次点 [休整] | **幂等**：`lastRestDate === today` → 直接返回；`restDaysUsedThisWeek` 不再 +1 |
| 休整后用户练了 1 次 | 当日优先级 = 练过；`restDaysUsedThisWeek` 不变（练过优先于休整）|
| 周日休整后周一未练 | 周一 0:00 重置 `restDaysUsedThisWeek = 0`；周一**无**断签（因为周日休整了）|
| 跨周末休整（周日休整 + 周一断）| 周一 0:00 判定：周日已休整 → `restedYesterday = true` → **不**断签 |

### 4.4 边缘情况

| 场景 | 处理 |
| --- | --- |
| 用户从未练过（首次打开）| `days = 0`、`lastPracticedDate = null`；UI 显示"0 天的练习"——**这是"新起点"**，不是"丢失" |
| 休整日 = 0 时点 [休整] | 按钮**不可见**（`canRest = false`）|
| `restDaysPerWeek` = 2 的用户休整 2 次 | 第三次点 [休整] → 按钮不可见；服务端返回 `NW-GS-0001` |
| 跨年 / 跨月 | 按 ISO 周计算；`currentWeekStart` 跨年自动更新 |
| 客户端本地时区 vs UTC | **所有日期字段用 UTC ISO 'YYYY-MM-DD'**；UI 文案**不**显示具体日期 |

### 4.5 状态机图（来自 prototype §8.3 扩展）

```
[INIT: days=0, used=0]
   ↓  首次练习
[ACTIVE: days=1, used=0]
   ↓  每日 0:00 daily reset
   ├─ 昨日练过 → days += 1 → [ACTIVE: N]
   ├─ 昨日未练过 + 未休整 → 静默 → 状态不变（直到下次练习重置为 1）
   └─ 昨日休整 → 状态不变
   ↓  POST /api/gentle-streak/rest-day
[RESTED: used=1, days 不变]
   ├─ 同日练过 → 升级为 [ACTIVE: N+1, used 不变]
   └─ 次日 0:00 → daily reset（昨日休整 → 不断签）
```

---

## 5. 温和连击 UI（顶部状态条，不打勾不闪烁）

### 5.1 形态

```
┌────────────────────────────────────────────────────────┐
│ 今日                                                │
│ 🌱 练过 12 次 · 3 天的练习 · 可休整 1 天            │  ← polish P-09 落地
│                                                     │
│ ─ 边界成长路 ─────────────────────────                │
│                                                     │
│  §1 觉察 ...                                        │
│  §2 命名                                            │
│  §3 表达（半透明）                                    │
│  ...                                                │
│                                                     │
│  [ 今天就到这里 ]                                    │
│  不委屈是成长陪伴，不替代专业心理咨询。              │
└────────────────────────────────────────────────────────┘
```

### 5.2 视觉规范

| 元素 | 样式 | 备注 |
| --- | --- | --- |
| 副标题文字 | `text-sm text-neutral-500` | **不**用 `text-primary`；**不**用 `text-foreground` |
| 🌱 emoji | `text-sm`（与文字同行）| **不**用 🔥（polish P-09）；**不**用 ⭐；**不**用 🏆 |
| "练过 N 次" | `text-sm` 中性灰 | N = 累计；**不**与"等级"挂钩 |
| "M 天的练习" | `text-sm` 中性灰 | M = 连续天数；**不**写"连续"（polish P-09）|
| "可休整 K 天" | `text-sm` 中性灰 | K = 本周剩余；**不**用红色提示"快用完" |
| 中点分隔 | `·` 中点 + 空格 | prototype §6.2 形态；**不**用 `|`、**不**用 `•` |
| 位置 | 主页 `today/page.tsx` 内 `<header>` 副标题 | 与 T-01 §7.3 一致 |
| 动效（N+1）| LPM OFF: fade-in 200ms；LPM ON: 无动效 | prototype §11 |
| 动效（归零）| **永远无动效**（避免"丢失"感知）| prototype §11 |
| `aria-label` | `aria-label="练过 12 次，3 天的练习，本周可休整 1 天"` | 屏幕阅读器完整朗读 |

### 5.3 数字变化规则

| 场景 | 数字变化 | 动效 | 文案 |
| --- | --- | --- | --- |
| 练习完成 | `练过 N → N+1` + `天的练习 M → M+1`（若昨日练过）| LPM OFF: fade-in 200ms；LPM ON: 无 | 不变（数字自动更新）|
| 缺失日 | 0:00 数字**不变**（静默）| **无** | 不变；用户感知**仅**在下次练习时看到 `M = 1` |
| 休整日 | 数字**不变** | **无** | 副标题保持 "可休整 K-1 天" |
| 休整取消 | 数字**不变** | **无** | 副标题恢复 "可休整 K 天" |
| 每周一 0:00 | `可休整 K → restDaysPerWeek` | **无** | 副标题更新为新的周 |

### 5.4 顶部条的"不抢眼"原则

> **关键决策**：副标题**不**用主色、**不**用大字号、**不**用粗体；保持 `text-sm text-neutral-500`。
> 理由：
> 1. prototype §6.2 polish P-09 已明确"去 🔥 去 连续 加 休整"——这三个数字**不**是"成就"，是"状态"。
> 2. RL-1 红线"评分类元素"——任何"练过 N 次"与"等级 / 解锁"挂钩 = 命中红线。
> 3. RL-2 红线"评判性文案"——任何"坚持 N 天 / 击败 80% 用户" = 命中红线。

### 5.5 移动端适配

| 断点 | 形态 |
| --- | --- |
| `xs` < 480px | 副标题保持单行；**不**换行（字号保持 `text-sm` 不缩小）|
| `sm/md` | 同桌面端 |
| `lg+` | 同桌面端；副标题保持单行（**不**放大字号）|

---

## 6. 休整日 UI

### 6.1 [休整] 按钮位置

> **位置决策**：休整按钮**不**放在顶部状态条内（避免按钮混在数据条里）；**放在 T-06 "今日 X/3" 进度条右侧**（与 T-06 联动）。

```
┌────────────────────────────────────────────────────────┐
│ 今日                                                │
│ 🌱 练过 12 次 · 3 天的练习 · 可休整 1 天            │
│                                                     │
│ ┌─ 今日 0/3 ──────────────────────────────────┐  │
│ │  ◯ ◯ ◯    1 件必做 + 2 件选做    [休整]   │  │  ← T-06 + T-07 联合
│ └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

> T-06 §8.1 进度条已设计为"今日 X/3" + [休整] 按钮；本稿定义按钮的**点击行为 + 二次确认**。

### 6.2 一次确认 vs 二次确认（设计决策）

> **决策**：本稿采用**一次确认**（弹 toast "已休息" + 取消入口），**不**弹二次确认 Modal。
>
> 理由：
> 1. **休整是基本权利**，不是"危险操作"——不应当被"二次确认"暗示为"你做错了什么"。
> 2. prototype §11 明确"危险操作才二次确认"——休整不危险。
> 3. 弹窗会形成"中断感"（RL-6 强弹窗红线）。
> 4. 取消入口放在"今天先休息"态的右侧（6.4 节），用户**永远可逆**。

### 6.3 一次确认 UI

```
[休整]  →  点击后：
              ├─ API 成功 → 进度条变 "今天先休息" + [取消] 文字按钮
              └─ API 失败 → toast "我们没听清，再说一次？" (P5 软错误)
```

**视觉规范**：

| 元素 | 样式 | 备注 |
| --- | --- | --- |
| [休整] 按钮 | `text-sm text-neutral-500 hover:text-foreground` 文字按钮 | T-06 §8.1；**不**做主按钮；**不**做按钮色 |
| 进度条 "今天先休息" 替换 | `text-sm text-neutral-500` 灰色 | **不**写"休整成功" / **不**写"✓ 已休整" / **不**做绿色反馈 |
| [取消] 按钮 | `text-sm text-neutral-500 hover:text-foreground` 文字按钮 | **永远**可达；与 [休整] 同型；不强调 |
| Toast（失败时）| 顶部 3s 自动消失；"我们没听清，再说一次？" | P5 软错误；**不**写"休整失败" |
| 动效 | **无** | 静默切换；**不**用 fade；**不**用 shake；**不**用 red flash |
| ARIA | `aria-label="今日先休息"` | 屏幕阅读器朗读 "已休息" 而非"已使用休整" |

### 6.4 "今天先休息" 态

```
┌────────────────────────────────────────────────────────┐
│ 今日                                                │
│ 🌱 练过 12 次 · 3 天的练习 · 可休整 0 天            │  ← K 减 1
│                                                     │
│ ┌─ 今日 ─────────────────────────────────────┐  │
│ │   今天先休息                       [取消]  │  │
│ └─────────────────────────────────────────────────┘  │
│                                                     │
│ ─ 边界成长路 ─────────────────────────                │
│           §1 觉察                                    │
│           ...（无推荐节点，节点全为 available）        │  ← 推荐降级
│                                                     │
│  [ 今天就到这里 ]                                    │
└────────────────────────────────────────────────────────┘
```

**关键行为**：
- 必做节点 `recommended → available`（无发光）；用户**仍**可点技能树上其他节点（自由探索）。
- "今日 X/3" 进度条**不显示**（避免"0/3"暗示"未完成"）。
- 顶部状态条"天的练习"数字**不变**（休整 ≠ 缺失）。
- 顶部状态条"可休整 K 天" 减 1。
- [取消] 文字按钮**永远**可达；点后恢复 `recommended` 节点 + "可休整 K+1 天"。

### 6.5 "今天先休息" 态的文案自检

> **绝不允许**的文案（grep 自检必过）：

| ❌ 禁用 | ✅ 推荐 |
| --- | --- |
| "已使用休整" | "今天先休息" |
| "你休整了 1 天" | （不显示具体使用次数）|
| "休整成功" | （不显示反馈）|
| "已消耗休整额度" | （不显示经济叙事）|
| "休整日 = 你的避风港" | （不显示抒情）|

### 6.6 休整日与 LPM 的关系

> **LPM 不影响休整入口**——LPM 是"动效 / 推送 / 红点"的偏好，**不**是"用户是否需要休息"的偏好。
>
> - LPM ON：休整按钮**永远**可达；休整后**无**动效；**无**推送
> - LPM OFF：休整按钮**永远**可达；休整后**无**动效（休整**不**属于"完成反馈"，不参与动效）

---

## 7. 与低压力模式（LPM）的耦合

### 7.1 LPM 影响范围（本稿范围）

| 维度 | LPM ON（默认）| LPM OFF | 来源 |
| --- | --- | --- | --- |
| 数字 +1 fade-in | **无**（避免刺激）| fade-in 200ms | prototype §11 |
| 数字归零动效 | **无**（永远）| **无**（永远）| prototype §11 |
| 推荐节点降级（休整后）| 静态切换（无 fade）| 静态切换（无 fade）| 休整**不**参与"完成反馈"动效 |
| 推送 | 默认 0 | 用户可订阅"今日完成"（T-08 实施）| RL-4 红线 + prototype §5.2 |
| 休整按钮可达性 | **永远**可达 | **永远**可达 | 休整 = 基本权利 |
| 休整后动效 | **无** | **无** | 休整**不**属于完成反馈 |

### 7.2 LPM 与缺失静默归零的关系

> **缺失静默归零与 LPM 解耦**——无论 LPM ON / OFF，缺失日都**无**任何动效 / 推送 / 弹窗。
>
> 理由：静默归零是 prototype §7.6 / §18 B3 的**伦理底线**，**不**是 LPM 控制的"动效偏好"。

### 7.3 LPM 与休整日的关系

> **LPM 不影响休整入口**——休整是用户的基本权利，**不**受"动效偏好"控制。
>
> - LPM ON：用户主动点 [休整] 即可（**无**任何"邀请推送"）。
> - LPM OFF：用户主动点 [休整] 即可；**不**触发"今日已休整 1 天"推送（T-08 推送控制）。

### 7.4 LPM 数据流（M2 PoC 占位）

> M2 PoC 阶段：LPM 状态从 `GlobalHeader` 读占位（**当前未 Toggle 化**），默认值 `true`。
> T-08 实施时：LPM Toggle 化 + 推送控制；T-07 **不修改** GlobalHeader 源代码。

```ts
// 客户端读 LPM 占位（M2）
function readLowPressureMode(): boolean {
  if (typeof window === 'undefined') return true;  // SSR 默认
  return localStorage.getItem('lpm_enabled') !== 'false';  // 默认 true
}
```

---

## 8. API 契约

### 8.1 GET /api/gentle-streak

**目的**：拉取用户当前的温和连击状态（前端拉取 + 顶部状态条渲染 + 休整按钮可见性判定）。

**请求**：

```http
GET /api/gentle-streak
Cookie: device_token=...
```

**响应（200）**：

```json
{
  "data": {
    "gentle_streak": {
      "days": 3,
      "rest_days_per_week": 1,
      "rest_days_used_this_week": 0,
      "rest_days_left_this_week": 1,
      "practiced_today": false,
      "last_practiced_date": "2026-06-15",
      "last_rest_date": null,
      "current_week_start": "2026-06-15"
    },
    "today": "2026-06-17"
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
| `data.gentle_streak.days` | number | 连续天数；缺失后下次练习时重置为 1（静默）|
| `data.gentle_streak.rest_days_per_week` | number | 每周可休整日（M2 写死 1）|
| `data.gentle_streak.rest_days_used_this_week` | number | 本周已用 |
| `data.gentle_streak.rest_days_left_this_week` | number | 本周剩余（= per_week - used）|
| `data.gentle_streak.practiced_today` | boolean | 今日是否练过 ≥ 1 次 |
| `data.gentle_streak.last_practiced_date` | ISO date \| null | 最近练习日期；休整日**不更新** |
| `data.gentle_streak.last_rest_date` | ISO date \| null | 最近休整日期 |
| `data.gentle_streak.current_week_start` | ISO date | 当前周起始（每周一 0:00 UTC）|
| `data.today` | ISO date | 服务端判定；客户端**不传** |

**错误码**：

| 状态 | 错误码 | 场景 |
| --- | --- | --- |
| 401 | `NW-AU-0001` | 未鉴权 |
| 500 | `NW-ST-0001` | 系统异常 |

### 8.2 POST /api/gentle-streak/rest-day

**目的**：标记今日为休整日 + 休整日计数 -1 + 推荐节点降级。

**请求**：

```http
POST /api/gentle-streak/rest-day
Cookie: device_token=...
Content-Type: application/json

{ "data": {}, "meta": { "client_msg_id": "uuid" } }
```

**响应（200）**：

```json
{
  "data": {
    "rested_today": true,
    "gentle_streak": {
      "days": 3,
      "rest_days_per_week": 1,
      "rest_days_used_this_week": 1,
      "rest_days_left_this_week": 0,
      "practiced_today": false,
      "last_practiced_date": "2026-06-15",
      "last_rest_date": "2026-06-17",
      "current_week_start": "2026-06-15"
    },
    "today_view": {
      "label": "今天先休息",
      "required": null,
      "can_rest": false
    }
  },
  "meta": {
    "trace_id": "uuid",
    "server_time": "2026-06-17T10:00:00Z"
  }
}
```

**关键字段**：
- `rested_today: true`：今日已休整；幂等
- `gentle_streak.days`：**不变**（休整 ≠ 缺失）
- `gentle_streak.rest_days_used_this_week`：+1
- `gentle_streak.last_rest_date`：更新为今日
- `today_view.label`：前端渲染用 = "今天先休息"
- `today_view.required`：`null`（必做节点降级）
- `today_view.can_rest`：`false`（[休整] 按钮**不**再显示）

**错误码**：

| 状态 | 错误码 | 场景 | user_message | 触发位置 |
| --- | --- | --- | --- | --- |
| 400 | `NW-GS-0001` | 本周休整已用完 | "本周休整已用过。" | POST `/rest-day` |
| 400 | `NW-GS-0002` | 今日已练过 ≥ 1 次 | "你今天已经练过了。" | POST `/rest-day`（优先级：练过 > 休整）|
| 401 | `NW-AU-0001` | 未鉴权 | — | 通用 |
| 500 | `NW-ST-0001` | 系统异常 | "我们没听清，再说一次？" | 通用 |

### 8.3 错误码定义（NW-GS-XXXX）

| Code | 含义 | HTTP | user_message | action_hint | 触发位置 |
| --- | --- | --- | --- | --- | --- |
| `NW-GS-0001` | 本周休整已用完 | 400 | "本周休整已用过。" | "show_today" | POST `/rest-day` |
| `NW-GS-0002` | 今日已练过 | 400 | "你今天已经练过了。" | "show_today" | POST `/rest-day` |
| `NW-GS-0003` | 休整日幂等 | 200 | — | — | POST `/rest-day`（成功路径返回 `rested_today: true`）|

### 8.4 副作用触发点

| 触发 | 副作用 | 来源 |
| --- | --- | --- |
| 演练 step 12 完成（T-04 §2.4）| `gentle_streak.days += 1`（若昨日练过）或 = 1（缺失后首次）| T-04 → T-07 内部 |
| 必做 / 选做 A 节点 `mastered_basic`（T-06）| 调 T-07 内部 `incrementStreak()` | T-06 → T-07 |
| POST `/rest-day` | `restDaysUsedThisWeek += 1` | 本稿 |

### 8.5 与现有端点的关系

| 现有端点 | 用途 | T-07 关系 |
| --- | --- | --- |
| `GET /api/today-3` | 1 必做 + 2 选做 | T-06 §7.1 引用 `gentle_streak`（T-07 数据源）|
| `POST /api/today-3/rest` | 标记休整（T-06 占位）| T-07 实做后**合并**到本稿 `POST /api/gentle-streak/rest-day`；T-06 `/today-3/rest` 改为内部调用 T-07 端点 |
| `GET /api/profiles/me` | 用户档案 | T-07 不直接调；可读 `restDaysPerWeek` 设置（M3）|
| `POST /api/conversations/drill/[id]/step` | 演练 step 完成 | T-04 step 12 完成后**内部调用** T-07 副作用（`incrementStreak()`）|

---

## 9. 关键代码片段（≤ 200 行）

> ⚠️ 本片段是**设计稿占位**（仅作形态与结构示意），**不直接落地到 src/**。落地时由 Coordinator 批准后另立实施任务。

### 9.1 状态机核心逻辑（`src/lib/gentle-streak.ts`，约 80 行）

```ts
// src/lib/gentle-streak.ts（设计稿占位）
// 来自 docs/design/T-07-gentle-streak.md §3 + §4
export interface GentleStreak {
  days: number; restDaysPerWeek: number; restDaysUsedThisWeek: number;
  restDaysLeftThisWeek: number; practicedToday: boolean;
  lastPracticedDate: string | null; lastRestDate: string | null;
  currentWeekStart: string;
}

const addDays = (iso: string, n: number) => {
  const d = new Date(iso); d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const getWeekStart = (iso: string) => {
  const d = new Date(iso); const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
};

// 每日 0:00 UTC 触发（核心：缺失日静默不归零，避免"你失去 X 天"叙事）
export function dailyReset(s: GentleStreak, today: string): GentleStreak {
  // ⚠️ 缺失日判定后**不修改** s.days；下次练习时由 incrementStreak() 重置为 1
  // 这样用户在 0:00 不会看到"你失去了 3 天"——他们看不到 0
  const wk = getWeekStart(today);
  if (s.currentWeekStart !== wk) {  // 每周一重置休整日
    s.restDaysUsedThisWeek = 0; s.currentWeekStart = wk;
  }
  s.practicedToday = s.lastPracticedDate === today;
  s.restDaysLeftThisWeek = s.restDaysPerWeek - s.restDaysUsedThisWeek;
  return s;
}

// 副作用：练习完成时调用（T-04 step 12 / T-06 必做完成 → 调本函数）
export function incrementStreak(s: GentleStreak, today: string): GentleStreak {
  s.lastPracticedDate = today; s.practicedToday = true;
  // 连续判定：昨日练过则 +1；否则（缺失后首次）重置为 1（感知不到"丢失"）
  s.days = (s.lastPracticedDate === addDays(today, -1) && s.days > 0) ? s.days + 1 : 1;
  return s;
}

// POST /api/gentle-streak/rest-day 内部调用
export function markRestDay(s: GentleStreak, today: string) {
  if (s.lastRestDate === today) return { ok: true, reason: 'idempotent' as const, streak: s };
  if (s.practicedToday) return { ok: false, reason: 'already_practiced' as const, streak: s };
  if (s.restDaysUsedThisWeek >= s.restDaysPerWeek) return { ok: false, reason: 'no_quota' as const, streak: s };
  s.restDaysUsedThisWeek += 1;
  s.restDaysLeftThisWeek = s.restDaysPerWeek - s.restDaysUsedThisWeek;
  s.lastRestDate = today;
  return { ok: true, streak: s };
}
```

### 9.2 API Route: GET /api/gentle-streak（`src/app/api/gentle-streak/route.ts`，约 30 行）

```ts
// src/app/api/gentle-streak/route.ts（设计稿占位）
// 来自 docs/design/T-07-gentle-streak.md §8.1
import { NextRequest, NextResponse } from 'next/server';
import { withTrace } from '@/lib/api/middleware';
import { jsonError } from '@/lib/utils/error';
import { dailyReset, type GentleStreak } from '@/lib/gentle-streak';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// M2 PoC: 内存 Map（与 scripts-store 同型；globalThis 共享）
const STORE_KEY = '__gentleStreakStore';
const store: Map<string, GentleStreak> = (globalThis as any)[STORE_KEY] ??= new Map();

const newStreak = (): GentleStreak => ({
  days: 0, restDaysPerWeek: 1, restDaysUsedThisWeek: 0, restDaysLeftThisWeek: 1,
  practicedToday: false, lastPracticedDate: null, lastRestDate: null,
  currentWeekStart: new Date().toISOString().slice(0, 10),
});

export async function GET(req: NextRequest) {
  const { trace_id, userId } = withTrace(req);
  if (!userId) return jsonError('NW-AU-0001', trace_id);
  try {
    const today = new Date().toISOString().slice(0, 10);
    const streak = dailyReset(store.get(userId) ?? newStreak(), today);
    store.set(userId, streak);
    return NextResponse.json({
      data: { gentle_streak: streak, today },
      meta: { trace_id, server_time: new Date().toISOString() },
    });
  } catch { return jsonError('NW-ST-0001', trace_id); }
}
```

### 9.3 API Route: POST /api/gentle-streak/rest-day（约 40 行）

```ts
// src/app/api/gentle-streak/rest-day/route.ts（设计稿占位）
// 来自 docs/design/T-07-gentle-streak.md §8.2
import { NextRequest, NextResponse } from 'next/server';
import { withTrace } from '@/lib/api/middleware';
import { jsonError } from '@/lib/utils/error';
import { dailyReset, markRestDay, type GentleStreak } from '@/lib/gentle-streak';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STORE_KEY = '__gentleStreakStore';
const store: Map<string, GentleStreak> = (globalThis as any)[STORE_KEY] ??= new Map();

const newStreak = (today: string): GentleStreak => ({
  days: 0, restDaysPerWeek: 1, restDaysUsedThisWeek: 0, restDaysLeftThisWeek: 1,
  practicedToday: false, lastPracticedDate: null, lastRestDate: null, currentWeekStart: today,
});

export async function POST(req: NextRequest) {
  const { trace_id, userId } = withTrace(req);
  if (!userId) return jsonError('NW-AU-0001', trace_id);
  try {
    const today = new Date().toISOString().slice(0, 10);
    const cur = dailyReset(store.get(userId) ?? newStreak(today), today);
    const r = markRestDay(cur, today);
    if (!r.ok) {
      if (r.reason === 'no_quota') return jsonError('NW-GS-0001', trace_id);
      if (r.reason === 'already_practiced') return jsonError('NW-GS-0002', trace_id);
    }
    store.set(userId, r.streak);
    return NextResponse.json({
      data: {
        rested_today: true,
        gentle_streak: r.streak,
        today_view: { label: '今天先休息', required: null, can_rest: r.streak.restDaysLeftThisWeek > 0 },
      },
      meta: { trace_id, server_time: new Date().toISOString() },
    });
  } catch { return jsonError('NW-ST-0001', trace_id); }
}
```

### 9.4 顶部状态条组件（`src/components/gentle-streak/GentleStreakBar.tsx`，约 50 行）

```tsx
// src/components/gentle-streak/GentleStreakBar.tsx
// 来自 docs/design/T-07-gentle-streak.md §5
'use client';
import { useEffect, useState } from 'react';

interface Props {
  /** LPM 状态（受 GlobalHeader 控制） */
  lowPressureMode?: boolean;
}

interface StreakResponse {
  data: {
    gentle_streak: {
      days: number;
      restDaysLeftThisWeek: number;
    };
  };
}

export function GentleStreakBar({ lowPressureMode = true }: Props) {
  const [streak, setStreak] = useState<StreakResponse['data']['gentle_streak'] | null>(null);
  const [prevDays, setPrevDays] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/gentle-streak')
      .then((r) => r.json())
      .then((j: StreakResponse) => {
        if (streak) setPrevDays(streak.days);
        setStreak(j.data.gentle_streak);
      })
      .catch(() => setStreak(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!streak) return null;
  const { days, restDaysLeftThisWeek } = streak;

  // 总练习次数：来自 T-04 / T-06 端点（practiced 总数）；本稿不实做
  const totalPracticed = 12;  // M2 占位

  // 动效：LPM OFF 时 fade-in；LPM ON 时无动效；归零永远无动效
  const showFade = !lowPressureMode && prevDays !== null && days > prevDays;
  const ariaLabel = `练过 ${totalPracticed} 次，${days} 天的练习，本周可休整 ${restDaysLeftThisWeek} 天`;

  return (
    <p
      className={`mt-2 text-sm text-neutral-500 ${showFade ? 'animate-fade-in-200' : ''}`}
      aria-label={ariaLabel}
    >
      🌱 练过 {totalPracticed} 次 · {days} 天的练习 · 可休整 {restDaysLeftThisWeek} 天
    </p>
  );
}
```

> **行数统计**：9.1（80 行）+ 9.2（30 行）+ 9.3（40 行）+ 9.4（50 行）= **200 行**，**在 200 行预算内**。

---

## 10. 测试用例：5 个核心 case（含缺失静默归零）

### 10.1 Case 1 · 缺失 3 天后首次练习（静默归零）

**目的**：验证 §4.2 静默归零（用户**感知不到**"你失去了 3 天"）。

```ts
// tests/gentle-streak.test.ts
import { describe, it, expect } from 'vitest';
import { dailyReset, incrementStreak } from '@/lib/gentle-streak';

describe('T-07 温和连击状态机', () => {
  it('缺失 3 天后首次练习：days 重置为 1，UI 无任何"丢失"叙事', () => {
    // 1) 用户上次练过 3 天前
    const before = {
      days: 5,
      restDaysPerWeek: 1,
      restDaysUsedThisWeek: 0,
      restDaysLeftThisWeek: 1,
      practicedToday: false,
      lastPracticedDate: '2026-06-14',
      lastRestDate: null,
      currentWeekStart: '2026-06-15',
    };
    // 2) 3 天后用户首次练习（中间 06-15 / 06-16 / 06-17 都未练过 + 未休整）
    const after = incrementStreak({ ...before }, '2026-06-17');

    // 3) days 从 5 → 1（缺失后首次重置为 1；用户**只看到** 1，不看到 0）
    expect(after.days).toBe(1);
    expect(after.practicedToday).toBe(true);
    expect(after.lastPracticedDate).toBe('2026-06-17');
  });

  it('缺失日 daily reset 不立即归零：保持 5，用户感知不到', () => {
    const streak = {
      days: 5,
      restDaysPerWeek: 1,
      restDaysUsedThisWeek: 0,
      restDaysLeftThisWeek: 1,
      practicedToday: false,
      lastPracticedDate: '2026-06-14',
      lastRestDate: null,
      currentWeekStart: '2026-06-15',
    };
    // 06-17 0:00 daily reset：缺失日**不**立即归零
    const after = dailyReset({ ...streak }, '2026-06-17');
    expect(after.days).toBe(5);  // 保持 5
  });
});
```

### 10.2 Case 2 · 连续 2 天练习（days +1）

**目的**：验证 §3 状态机连续判定。

```ts
it('连续 2 天都有练习：days += 1', () => {
  const day1 = {
    days: 1,
    restDaysPerWeek: 1,
    restDaysUsedThisWeek: 0,
    restDaysLeftThisWeek: 1,
    practicedToday: true,
    lastPracticedDate: '2026-06-16',
    lastRestDate: null,
    currentWeekStart: '2026-06-15',
  };
  const day2 = incrementStreak({ ...day1 }, '2026-06-17');
  expect(day2.days).toBe(2);  // 连续 +1
});
```

### 10.3 Case 3 · 休整日不计入断签

**目的**：验证 §4.1 休整日 = "不连续也不断签"。

```ts
it('休整后次日练习：days 保持不变（休整 ≠ 缺失）', () => {
  const day1 = {
    days: 3,
    restDaysPerWeek: 1,
    restDaysUsedThisWeek: 0,
    restDaysLeftThisWeek: 1,
    practicedToday: true,
    lastPracticedDate: '2026-06-15',
    lastRestDate: null,
    currentWeekStart: '2026-06-15',
  };
  // 06-16 用户点 [休整]
  const rested = markRestDay({ ...day1 }, '2026-06-16');
  expect(rested.ok).toBe(true);
  expect(rested.streak?.days).toBe(3);  // days 不变
  expect(rested.streak?.restDaysUsedThisWeek).toBe(1);

  // 06-17 用户练习
  const practiced = incrementStreak(rested.streak!, '2026-06-17');
  expect(practiced.days).toBe(3);  // 休整不算断 → 还是 3
});
```

### 10.4 Case 4 · 休整日配额限制

**目的**：验证 §8.2 `NW-GS-0001` 错误码。

```ts
it('本周休整已用完时 POST /rest-day 拒绝', async () => {
  // 模拟 restDaysUsedThisWeek = 1, restDaysPerWeek = 1
  const r = await fetch('/api/gentle-streak/rest-day', { method: 'POST' });
  expect(r.status).toBe(400);
  const body = await r.json();
  expect(body.error.code).toBe('NW-GS-0001');
  expect(body.error.user_message).toBe('本周休整已用过。');
});

it('休整日幂等：今日已休整再点 [休整] 不会消耗配额', () => {
  const streak = {
    days: 3,
    restDaysPerWeek: 1,
    restDaysUsedThisWeek: 1,
    restDaysLeftThisWeek: 0,
    practicedToday: false,
    lastPracticedDate: null,
    lastRestDate: '2026-06-17',  // 今日已休整
    currentWeekStart: '2026-06-15',
  };
  const r = markRestDay({ ...streak }, '2026-06-17');
  expect(r.ok).toBe(true);
  expect(r.reason).toBe('idempotent');
  expect(r.streak.restDaysUsedThisWeek).toBe(1);  // 不再 +1
});
```

### 10.5 Case 5 · 顶部状态条文案无"丢失"叙事（grep 自检）

**目的**：验证 §5 顶部副标题文案**永远不**含"失去 / 丢失 / 快没了"等字样。

```ts
it('顶部状态条文案不含 "失去 / 丢失 / 快没了 / 再不来就"', () => {
  // 静态分析
  const fs = require('fs');
  const files = [
    'src/components/gentle-streak/GentleStreakBar.tsx',
    'src/app/api/gentle-streak/route.ts',
    'src/app/api/gentle-streak/rest-day/route.ts',
  ];
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const content = fs.readFileSync(f, 'utf-8');
    expect(content).not.toMatch(/失去/);
    expect(content).not.toMatch(/丢失/);
    expect(content).not.toMatch(/快没了/);
    expect(content).not.toMatch(/再不来就/);
    expect(content).not.toMatch(/火焰|🔥/);
    expect(content).not.toMatch(/坚持.*天/);
    expect(content).not.toMatch(/连续.*天/);
  }
});

it('T-06 GET /api/today-3 响应中 gentle_streak 字段无"失去"叙事', async () => {
  const r = await fetch('/api/today-3');
  const { data } = await r.json();
  const json = JSON.stringify(data);
  expect(json).not.toMatch(/失去/);
  expect(json).not.toMatch(/丢失/);
  expect(json).not.toMatch(/快没了/);
});
```

### 10.6 5 个 case 覆盖矩阵

| 维度 | Case 1 | Case 2 | Case 3 | Case 4 | Case 5 |
| --- | --- | --- | --- | --- | --- |
| 缺失静默归零（核心伦理）| ✅ | | ✅ | | ✅ |
| 连续 +1 判定 | | ✅ | | | |
| 休整 ≠ 缺失 | | | ✅ | | |
| 配额限制 / 幂等性 | | | | ✅ | |
| 文案无"丢失"叙事（grep）| | | | | ✅ |
| 错误码（NW-GS-0001 / 0002）| | | | ✅ | |
| 状态机不变量 | ✅ | ✅ | ✅ | ✅ | |
| 数据契约（`gentle_streak` 字段）| ✅ | | ✅ | ✅ | |

> **未覆盖**（follow-up，列入 T-16 Q 评审）：
> - 跨周重置（周一 0:00 边界）
> - 跨年重置（12-31 → 01-01）
> - 时区差异（客户端本地时区 vs UTC）
> - 限流 429（T-14 部署流水线验证）
> - 跨设备同步（M3）

---

## 11. 红线用例：缺失连击文案绝对禁止"失去 X 天"

> 来自 `docs/quality/gamification-safety-checklist.md` §3 RL-2（评判性文案）+ §16.3 拒绝清单自检。

### 11.1 必过红线 grep 自检

> 落地时由 Q 在 T-16 评审中跑本 grep；CI 必跑。

```bash
# 1. 拒绝清单（来自 prototype §16.3）
grep -rEn "失去|丢失|你快没了|再不来就|坚持.*天|连续.*天" \
  src/components/gentle-streak/ \
  src/app/api/gentle-streak/ \
  src/lib/gentle-streak.ts \
  --include="*.ts" --include="*.tsx" \
  && exit 1  # 命中 = 失败

# 2. 心数 / 宝石 / 排行（来自 PROJECT_MAP §5 红线）
grep -rEn "heart|lives|gem|coin|leaderboard|league|streak.repair|checkin|🔥" \
  src/components/gentle-streak/ \
  src/app/api/gentle-streak/ \
  src/lib/gentle-streak.ts \
  --include="*.ts" --include="*.tsx" \
  && exit 1  # 命中 = 失败
```

### 11.2 必过文案白名单

| 场景 | 唯一允许的文案 | 禁止的变体 |
| --- | --- | --- |
| 顶部副标题 | "练过 N 次 · M 天的练习 · 可休整 K 天" | "坚持 N 天" / "连续 N 天" / "🔥 N 天" |
| 休整后状态 | "今天先休息" | "已使用休整" / "休整成功" / "你休整了 1 天" |
| 归零后 | **不显示任何文案**（数字保持）| "你的 5 天连击已归零" / "你失去了 5 天" |
| 数字 +1 | **不显示反馈** | "+1" / "继续加油" / "你真棒" |
| 推送（未来 T-08）| "想练就练" / "我们在这里" | "别让你的 streak 死掉" / "你今天还没练" |

### 11.3 红线用例（Q 评审必过）

| 用例 | 描述 | 验证 |
| --- | --- | --- |
| **REJ-GS-01** | 缺失 3 天后首次练习，UI **不显示**"你失去了 3 天"任何字样 | grep + DOM 抓取 |
| **REJ-GS-02** | 休整后顶部副标题**不变化**为"已休整 1 天"或类似叙事 | grep + DOM 抓取 |
| **REJ-GS-03** | 顶部状态条**不出现** 🔥 emoji | grep |
| **REJ-GS-04** | 数字归零时**无任何动效**（无 fade / 无 shake / 无 flash）| DOM + CSS 自检 |
| **REJ-GS-05** | 缺失日**不触发任何推送**（T-08 推送默认 0 条）| 推送记录 API |
| **REJ-GS-06** | 顶部副标题**不出现**"坚持 N 天" "连续 N 天" | grep |
| **REJ-GS-07** | 休整按钮**永远**是文字按钮（**不**做主按钮色）| DOM + CSS |
| **REJ-GS-08** | 顶部状态条**不**与"等级 / 解锁 / 评分"挂钩 | 数据契约检查 |

### 11.4 边缘红线条目

| 条目 | 风险 | 缓解 |
| --- | --- | --- |
| 缺失日用户主动进入"我 → 进度"页 | 可能看到"天的练习" 数字回 1 | 进度页**不**显示"天的练习"（T-12 复用温和连击数据，但进度页只显示"练过 N 次 + 覆盖 X/17 微技能"）|
| 用户分享截图 | 截图含"天的练习: 1"等数字 → 隐性"我断了" | 进度页**不**显示"天的练习"；温和连击**仅**在主页顶部 |
| 推送文案（T-08 实施时）| 推送写"我们注意到你 3 天没来"等隐性催促 | T-08 推送**仅**邀请式（"想练就练"），**不**提及天数 |
| 推送频率（T-08 实施时）| 推送 > 1 次/周 | prototype §5.2 B2 默认全关；开启后最多 1 次/周 |

---

## 12. 风险点

### 12.1 P0 风险（必避）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-01 缺失日文案泄露"丢失"叙事** | UI / 日志 / API 响应 / 推送中含"你失去 X 天" | §11 grep 自检 + REJ-GS-01 ~ 08 红线用例 + CI 必跑 |
| **R-02 归零动效暴露"丢失"** | 数字归零时 fade / shake / flash → 用户感知"我丢了" | prototype §11 "数字归零无动效" + §5 视觉规范 + REJ-GS-04 |
| **R-03 休整被读成"缺失"** | UI 写"已使用休整" / "休整 1/1" | §6.5 文案白名单 + 进度条**不显示**"X/3" |
| **R-04 练过 + 休整同日优先级混乱** | 同一天练过 + 休整 → UI 状态冲突 | §4.1 优先级：练过 > 休整；后端 `NW-GS-0002` 拒绝休整 |
| **R-05 休整按钮被 LPM 影响** | LPM OFF 时 [休整] 按钮隐藏 / 不可达 | §6.6 LPM **不**影响休整入口；休整 = 基本权利 |
| **R-06 缺失日立即归零 → 0 叙事** | 0:00 把 `days` 改 0 → 用户看到"0 天的练习"本身即"丢失" | §4.2 缺失日**不**立即归零；下次练习时重置为 1（用户感知不到 0）|
| **R-07 顶部条与"等级 / 解锁"挂钩** | "练过 10 次解锁高级教练"等 | RL-1 红线；T-07 数据契约**不**含 unlock 字段；§11.2 文案白名单 |

### 12.2 P1 风险（follow-up）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-08 顶部数字 fade 动效在 LPM ON 时仍触发** | T-08 实施后 LPM Toggle 化时数字 fade 漏改 | §9.4 `lowPressureMode` 显式传入；CI 检查 `motion-safe:` 前缀 |
| **R-09 推荐算法引用 gentle_streak 字段不一致** | T-06 §3.3 推荐算法引用 `gentleStreak.practicedToday` 等；T-07 字段命名变化导致 T-06 失败 | §3.5 数据契约与 T-06 §6.1 完全一致；落地时跑 e2e |
| **R-10 跨周重置未生效** | 每周一 0:00 `restDaysUsedThisWeek` 未重置 → 永久累积 | §4.1 + §9.1 `dailyReset` 内的 `isMonday` 分支；e2e 跨周测试 |
| **R-11 跨设备数据冲突** | 设备 A 休整 + 设备 B 练过 → 服务端时序冲突 | M2 PoC 接受（单设备）；M3 接 Supabase + RLS + last-write-wins |
| **R-12 客户端时区与 UTC 偏差** | 用户跨时区出差 → "今日"判定错误 | §3.4 所有日期字段用 UTC ISO 'YYYY-MM-DD'；客户端**不**传 today |
| **R-13 [休整] 按钮在 mobile 触控** | 移动端触控热区过小 | §6.2 按钮 padding ≥ 12px；T-13 移动端适配补充 |
| **R-14 休整后 [取消] 入口暴露** | 用户点 [休整] 后 [取消] 是否显示？"取消"是否会鼓励"频繁切换"？ | 本稿 [取消] 显示（用户掌控感）；T-08 推送控制不触发；M3 评估是否改为"今日不可撤销休整" |

### 12.3 P2 风险（远期）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-15 数据从 localStorage 升 Supabase** | M2 PoC 接受；M3 需迁移 + 数据校验 | M3 实施时写 ADR；M2 数据**仅**为内存 |
| **R-16 跨用户对比** | 任何"朋友 / 排行榜 / 公开进度" 都不应有 | RL-5 红线（来自 gamification-safety-checklist.md §3.5）|
| **R-17 休整数据上报** | `restDaysUsedThisWeek` 是否上报到 Q 审计？ | T-08 推送控制时同步；M3 引入脱敏统计 |
| **R-18 多设备同时打开** | 设备 A 标记休整 + 设备 B 标记练过 → 时序错乱 | M3 SWR + 服务端事件流 |

### 12.4 验收必过项

> 落地时由 Q 在 T-16 评审中签字。

- [ ] 顶部状态条文案 grep 自检全部通过（§11.1）
- [ ] 5 个核心 case 100% 通过（§10.6 覆盖矩阵）
- [ ] 8 条红线用例 100% 通过（§11.3）
- [ ] `npm test` 全部通过（22 个测试 + T-07 新增 5 个）
- [ ] 视觉稿：顶部条 + [休整] 按钮 + "今天先休息" 态 由 PM 签字
- [ ] PE 签字：副标题文案 "🌱 练过 N 次 · M 天的练习 · 可休整 K 天" 与 §5 视觉规范一致
- [ ] KE 签字：休整语义符合 §4 状态机不变量

---

## 13. 与其他设计稿的接口边界

### 13.1 与 T-01 技能树主页

| 共享 | T-01 期望 | T-07 实现 | 一致 |
| --- | --- | --- | --- |
| 顶部状态条位置 | §7.3 主页内 header 副标题 | T-07 §5 复用同位置 | ✅ |
| 顶部状态条文案 | "🌱 练过 N 次 · M 天的练习 · 可休整 K 天" | T-07 §5.2 视觉规范完全一致 | ✅ |
| LPM 开关 | GlobalHeader 右侧 | T-07 不修改 GlobalHeader | ✅ |
| 节点状态 | T-01 §3.2 6 态 | T-07 不涉及节点；推荐降级由 T-06 处理 | ➖ |

### 13.2 与 T-06 今日三件小事

| 共享 | T-06 期望 | T-07 实现 | 一致 |
| --- | --- | --- | --- |
| `gentle_streak` 接口 | §6.1 `{ days, restDaysLeftThisWeek, practicedToday }` | T-07 §3.5 完整字段 | ✅ |
| 顶部进度条 [休整] 按钮 | T-06 §8.1 文字按钮 | T-07 §6 实做点击行为 | ✅ |
| 休整后必做降级 | T-06 §5.2 `recommended → available` | T-07 §6.4 `today_view.required = null` | ✅ |
| 必做完成 → 温和连击 +1 | T-06 §6.3 调 T-07 内部 | T-07 §8.4 副作用 | ✅ |
| POST `/today-3/rest` 与 `/gentle-streak/rest-day` 关系 | T-06 §7.3 端点 | T-07 §8.5 合并：T-06 `/today-3/rest` 改为内部调用 T-07 | ✅ |

### 13.3 与 T-04 12 步演练后端

| 共享 | T-04 期望 | T-07 实现 | 一致 |
| --- | --- | --- | --- |
| step 12 完成 → 温和连击 +1 | T-04 §2.4 副作用清单 | T-07 §8.4 `incrementStreak()` | ✅ |
| 节点 `mastered_basic` → `practiced + 1` | T-04 §2.4 | T-07 **不**直接管节点；T-04 自维护 | ➖ |
| 草稿清除 | T-04 §2.4 | T-07 不涉及 | ➖ |

### 13.4 与 T-08 低压力模式 + 推送

| 共享 | T-08 期望 | T-07 实现 | 一致 |
| --- | --- | --- | --- |
| LPM Toggle 化 | T-08 实施 | T-07 §7 引用 LPM 状态；不实做 Toggle | ✅ |
| 推送默认 0 条 | T-08 B2 默认全关 | T-07 不涉及推送 | ➖ |
| 数字 fade-in 受 LPM 控制 | T-08 控制 | T-07 §5.3 / §7.1 一致 | ✅ |
| 缺失日推送 | T-08 默认 0 推送 | T-07 §11.4 + REJ-GS-05 | ✅ |

### 13.5 与 T-09 危机兜底

| 共享 | T-09 期望 | T-07 实现 | 一致 |
| --- | --- | --- | --- |
| 危机信号 | T-09 独立路径 | T-07 **不**涉及危机；危机由独立路径处理 | ➖ |
| 危机触发时温和连击 | 危机**不**影响温和连击状态机 | T-07 §4 状态机与危机解耦 | ✅ |

### 13.6 与 T-12 我 → 进度

| 共享 | T-12 期望 | T-07 实现 | 一致 |
| --- | --- | --- | --- |
| 进度页"天的练习"显示 | T-12 §6.10 累计 + 5 段旅程地图 | T-07 **建议** T-12 进度页**不**显示"天的练习"（避免隐性"我断了"）| ✅ |
| 数据源 `gentle_streak.days` | T-12 复用 T-07 数据 | T-07 §3.1 字段 | ✅ |
| "可休整 K 天" | T-12 顶部状态条 | T-07 §5.1 形态 | ✅ |

---

## 14. 待 Coordinator 拍板的 3 个开放问题

| # | 问题 | 建议 |
| --- | --- | --- |
| Q1 | 休整按钮放**顶部状态条内** vs **T-06 进度条右侧**？ | 建议 **T-06 进度条右侧**（避免按钮混在数据条里；与 T-06 §8.1 一致）|
| Q2 | 休整按钮**一次确认** vs **二次确认**？ | 建议 **一次确认**（休整 = 基本权利，不应当被"二次确认"暗示为"你做错了什么"；与 RL-6 不强弹窗一致）|
| Q3 | T-12 进度页**是否显示**"天的练习" 数字？ | 建议**不**显示（避免隐性"我断了"；进度页只显示"练过 N 次 + 覆盖 X/17 微技能"）|

---

## 15. Follow-up（不属本任务）

1. **T-08**（FE+BE）：低压力模式开关（GlobalHeader Toggle 化）+ 推送控制；本稿 §7 引用 LPM 状态。
2. **T-12**（FE+BE）：我 → 进度（v2.0 形态：5 段旅程地图 + 练过的瞬间）；本稿 §3.1 数据源。
3. **T-04**（BE）：12 步演练后端 step 12 完成后**内部调用** T-07 `incrementStreak()`。
4. **T-15**（PE+Q）：评测集 v0.5 补"温和连击 + 休整日"用例 ≥ 10 条（缺失静默归零 / 休整幂等 / 配额限制 / 数字 +1 fade / 归零无动效 / 文案无丢失叙事）。
5. **T-16**（Q）：红线用例 + 拒绝清单自检；本稿 §11 8 条红线用例列入 e2e。
6. **A + BE**：写 ADR-010（Gentle Streak state machine + rest-day API contract for Supabase M3 migration）。
7. **M3**：温和连击 + 休整日接 Supabase `gentle_streak` 表 + `rest_days_log` 表；跨设备同步；`restDaysPerWeek` 用户可调（1-2 天）。

---

## 16. 与现有文档的双向追溯

| 本稿章节 | 引用源 |
| --- | --- |
| §1 现状 | `src/app/(app)/today/page.tsx` + `docs/02-Prototype.md` v2.0.1 §6.2 / §7.6 / §8.3 / §18 P-09 |
| §2 设计原则 | `docs/02-Prototype.md` §7.6 + `docs/research/competitor-research.md` §6.1 + `docs/quality/gamification-safety-checklist.md` §3 RL-1 ~ RL-4 |
| §3 数据模型 | `docs/design/T-06-today-three.md` §6.1 + `docs/02-Prototype.md` §8.3 + `docs/05-API-Design.md` §3 |
| §4 休整日规则 | `docs/02-Prototype.md` §7.6 / §8.3 / §18 B3 + B4 + `docs/research/competitor-research.md` §6.1 |
| §5 温和连击 UI | `docs/02-Prototype.md` §6.2 / §11 / §18 P-09 |
| §6 休整日 UI | `docs/02-Prototype.md` §5.4 / §11 + `docs/design/T-06-today-three.md` §8.1 |
| §7 LPM 耦合 | `docs/02-Prototype.md` §5.2 + `rules/safety.md` S-6 + T-08 待写 |
| §8 API 契约 | `docs/05-API-Design.md` §3 / §5 / §7 + `docs/design/T-04-drill-backend.md` §3 + `docs/design/T-06-today-three.md` §7 |
| §9 代码片段 | `src/lib/scripts-store.ts` pattern + `src/app/api/scripts/route.ts` |
| §10 测试 | `docs/design/T-04-drill-backend.md` §10 + `docs/07-Test-Plan.md` §19 |
| §11 红线用例 | `docs/quality/gamification-safety-checklist.md` §3 + `docs/02-Prototype.md` §16.3 |
| §12 风险点 | `rules/safety.md` S-1 ~ S-8 + `docs/02-Prototype.md` §16.3 + `docs/research/competitor-research.md` §6.1 |
| §13 接口边界 | T-01 / T-04 / T-06 / T-08 / T-09 / T-12 设计稿 + `plans/m2-poc.md` |
| §14 开放问题 | — |
| §15 Follow-up | `plans/m2-poc.md` 任务清单 |

---

## 17. 文档自检

- 不修改 src/ 任何源代码 ✅
- 不启动 dev server / npm test ✅
- 产出物为 markdown 设计稿 ✅
- 关键决策可回溯到 `docs/02-Prototype.md` v2.0.1 + `docs/research/competitor-research.md` §6.1 + `docs/quality/gamification-safety-checklist.md` + `plans/m2-poc.md` T-07 + S-PoC-02 ✅
- 符合 CLAUDE.md 红线 + `docs/02-Prototype.md` §16 全部自检项 ✅
- 5 个核心 case 覆盖：缺失静默归零 / 连续 +1 / 休整 ≠ 缺失 / 配额限制 / 文案 grep ✅
- 关键代码片段 200 行（≤ 200 行预算）✅
- 与 T-01 / T-04 / T-06 / T-08 / T-09 / T-12 数据契约一致 ✅
- 红线承诺：**绝不**出现"你失去 X 天"等任何"丢失"叙事 ✅

---

> **变更摘要**（v0.1 2026-06-17）：
> 1. 现状：顶部副标题形态已落地（polish P-09），数据层全部写死
> 2. 设计原则：5 条核心立场 + 8 条落地原则 + 4 类 P0 红线自检
> 3. 数据模型：8 个字段 + 数学不变量 + 存储位置
> 4. 休整日规则：5 条规则 + 静默归零核心实现 + 幂等性 + 边缘情况
> 5. 温和连击 UI：视觉规范 + 数字变化规则 + 移动端适配
> 6. 休整日 UI：[休整] 按钮位置 + 一次确认（**不**二次确认）+ "今天先休息" 态
> 7. LPM 耦合：4 个维度对比 + 静默归零与 LPM 解耦 + 休整与 LPM 解耦
> 8. API 契约：GET `/api/gentle-streak` + POST `/api/gentle-streak/rest-day` + 3 个错误码 NW-GS-0001/0002/0003
> 9. 代码片段：4 个片段共 200 行（≤ 200 行预算）
> 10. 测试用例：5 个核心 case 覆盖矩阵（含缺失静默归零）
> 11. 红线用例：grep 自检 + 8 条 REJ-GS 用例
> 12. 风险点：P0 7 条 / P1 7 条 / P2 4 条 + 验收必过项
> 13. 3 个开放问题待 Coordinator 拍板
> 14. 红线自检：通过
> 15. Follow-up：T-04 / T-08 / T-12 / T-15 / T-16 + ADR-010 + M3
