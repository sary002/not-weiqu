# T-01 · 技能树主页 · 设计稿

> **任务编号**：T-01（plans/m2-poc.md）
> **关联切片**：S-PoC-01 阿瑶的 1 次演练
> **Owner（设计）**：FE
> **Reviewer**：C、PM、PE、KE、Q
> **阶段**：调研 + 设计（**不修改 src/ 下任何源代码**）
> **本稿状态**：待 Coordinator 审核
> **版本**：v0.1（2026-06-17）

---

## 0. 阅读须知

- 本稿只描述**形态、状态、组件契约、JSX 骨架**。**不输出可运行代码、不动 src/ 任何文件**。
- 一切设计决策必须可回溯到 `docs/02-Prototype.md` v2.0.1（Jobs polish 已落地） + `plans/m2-poc.md` T-01。
- 任何与 `src/app/(app)/today/page.tsx` 或 `src/components/skilltree/SkillNode.tsx` 现状的差异，本稿**只描述、不修改**；如需改动源代码，由 Coordinator 批准后另立任务（避开本任务的"调研 + 设计"边界）。

---

## 1. 现状分析（gap）

### 1.1 与 v2.0 形态的契合度

| 项 | v2.0 期望 | 当前实现 | 评估 |
| --- | --- | --- | --- |
| 5 段骨架（L1~L5） | 5 段全部渲染 | 5 段全部渲染 | ✅ 形态正确 |
| 节点 6 态（locked / available / in_progress / mastered_basic / mastered_deep / recommended） | 6 态全部支持 | 6 态全部支持 | ✅ 类型与 className 齐备 |
| 锁定节点不显示 🔒（polish P-06） | 半透明 + hover 引导 | 文字「需 §1 走完」 | ⚠️ 半透明 OK；文字"需 §1 走完"是**内嵌引导**而非 hover，polish 倾向"hover 才显示" |
| 顶部状态条（温和连击 + LPM） | 顶部常驻累计 + 休整日 + LPM | 累计"🌱 练过 N 次 · 3 天的练习 · 可休整 1 天" ✅；LPM 开关位于 `GlobalHeader`（顶部右侧） ✅ | ✅ 整体到位 |
| 「今天就到这里」按钮 | 永远可达 | 永远可达 + 跳 `/conversation` | ⚠️ **跳到自由对话**与 prototype §6.2「直接退出」不同：当前 Link 路径把"收束"导向"自由对话"，与 v1.0 习惯一致但与 v2.0 期望的"安静收束"存在张力 |
| 技能树垂直路径 + 节点细线连接 | 节点之间细线连接 | 当前实现**没有**绘制连接线 | ❌ 缺 |
| 推荐节点文字"今日" | 删文字标签（polish P-07） | 当前显示「推荐」文字 | ❌ 未落地 polish |
| 进度环 / 节点点亮动效 | 收束成 1 颗金冠 700ms | 当前无动效 | ❌ 缺（动效可在 T-03 演练完成时引入） |
| 节点之间用"路径"（曲折细线）连接 | 曲折细线 | 仅有 `<ul><li>` 缩进，**无视觉连接** | ❌ 缺 |
| 顶部状态条位于 `today/page.tsx` 内 | 主页内顶部（h1 + 副标题） | 已实现 | ✅ |
| 收起"今日三件小事"独立区（polish P-01） | 融进技能树（推荐 = 唯一发光） | 主页未渲染独立今日区，但**未把"必做 + 2 选做"显式映射到节点状态** | ⚠️ 部分：T-06 会再补"三件小事"映射 |

### 1.2 SkillNode.tsx 与 v2.0 形态的契合度

| 项 | v2.0 期望 | 当前实现 | 评估 |
| --- | --- | --- | --- |
| 6 态类型枚举 | 6 态 | 6 态 | ✅ |
| 锁定节点：半透明 + **hover** 才显示引导 | hover 才显示 | **常驻文字**「需 §1 走完」 | ❌ 与 polish P-06 不符 |
| 推荐节点：发光 + 放大 1.05x，**不写"今日"** | 仅视觉传达 | className 有 `ring-1 ring-primary/20`（软发光雏形）✅；副标题写「推荐」❌ | ⚠️ 部分 |
| 已掌握基础：1 颗金冠 | ★ 描边 | `<Star class="text-primary" />` 实心 | ⚠️ 颜色已对，但"基础 vs 深入"仅靠星星是否 fill 区分，缺金冠意象 |
| 已掌握深入：2 颗金冠 | ★★ 暖金 + "练过 N 次 · 深入" | 同样一颗星 + "练过 N 次 · 深入" | ❌ 双金冠未实现 |
| 进行中：蓝环 + 进度文字「练到第 N/12 步」 | 圆环 + 文字 | `<Circle>` 图标 + 「练到 5/12」 | ✅ 形态对，但"5/12"是数字，prototype polish P-02 倾向**当前步骤名**（"当前：觉察"），尚未引入 step name 字段 |
| 可学习：暖白底 + 金边 | 暖白底 + 金边 | `<Play>` 图标 + 「可练」 | ⚠️ 暖白底 ✅，金边 = 边框 + hover transition；可练 ✅ |
| 锁定不显示锁图标 | 不显示 | 不显示 ✅；用文字引导（应 hover） | ⚠️ |
| `aria-label` / `aria-disabled` | 状态由文字 + 图标 + ARIA 共同传达（R9） | `aria-disabled` ✅；缺 `aria-label` 显式描述状态 | ⚠️ |

### 1.3 现状总结

- **形态正确、6 态完整**：T-01 的"骨架"基本到位。
- **5 处 polish 未完整落地**：锁定节点常驻文字、推荐节点文字、双金冠、节点连接线、polish P-02 步骤名替换"5/12"数字。
- **风险集中在"视觉层 + polish 落地"**，不影响状态机与 props 数据契约。
- **本稿定位**：把 5 处 polish 落到**设计层**（className / 视觉 / props 扩展），供 Coordinator 拍板后，下一轮实施任务**整批**落地。

---

## 2. 5 段骨架信息架构

### 2.1 5 段总览

| § | 名称 | 层级 | 含义 | 节点数量（M2 范围） | v2.0 状态（M2） |
| --- | --- | --- | --- | --- | --- |
| §1 | 觉察 | L1 | 看见自己 | 3 | 全部 available（其中 2 已 mastered，1 in_progress） |
| §2 | 命名 | L2 | 说出自己 | 3 | available（其中 1 recommended = S-PoC-01 起点） |
| §3 | 表达 | L3 | 在真实场景里说 | 2（M2 仅 1 个真节点） | 1 locked（无内容）+ 1 locked（无内容） |
| §4 | 兜底 | L4 | 被回绝后不崩塌 | 1 | locked |
| §5 | 巩固 | L5 | 把单次胜利变成习惯 | 1 | locked |

> **M2 PoC 范围**：`plans/m2-poc.md` 已明确"只 1 个微技能 = L3-01 拒绝同事甩活"。本稿 §2.2 的"全量节点"是**形态骨架**（T-01 交付物），**实际可点节点只有 1 个**（S-PoC-01 阿瑶点开的那个），其余以 locked / 半透明呈现，不接 API、不接内容。

### 2.2 全量节点列表（M2 PoC 上线版）

> 来源：`docs/02-Prototype.md` §5.3 + `docs/01-PRD.md` §7 边界五层模型。
> M2 阶段已落实的具体节点标 ✅，未落实的标 ◻️，locked 灰显但保留结构。

```
边界成长路（Learning Path）
├─ §1 觉察 · L1          ← 看见自己
│  ├─ ✅ 听见身体的信号       （mastered_deep）
│  ├─ ✅ 给情绪命名          （mastered_basic）
│  └─ ✅ 看见讨好模式        （in_progress · 草稿 5/12）
│
├─ §2 命名 · L2          ← 说出自己
│  ├─ ✅ 说出"我想要"        （recommended · 软发光 · 放大 1.05x）
│  ├─ ◻️ 说出"我不想"        （available）
│  └─ ◻️ 区分"我的 / 别人的"  （available）
│
├─ §3 表达 · L3          ← 在真实场景里说    ← 核心区
│  ├─ ◻️ 拒绝同事甩活        （locked · M2 实做内容由 T-02 提供）
│  ├─ ◻️ 拒绝加班到深夜
│  ├─ ◻️ 拒绝朋友借钱
│  ├─ ◻️ 春节应对亲戚追问
│  ├─ ◻️ 应对伴侣冷暴力
│  └─ ◻️ 在服务场景不卑不亢
│
├─ §4 兜底 · L4          ← 被回绝后不崩塌
│  ├─ ◻️ 被回绝后自我安抚
│  ├─ ◻️ 应对愧疚感
│  └─ ◻️ 在冷暴力里站稳
│
└─ §5 巩固 · L5          ← 把单次胜利变成习惯
   ├─ ◻️ 整理本周胜利
   ├─ ◻️ 复习我的剧本
   └─ ◻️ 30 日回顾
```

### 2.3 视觉节奏

- **垂直路径**：`max-w-2xl` 单列，节点间距 `space-y-6`（§ 间）/ `space-y-2`（节点间）。
- **段间细线**：用 1px 虚线 `border-l border-dashed` + `ml-2` 偏移，**不画成 SVG 路径**（避免布局抖动；M3 评估 SVG）。
- **半透明**：locked 段 opacity = 0.5（与锁定节点一致），**仍可看见**，只是不可点。
- **段标题**：`§1 觉察 · L1` 小字 + 中性灰，体现"在路径上"。

### 2.4 渐进披露（Progressive Disclosure）

- **首屏**：只渲染 §1 + §2（above the fold），用户向下滑动看到 §3~5。
- **§3~5 标题**用 `text-neutral-400` 灰显，节点一律 `opacity-50`，**视觉不抢眼**（避免"清单焦虑"）。
- §3 节点虽 locked，但**保留标题文字**（不删），原因：让用户感知"还有什么可以做"，但视觉权重低。

---

## 3. 节点 6 态定义

### 3.1 状态枚举（与 SkillNode.tsx 现有类型保持一致）

```ts
export type SkillStatus =
  | 'locked'             // 未解锁
  | 'available'          // 可学习
  | 'in_progress'        // 进行中（草稿未完成）
  | 'mastered_basic'     // 已掌握（基础）· 练过 1 次
  | 'mastered_deep'      // 已掌握（深入）· 练过 ≥ 5 次
  | 'recommended';       // 当前推荐（软发光 + 放大）
```

### 3.2 6 态设计矩阵

| 状态 | 边框 | 底色 | 图标 | 副文本 | 动效 | 可点 | ARIA-label |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `locked` | `border-border` 灰 1px | `bg-surface/40` | 无图标 | hover 才显示「完成 §X 解锁」 | 无 | 否 | `aria-disabled="true"` + `aria-label="{title}（需完成 §{N} 解锁）"` |
| `available` | `border-border` | `bg-surface` | `Play` (Play icon) | 「可练」 | hover 边框→ `border-primary/40` | 是 | `aria-label="{title}（可练）"` |
| `in_progress` | `border-primary/40` | `bg-surface` | `Circle` (◐) | 「练到 {stepName}」 | 无 | 是（**回到草稿**） | `aria-label="{title}（进行中：{stepName}）"` |
| `mastered_basic` | `border-border` | `bg-surface` | `Star`（描边）| 「练过 N 次」 | 无 | 是 | `aria-label="{title}（已练过 N 次）"` |
| `mastered_deep` | `border-border` | `bg-surface` | `Star` + `Star`（双金冠，暖金 #C9A24B）| 「练过 N 次 · 深入」 | 无 | 是 | `aria-label="{title}（已练过 N 次，深入）"` |
| `recommended` | `border-primary` + `ring-1 ring-primary/30` | `bg-primary-soft` | `Sparkles` (✦) | **不写文字**（polish P-07） | 软发光（box-shadow 200ms 渐显）+ 放大 1.05x | 是 | `aria-label="{title}（今日推荐）"` |

> **关键决策**：
> 1. 锁定节点**不写常驻文字**，hover 才显示引导（polish P-06 落地）。
> 2. 推荐节点**不写"今日"文字**（polish P-07 落地）。
> 3. in_progress 副文本从"5/12"改为**当前步骤名**（"当前：觉察"），与 polish P-02 一致；`draftStep` 字段类型从 `string`（数字）扩展为 `{ stepIndex: number; stepName: string }`。

### 3.3 6 态切换规则（状态机）

| 触发事件 | 旧状态 | 新状态 | 备注 |
| --- | --- | --- | --- |
| 用户进入节点（首次） | `available` / `recommended` | `in_progress` | 进入 `/drill?code={code}` 即视为开练 |
| 用户完成 12 步 + 保存到「我的剧本」 | `in_progress` | `mastered_basic` | 进度 +1 |
| 用户完成 12 步 + 不保存（选"跳过"） | `in_progress` | `mastered_basic` | **不写入剧本也计 1 次**（polish：练习即完成，不绑定后续动作） |
| 累计 `practiced >= 5` | `mastered_basic` | `mastered_deep` | 系统侧定时计算，无需用户操作 |
| 用户关掉草稿（> 3 天） | `in_progress` | `available` | 草稿归档为"过往的尝试"（不计入累计），节点回到可练 |
| 系统每日重算"推荐" | `recommended` | `available`（降级） | 原推荐节点失光，下一个可练节点（按段顺序 + 距上次练习时间）顶上去 |
| 系统每日重算"推荐" | `available`（顶上来那个） | `recommended`（顶上去） | 唯一发光节点 |

> **唯一发光规则**：全树同一时刻**最多 1 个** `recommended` 节点，避免"多个推荐"导致的优先级焦虑。

### 3.4 颜色 token

- 推荐发光：`ring-primary/30` + `shadow-[0_0_0_4px_rgba(79,91,255,0.08)]`（柔光，不刺眼）。
- 已掌握深入金冠：`text-[#C9A24B]`（暖金，不刺眼，与文档 §4.1 锁色一致）。
- 进行中蓝环：`border-primary/40`（柔，不做完整 ring，避免抢推荐节点视觉）。
- 锁定半透明：`opacity-50`，**不**加灰度滤镜（避免"被关在门外"感）。

---

## 4. L3-01「拒绝同事甩活」节点草图

### 4.1 位置

```
边界成长路
├─ §1 觉察
├─ §2 命名
└─ §3 表达              ← L3 段
   └─ L3-01 拒绝同事甩活  ← M2 唯一可点节点（实际 locked 视觉 / 内容由 T-02 提供）
```

### 4.2 状态（M2 范围）

> **M2 PoC 矛盾点**：plans/m2-poc.md §范围 明确"L3-01 是 M2 唯一实做微技能"，但 §6.2 主页线框里 §3 整段标为"半透明"。本稿**建议 T-01 主页**：
>
> - **L3-01 节点在 §3 段内以 `recommended` 态出现**（软发光 + 放大 1.05x），**不画锁**。
> - **§3 段内其他节点保持 `locked` 态**（半透明 + 不可点）。
> - 这样 S-PoC-01 阿瑶打开「今日」就能直接点 L3-01，符合用户故事。

| 字段 | 值 |
| --- | --- |
| `id` | `s3-refuse-colleague` |
| `code` | `l3-refuse-colleague`（T-02 会写入） |
| `title` | `拒绝同事甩活` |
| `practiced` | `0`（首次进入） |
| `status` | `recommended`（M2 阶段） |
| `draftStep` | `undefined` |
| `layer` | `L3` |
| `sectionName` | `表达` |

### 4.3 视觉草图（ASCII）

```
§3 表达 · L3                    ← 段标题灰
   ┌─ ✦ ──────────────────────┐
   │  ✦  拒绝同事甩活          │   ← L3-01 唯一发光节点
   │  ↑ 软发光 + 放大 1.05x    │   ← 不写"今日" / 不写"推荐"
   └─────────────────────────┘
   ┌─ 拒绝加班到深夜 ────────┐
   │  需 §3 走完                │   ← 半透明 + hover 引导
   └─────────────────────────┘
   ┌─ 拒绝朋友借钱 ────────┐
   │  需 §3 走完                │   ← 半透明
   └─────────────────────────┘
   …
```

### 4.4 与 S-PoC-01 故事的一致性

- 阿瑶打开「今日」→ 直接看到 L3-01 **发光** → 点击 → 进 `/drill?code=l3-refuse-colleague` → 12 步。
- 完成后回到主页 → 节点从 `recommended` → `mastered_basic`（`practiced = 1`）。
- 顶部温和连击 +1。
- **关键不变量**：节点从发光变金冠，**不能是"胜利"**叙事（prototpye §10 拒绝"胜利 🏆"）；文案"练过 1 次"。

---

## 5. SkillNode.tsx 组件 props 与 6 态切换逻辑

### 5.1 Props 设计

```ts
export type SkillStatus =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'mastered_basic'
  | 'mastered_deep'
  | 'recommended';

export type DraftStep =
  | { stepIndex: number; stepName: string }   // 例: { stepIndex: 5, stepName: '觉察' }
  | undefined;

interface SkillNodeProps {
  /** 节点标题（v2.0 §4.4 视觉） */
  title: string;
  /** 演练 code（locked / 无内容时为 null） */
  code: string | null;
  /** 累计练过的次数（mastered 态用） */
  practiced: number;
  /** 6 态之一 */
  status: SkillStatus;
  /** 进行中：当前步骤（polish P-02：步骤名而非数字） */
  draftStep?: DraftStep;
  /** 推荐节点：是否启用低压力模式（影响发光强度） */
  lowPressureMode?: boolean;
  /** 段层（用于 ARIA 描述） */
  layer?: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  /** 解锁前置段（locked 节点 hover 引导用） */
  unlockHint?: string;  // 例: '需完成 §1 走完'
}
```

### 5.2 6 态切换矩阵（实现层）

| 状态 | 边框 | 底色 | 图标 | 副文本 | className 关键 |
| --- | --- | --- | --- | --- | --- |
| `locked` | `border-border` | `bg-surface/40` | — | hover → `unlockHint` | `opacity-50 cursor-not-allowed` |
| `available` | `border-border` | `bg-surface` | `Play` | `可练` | `hover:border-primary/40` |
| `in_progress` | `border-primary/40` | `bg-surface` | `Circle` | `练到 {draftStep.stepName}` | — |
| `mastered_basic` | `border-border` | `bg-surface` | `Star`（描边） | `练过 {practiced} 次` | `text-primary` for star |
| `mastered_deep` | `border-border` | `bg-surface` | `Star` + `Star` | `练过 {practiced} 次 · 深入` | `text-[#C9A24B]` for stars |
| `recommended` | `border-primary` + `ring-1 ring-primary/30` | `bg-primary-soft` | `Sparkles` | **空** | `scale-[1.05] shadow-[0_0_0_4px_rgba(79,91,255,0.08)]` |

### 5.3 视觉规则

- **不依赖颜色**：状态由**图标 + 文字 + 颜色**三重传达（R9）。
- **不写"今日"**：推荐节点不显示文字标签，仅靠发光 + 放大（polish P-07）。
- **不显示 🔒**：锁定节点不显示锁图标（polish P-06）。
- **动效可关闭**：推荐节点的发光 + 放大受 `motion-safe:` 前缀控制，`lowPressureMode = true` 时降级为静态 ring。
- **可访问性**：`aria-disabled` for locked；其他 5 态都可点 + `aria-label` 显式描述状态。

### 5.4 6 态切换逻辑伪代码

```ts
// today/page.tsx 端
const nextStatus = computeSkillStatus(skill, dailyContext);
// 状态来源：用户行为事件（进入演练 / 完成 / 保存 / 跳过 / 草稿超时）+ 系统重算（每日推荐）

// 6 态切换函数（纯函数，便于测试）
function computeSkillStatus(
  skill: SkillSeed,
  ctx: { practiced: number; draftStep?: DraftStep; recommendedId?: string }
): SkillStatus {
  // 1. 草稿超时（> 3 天）→ 回到 available
  if (skill.draftStep && ctx.draftExpired) return 'available';

  // 2. 进行中（有草稿）
  if (ctx.draftStep && !ctx.draftExpired) return 'in_progress';

  // 3. 累计 ≥ 5 → mastered_deep
  if (ctx.practiced >= 5) return 'mastered_deep';

  // 4. 累计 ≥ 1 → mastered_basic
  if (ctx.practiced >= 1) return 'mastered_basic';

  // 5. 系统推荐（唯一）
  if (ctx.recommendedId === skill.id) return 'recommended';

  // 6. 前置段未完成 → locked
  if (!ctx.unlocked) return 'locked';

  // 7. 默认可练
  return 'available';
}
```

---

## 6. 关键代码片段（SkillNode.tsx 核心 JSX 结构，≤ 200 行）

> ⚠️ 本片段是**设计稿占位**（仅作形态与结构示意），**不直接落地到 src/**。落地时由 Coordinator 批准后另立实施任务。

```tsx
// ===== 类型与常量 =====
import Link from 'next/link';
import { Sparkles, Circle, Star, Play } from 'lucide-icons';
import type { ReactNode } from 'react';

export type SkillStatus =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'mastered_basic'
  | 'mastered_deep'
  | 'recommended';

export interface DraftStep {
  stepIndex: number;
  stepName: string;
}

interface Props {
  title: string;
  code: string | null;
  practiced: number;
  status: SkillStatus;
  draftStep?: DraftStep;
  lowPressureMode?: boolean;
  layer?: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  unlockHint?: string;
}

// ===== 状态 → 视觉 配置 =====
type NodeVisual = {
  border: string;
  surface: string;
  scale?: string;
  ring?: string;
  shadow?: string;
  opacity?: string;
};

const VISUAL: Record<SkillStatus, NodeVisual> = {
  locked: {
    border: 'border-border',
    surface: 'bg-surface/40',
    opacity: 'opacity-50',
  },
  available: {
    border: 'border-border',
    surface: 'bg-surface',
  },
  in_progress: {
    border: 'border-primary/40',
    surface: 'bg-surface',
  },
  mastered_basic: {
    border: 'border-border',
    surface: 'bg-surface',
  },
  mastered_deep: {
    border: 'border-border',
    surface: 'bg-surface',
  },
  recommended: {
    border: 'border-primary',
    surface: 'bg-primary-soft',
    ring: 'ring-1 ring-primary/30',
    shadow: 'shadow-[0_0_0_4px_rgba(79,91,255,0.08)]',
    scale: 'scale-[1.05]',
  },
};

// ===== 主组件 =====
export function SkillNode({
  title, code, practiced, status, draftStep,
  lowPressureMode = true, layer, unlockHint,
}: Props) {
  const v = VISUAL[status];
  const isLocked = status === 'locked';
  const isRecommended = status === 'recommended';
  const isMastered = status === 'mastered_basic' || status === 'mastered_deep';
  const isInProgress = status === 'in_progress';

  // className 拼接：基础 + 状态 + 动效开关
  const baseClass = [
    'flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm transition',
    v.border,
    v.surface,
    v.opacity,
    isRecommended && !lowPressureMode ? `motion-safe:${v.scale} motion-safe:${v.shadow}` : '',
    isRecommended && lowPressureMode ? v.ring : '',
    isLocked ? 'cursor-not-allowed' : 'hover:border-primary/40',
  ].filter(Boolean).join(' ');

  // 图标（locked 不显示；mastered_deep 显示双金冠）
  const renderIcon = (): ReactNode => {
    if (isLocked) return <span className="h-4 w-4" aria-hidden />; // 占位保持对齐
    if (isRecommended) return <Sparkles className="h-4 w-4 text-primary" aria-hidden />;
    if (isInProgress) return <Circle className="h-4 w-4 text-primary" aria-hidden />;
    if (status === 'mastered_deep') {
      return (
        <span className="flex items-center gap-0.5" aria-hidden>
          <Star className="h-4 w-4 fill-[#C9A24B] text-[#C9A24B]" />
          <Star className="h-4 w-4 fill-[#C9A24B] text-[#C9A24B]" />
        </span>
      );
    }
    if (status === 'mastered_basic') {
      return <Star className="h-4 w-4 text-primary" aria-hidden />;
    }
    return <Play className="h-4 w-4 text-neutral-400" aria-hidden />;
  };

  // 副文本（polish P-07 推荐节点不写文字；polish P-02 草稿显示步骤名）
  const renderSubtitle = (): ReactNode => {
    if (isLocked) return null; // hover 才显示 unlockHint
    if (isRecommended) return null; // polish P-07：不写"今日"
    if (isInProgress && draftStep) {
      return <span>练到{draftStep.stepName}</span>; // 例: "练到 觉察"
    }
    if (isMastered) {
      return (
        <span>
          练过 {practiced} 次
          {status === 'mastered_deep' && practiced >= 5 && ' · 深入'}
        </span>
      );
    }
    if (status === 'available' && code) return <span>可练</span>;
    return null;
  };

  const content = (
    <>
      <div className="flex items-center gap-2">
        {renderIcon()}
        <span className={isLocked ? 'text-neutral-500' : 'text-foreground'}>{title}</span>
      </div>
      <div className="text-xs text-neutral-500">{renderSubtitle()}</div>
    </>
  );

  // aria-label 拼接
  const ariaLabel = (() => {
    const base = title;
    if (isLocked) return `${base}（${unlockHint ?? '未解锁'}）`;
    if (isRecommended) return `${base}（推荐）`;
    if (isInProgress && draftStep) return `${base}（进行中：${draftStep.stepName}）`;
    if (status === 'mastered_deep') return `${base}（已练过 ${practiced} 次，深入）`;
    if (status === 'mastered_basic') return `${base}（已练过 ${practiced} 次）`;
    return `${base}（可练）`;
  })();

  // 锁定 / 无 code：不可点
  if (isLocked || !code) {
    return (
      <div
        className={baseClass}
        aria-disabled="true"
        aria-label={ariaLabel}
        title={isLocked ? unlockHint : undefined}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/drill?code=${code}`}
      className={baseClass}
      aria-label={ariaLabel}
    >
      {content}
    </Link>
  );
}
```

> 行数：约 130 行（含注释、空行、类型定义）。**在 200 行预算内**。

---

## 7. 顶部状态条：温和连击 + 低压力模式开关

### 7.1 当前位置

| 元素 | 位置 | 渲染组件 |
| --- | --- | --- |
| 温和连击（"练过 N 次 · M 天的练习 · 可休整 K 天"） | `today/page.tsx` 内 `<header>` 副标题 | 当前 `today/page.tsx` 78 行 |
| 低压力模式开关（默认 ON） | `GlobalHeader` 顶部右侧 | `src/components/layout/GlobalHeader.tsx` 第 19-27 行 |

### 7.2 设计决策：双层 vs 单层

> **双层方案**（当前实现）✅ 采纳
>
> - **顶部 GlobalHeader**：常驻 Logo + LPM 开关（任何页面可达）—— **全局层**。
> - **主页内 header**：累计 + 温和连击 —— **今日专属层**。
>
> 原因：
> 1. LPM 开关是**全局设置**（影响推送 / 动效 / 红点），属于 GlobalHeader 范畴（`docs/02-Prototype.md` §5.2）。
> 2. 温和连击 + 累计是**今日专属指标**，属于 `today/page.tsx` 主页语境。
> 3. **不在主页内重复** LPM 开关——避免"两个 LPM 入口"的混乱感。

### 7.3 主页内状态条（拟稿）

```
┌────────────────────────────────────────────────────┐
│ 今日                                                │
│ 🌱 练过 12 次 · 3 天的练习 · 可休整 1 天            │  ← polish P-09：去"🔥"去"连续"
│                                                     │
│ 边界成长路                                          │
└────────────────────────────────────────────────────┘
```

### 7.4 位置设计要点

- **不抢眼**：副标题用 `text-sm text-neutral-500`，与"今日"主标题形成层级。
- **永不下沉**：温和连击是**累计**指标（"练过 N 次"），不是"今日 X/Y"，**不显示"未完成"**红色。
- **"可休整 K 天"小字**：K 为本周剩余休整日，**不强调**"你必须休整"。
- **动效**：数字变化（+1）用 200ms fade-in（polish §11）；归零**无动效**（避免"丢失"感知）。

### 7.5 与 GlobalHeader 的一致性

- **LPM 开关**：在 GlobalHeader 显示"低压力 · 开"（Shield 图标 + 文字）。
- **主页副标题**不复述 LPM 状态——避免冗余。
- **点击 GlobalHeader 的 LPM 入口** → 跳 `/settings`，与"我 → 设置"中的 LPM 开关**共享**同一份状态。

---

## 8. 风险点：与 GlobalHeader / BottomNav 的兼容性

### 8.1 与 GlobalHeader 的兼容

| 项 | 风险 | 建议 |
| --- | --- | --- |
| LPM 开关位置 | 已在 GlobalHeader ✅；但 `GlobalHeader` 当前是"装饰"链接 → `/settings`，**未真正承载 LPM 状态切换** | T-08（低压力模式开关 + 推送控制）会落地真正的 Toggle；T-01 主页**不修改** GlobalHeader |
| 顶部双层信息 | 主页 header（温和连击）+ GlobalHeader（LPM）= 视觉上**两个顶部条** | 已存在 ✅；保持现状，**不在主页**再画第二条 LPM |
| 滚动时吸顶 | GlobalHeader 当前是 `border-b border-border bg-surface/80 backdrop-blur`（无 sticky），**不吸顶** | 不修改（保持低调） |
| 主页 `<h1>` 与 GlobalHeader 视觉竞争 | GlobalHeader 有"不委屈" Logo（h-14），主页有"今日" `<h1>`（text-2xl）| 当前实现可接受；T-01 维持 |

### 8.2 与 BottomNav 的兼容

| 项 | 风险 | 建议 |
| --- | --- | --- |
| 主页底部 | BottomNav 是 `sticky bottom-0`，**不画在主页** | 主页自然结束 → 底部 BottomNav 接住；当前实现 ✅ |
| 主页 footer | 主页内有"今天就到这里"按钮 + "不委屈是成长陪伴..." footer（`today/page.tsx` 第 111-121 行） | 保留 ✅；与 BottomNav 不冲突 |
| 技能树滚动 + BottomNav | 节点多时滚动条与 BottomNav 视觉竞争 | BottomNav `bg-surface/95 backdrop-blur` ✅，足够清晰 |
| `aria-current="page"` | BottomNav 当前 active 态在 `/today` 上 | T-01 维持 ✅ |

### 8.3 状态数据流

| 数据 | 来源 | 当前 | 风险 |
| --- | --- | --- | --- |
| 累计 `practiced` | 内存 `sections` 写死 | `today/page.tsx` 写死为 0 / 1 / 2 | M2 PoC 阶段可接受；T-12（我 → 进度）会接入真实存储 |
| 温和连击 `gentleStreak` | 内存写死 | `gentleStreak = { days: 3, restDaysLeftThisWeek: 1 }` | T-07（温和连击 + 休整日）会接 API |
| 草稿 `draftStep` | 内存写死 | `draftStep: '5/12'` | **M2 范围**：演练未实现，T-01 写死为占位值；T-03/T-04 接 API |
| 推荐节点 `recommended` | 内存写死 | `s2-want` 标 `recommended`（与 §4 L3-01 建议冲突） | ⚠️ **本稿建议**：M2 阶段把 L3-01 标 `recommended`；当前实现标在 L2 是为演示 M2 之前的"过渡形态"。**最终以 Coordinator 拍板为准** |

### 8.4 已知冲突（**不擅改**）

| 冲突位置 | 现象 | 本稿处理 |
| --- | --- | --- |
| `today/page.tsx:34` | `draftStep: '5/12'` 字符串（数字） | 本稿建议扩展为 `{ stepIndex, stepName }`；**本稿不修改**源代码 |
| `today/page.tsx:42-44` | `s2-want` 等 3 个 L2 节点标 `recommended` / `available`，与 plans/m2-poc.md "M2 唯一可点 = L3-01" 不一致 | 本稿建议把 L3-01 标 `recommended`；**本稿不修改**源代码 |
| `SkillNode.tsx:44` | 锁定节点常驻文字「需 §1 走完」 | 本稿建议改 hover 才显示；**本稿不修改**源代码 |
| `SkillNode.tsx:47-48` | mastered_deep 与 mastered_basic 图标都是单 `Star`（实心 vs 描边），与 §4.4 "★★" 双金冠不一致 | 本稿建议双金冠；**本稿不修改**源代码 |
| `SkillNode.tsx:63` | 推荐节点副文本写「推荐」 | 本稿建议删除（polish P-07）；**本稿不修改**源代码 |
| `SkillNode.tsx` | 节点之间**无视觉连接线**（与 §6.2 描述的"路径细线"不一致） | 本稿建议 ul 缩进 + 1px 虚线；**本稿不修改**源代码 |
| `today/page.tsx:113` | "今天就到这里" 跳 `/conversation`（自由对话），与 §6.2 期望"安静收束"不一致 | 本稿建议：保留 Link 行为不变（与 v1.0 习惯一致），**本稿不修改**源代码 |

### 8.5 总结：T-01 实施时的"必改"清单

> 全部由 Coordinator 批准后，**另立实施任务**（不在本任务范围）：

1. `SkillNode.tsx` 锁定节点 hover 才显示引导
2. `SkillNode.tsx` mastered_deep 双金冠
3. `SkillNode.tsx` 推荐节点不写"推荐"文字
4. `SkillNode.tsx` `draftStep` 类型扩展为 `{ stepIndex, stepName }`
5. `SkillNode.tsx` 节点之间添加 1px 虚线连接
6. `today/page.tsx` 把 L3-01 标 `recommended`（与 plans/m2-poc.md 对齐）
7. （可选）`today/page.tsx` 顶部副标题接 `gentleStreak` 真实数据（T-07 阶段）

---

## 9. 红线自检（CLAUDE.md §5）

> 对照 `PROJECT_MAP.md` §5 红线 + `docs/02-Prototype.md` §16.3 拒绝清单。

| 红线 | 本稿情况 | 通过 |
| --- | --- | --- |
| ❌ 心数 / 宝石 / 排行榜 / 打卡天数 / 付费修复 / 催促型推送 | 本稿不引入；累计文案为"练过 N 次"，无"坚持 N 天" | ✅ |
| ❌ "你太软弱 / 你应该 / 你连这都…" | 文案系统遵循 prototype §10，全部为"我"第一人称 | ✅ |
| ❌ 在危机路径给"怎么办"建议 | 主页不涉及危机路径；危机由 T-09 独立处理 | ✅ |
| ❌ KB 全文注入 LLM | 本稿不涉及 KB / LLM | ✅ |
| ❌ 完整 history 注入 LLM | 本稿不涉及 | ✅ |
| ❌ 多 Agent 重复消费上下文 | 本稿为单 Agent（FE）调研 + 设计稿，待 Coordinator 审核 | ✅ |
| ❌ 不做安全评审就上线情绪功能 | 本稿为设计稿，不上线；后续 T-15 / T-16 评审必跑 | ✅ |
| ❌ 显示用户 PII | 本稿不涉及用户身份 | ✅ |
| §16.3 拒绝清单 grep 自检 | 本稿未引入 heart / lives / gem / coin / leaderboard / league / streak-repair / 🔴 红字 | ✅ |
| §16.3 推送文案自检 | 本稿未涉及推送文案（T-08 处理） | ✅（T-01 范围内无推送） |
| §16.2 借鉴与改造 11 条 | 主页为技能树 ✅、演练 12 步（T-03 实施）✅、LPM 顶部常驻 ✅、缺失静默归零（T-07）✅、休整 1-2 天 ✅、无货币 ✅、无排行 ✅、无打卡天数 ✅、无付费修复 ✅、推送默认关（T-08）✅、进度页（"我 → 进度"）不展示打卡天数（T-12）✅、累计文案 ✅、"今天就到这里"永远可达 ✅ | ✅ |

**结论**：本稿**符合 CLAUDE.md 红线 + docs/02-Prototype.md §16 全部自检项**。

---

## 10. 待 Coordinator 拍板的 3 个开放问题

| # | 问题 | 建议 |
| --- | --- | --- |
| Q1 | M2 阶段 L3-01 应该标 `recommended`（软发光）还是 `available`（可练）？ | 建议 `recommended`（S-PoC-01 故事明确阿瑶"看到推荐 → 点"） |
| Q2 | mastered_deep 双金冠是否在 M2 阶段必须实做？M2 范围"1 个微技能 + 12 步"，practiced 永远 ≤ 1，理论上不会触发 `mastered_deep` | 建议**实做**（与 polish P-08 一致；为 M3 留接口） |
| Q3 | 节点之间视觉连接线（1px 虚线）是否在 T-01 实施范围内？ | 建议**是**（与 §6.2 形态一致；纯 CSS，无 SVG 风险） |

---

## 11. Follow-up（不属本任务）

1. T-02（PE+KE）：L3-01 场景卡 + 12 步内容。
2. T-03（FE）：12 步演练前端组件（步骤切换 / 暂停 / 退出 / 收束）。
3. T-04（BE）：12 步演练后端 + 状态机。
4. T-05（PE+A+BE）：AI 编排适配 12 步。
5. T-06（FE+BE）：今日三件小事前端 + 后端（含"必做 = 唯一发光节点"映射）。
6. T-07（FE+BE）：温和连击 + 休整日真实数据接入。
7. T-08（FE+BE）：低压力模式开关（GlobalHeader 的 Toggle 化）+ 推送控制。
8. T-12（FE+BE）：我 → 进度（v2.0 形态：5 段旅程地图 + 练过的瞬间）。

---

> **本稿自检**：
> - 不修改 src/ 任何源代码 ✅
> - 不启动 dev server / npm test ✅
> - 产出物为 markdown 设计稿 ✅
> - 关键决策可回溯到 docs/02-Prototype.md v2.0.1 + plans/m2-poc.md ✅
> - 符合 CLAUDE.md 红线 + docs/02-Prototype.md §16 自检 ✅
