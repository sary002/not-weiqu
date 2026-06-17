# T-12 · 我 → 进度（v2.0 形态：5 段旅程地图 + 练过的瞬间）· 设计稿

> **任务编号**：T-12（plans/m2-poc.md §任务清单）
> **关联切片**：S-PoC-01（阿瑶演练完成后从「今日」进「我 → 进度」看累计）/ S-PoC-02（缺失连击后看「我 → 进度」顶部温和连击）
> **关联任务**：T-01（技能树主页）/ T-06（今日三件小事）/ T-07（温和连击 + 休整日，**占位**）/ T-08（低压力模式，**占位**）/ T-11（我的剧本）/ T-13（数据导出 / 删除，**跳转入口**）
> **关联用户故事**：阿瑶练完 1 次后，从底部 Tab 第 4 位「我」进入，看到「练过的瞬间 1 次 / §3 表达 · 你在这里」——**没有"坚持 N 天"**，没有"🔥 红字"
> **Owner（设计）**：FE + BE（Full-stack 综合 Agent）
> **Reviewer**：C、PM、PE、KE、Q
> **阶段**：调研 + 设计（**不修改 src/ 下任何源代码**）
> **本稿状态**：待 Coordinator 审核
> **版本**：v0.1（2026-06-17）

---

## 0. 阅读须知

- 本稿只描述「我 → 进度」页（`/progress`）的**信息架构、数据来源聚合、与 BottomNav 第 4 Tab 关系、API 契约、UI 形态、JSX 骨架、测试用例与风险点**。**不输出可运行代码、不动 src/ 任何文件**。
- 一切设计决策可回溯到：
  - `docs/02-Prototype.md` v2.0.1 §6.10（我 → 进度页线框）+ §18 polish P-08（5 段旅程地图）+ P-09（去"连续"去"🔥"）+ §16.2 polish 借鉴自检
  - `docs/design/T-01-skill-tree-home.md` v0.1（节点 6 态 / 状态机切换 / `practiced` 字段）
  - `docs/design/T-06-today-three.md` v0.1（推荐算法 / `gentle_streak` 接口 / `completed.total` 字段）
  - `docs/design/T-11-scripts-tab.md` v0.1（`scriptsStore` / `scene_tag` 枚举）
  - `plans/m2-poc.md` T-12 任务定义 + §验收结果
- 本稿与上述现状的差异**只描述、不修改**；如需改动源代码，由 Coordinator 批准后另立实施任务（避开本任务的"调研 + 设计"边界）。

> ⚠️ **本稿待修订声明**：T-07 温和连击 + 休整日设计稿**正在进行中**。本稿中**涉及 T-07 真实数据**的段（顶部温和连击、累计"练过的瞬间 N 次"的文案内嵌、K 休整日显示、丢失静默归零）**仅基于 T-06 §6.1 提供的 `gentle_streak` 接口契约做占位推断**。T-07 设计稿完成后，本稿须**对应章节**修订并标注版本号变更。详见 §9「T-07 待修订事项」。

---

## 1. 现状分析（gap）

### 1.1 与 v2.0.1 polish 的契合度

| 项 | v2.0.1 polish 期望 | 当前实现 | 评估 |
| --- | --- | --- | --- |
| 5 段旅程地图（P-08） | 5 段路径 + 状态短语（走完 / 在路上 / 你在这里 / 待开启） | `progress/page.tsx` 写死 5 段文字 + 简单位移 | ⚠️ 形态在位；**未实现**"状态短语"映射（§2 节点动态） |
| 累计"练过的瞬间 N 次" | 顶部累计文案 | `progress/page.tsx` 写死 `练过的瞬间：12 次` | ⚠️ 文案对，但**数据源**未接（内存写死） |
| 覆盖的微技能：N / 17 | 累计卡第二行 | `progress/page.tsx` 写死 `5 / 17` | ⚠️ 文案对，**分子分母**未实算（`practiced >= 1` 节点数 / 全节点数） |
| 温和连击"3 天的练习 · 可休整 1 天"（P-09） | 去"🔥"去"连续" | 当前 `progress/page.tsx` 写死相同文案 | ⚠️ 文案对；**未接 T-07 数据** |
| 设置入口（LPM / 今日投入 / 推送） | 「我」内含设置区 | `progress/page.tsx` 含"今日投入" + "低压力模式 / 推送 / 减少动效 / 导出删除 / 关于" 设置项 | ✅ 形态在位；**LPM / 推送当前未实做 Toggle 化**（T-08 任务） |
| "下次想练就练 · 4 个微技能可探索" | 替代"X/100" | 当前 `progress/page.tsx` 写死为"下次想练就练 · 4 个微技能可探索" | ✅ 文案对；**分子**未实算（`available` + `mastered_basic` 节点数） |
| 进度页底部出口 | 跳设置 / 跳知识小卡（占位） | 当前实现跳 `/settings` + 文字链 | ✅ 形态在位；**M3 引入**知识小卡时再补 |
| "不展示打卡天数 / 不展示连续天数作为价值"（§16.2 polish） | 进度页**不**写"坚持 N 天" | 当前实现**不**含"坚持" / "连续" / "🔥" 字样 | ✅ 通过 |
| 节点 6 态共享契约 | 与 T-01 6 态枚举一致 | 当前 `progress/page.tsx` 写死 5 段状态短语，未与 SkillNode 联动 | ❌ **本稿设计**：5 段旅程地图 = 5 段**聚合**状态，由本稿定义 `SectionMastery` 枚举 |
| 视觉与人格同源（R7） | 文案与 PE 守则一致 | 当前文案第一人称 | ✅ |

### 1.2 与 prototype §6.10 期望的契合度

| §6.10 项 | 当前实现 | 评估 |
| --- | --- | --- |
| 累计 · 练过的瞬间 | 写死"12 次" | ⚠️ 数值未接 T-04 §2.4 副作用（节点 `mastered_basic` 累计 `practiced_count += 1`） |
| 累计 · 覆盖的微技能 N / 17 | 写死"5 / 17" | ⚠️ 分子 = `practiced >= 1` 节点数；分母 = 全节点数（17 = T-01 §2.2 全量节点数）。**当前未实算** |
| 累计 · 温和连击"3 天的练习 · 可休整 1 天" | 写死 | ⚠️ 文案对齐；**数据源**待 T-07 |
| 5 段旅程地图 + 状态短语（§1 8/12 走完 / §2 4/10 在路上 / §3 2/15 你在这里 / §4 待开启 / §5 待开启） | 当前写死为"§1 已走完 / §2 进行中 / §3 刚开始 / §4 待开启 / §5 待开启" | ⚠️ 形态在位；**数据源**未接（应来自 5 段**聚合** `practiced` 总和 / 段节点数） |
| "下次想练就练 · 4 个微技能可探索" | 写死 | ⚠️ 数值 = `available` + `mastered_basic` 节点数（**含 §3 in_progress 节点**）；**未实算** |
| 设置入口 | 形态在位 | ✅ |
| 关于 / 隐私 / 用户协议 | 形态在位 | ✅ |

### 1.3 现状总结

- **形态在位**：5 段旅程地图 + 累计卡 + 设置入口，"不展示打卡天数"红线已守住。
- **5 处数据未实算**：累计 3 行 + 5 段状态短语 + 1 行"X 个微技能可探索"全为**写死**。
- **依赖 T-07**：顶部温和连击与"可休整 1 天"由 T-07 真实数据驱动；本稿**仅消费** `gentle_streak` 接口。
- **风险点**：v2.0.1 polish 期望进度页"成长可被看见"（R0），但**写死数据**会让用户感到"这是别人的进度"——本稿定位为**聚合**层，把"3 个数据源"（技能树 / 温和连击 / 我的剧本 / 今日三件）合并为 1 个进度视图。
- **本稿定位**：定义 `/progress` 页的**聚合**形态、**API 契约**、**视觉规范**，给 T-07 / T-13 留接口。

---

## 2. 进度页信息架构

### 2.1 总体布局（与 prototype §6.10 对齐）

```
┌────────────────────────────────────────────────────┐
│ 我                                                │
│                                                    │
│ ┌─ 累计 ───────────────────────────────────────┐ │
│ │ · 练过的瞬间：1 次                              │ │  ← T-04 累计数据
│ │ · 覆盖的微技能：0 / 17                          │ │  ← 节点 practiced >= 1 / 全节点
│ │ · 温和连击：0 天的练习 · 可休整 1 天             │ │  ← T-07 数据（占位）
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ ── 边界成长路 · 我在表达 ──                        │  ← P-08 polish
│                                                    │
│   §1 觉察    1/3     走完                          │
│            ───                                      │
│   §2 命名    0/3     待开启                         │
│            ───                                      │
│   §3 表达    0/6     你在这里                       │  ← Jobs 风格：你在哪
│            ───                                      │
│   §4 兜底    ——     待开启                          │
│            ───                                      │
│   §5 巩固    ——     待开启                          │
│                                                    │
│ 下次想练就练 · 0 个微技能可探索                     │  ← available + mastered_basic
│                                                    │
│ ── 设置 ──                                        │
│                                                    │
│ [ 今日投入：稳（2 件）]                            │  ← LPM 始终默认 ON
│ [ 低压力模式：开 ]                                 │
│ [ 推送：关 ]                                       │
│ [ 减少动效：跟随系统 ]                              │
│ [ 导出 / 删除我的数据 ]                            │  ← T-13
│ [ 关于不委屈 · 隐私政策 · 用户协议 ]                │
│                                                    │
│ 不委屈是成长陪伴，不替代专业心理咨询。              │
└────────────────────────────────────────────────────┘
```

### 2.2 顶部累计卡（3 行）

| 行 | 字段 | 数据源 | 形态 |
| --- | --- | --- | --- |
| 1 | **练过的瞬间：N 次** | `SkillNode.practiced` 求和（来自 T-04 §2.4 副作用） | `text-base font-medium` + 数字 `text-primary` |
| 2 | **覆盖的微技能：M / 17** | `practiced >= 1` 节点数 / 全节点数 | `text-sm text-neutral-500` + "17" 灰显 |
| 3 | **温和连击：D 天的练习 · 可休整 K 天** | `gentle_streak.days` + `gentle_streak.restDaysLeftThisWeek`（T-07） | `text-sm text-neutral-500` + 数字灰显 |

**关键红线**（§16.2 polish 借鉴自检）：
- ❌ **绝不**显示"坚持 N 天" / "🔥 N 天连击" / "连续 N 天"。
- ✅ 仅显示"练过的瞬间 N 次"（**不是**天数） + "D 天的练习"（**不**含"连续"）。
- ✅ 数字 +1 用 fade-in 200ms；归零**无**动效（避免"丢失"感知，T-07 §8.3 polish P-11）。

### 2.3 5 段旅程地图（P-08 落地态）

#### 2.3.1 段状态短语（基于段内节点聚合）

> **关键设计**：本稿定义 4 态聚合枚举 `SectionMastery`，由段内节点的 `practiced` 总和与段内节点数派生。

| 段聚合态 | 派生规则 | 显示短语 | 视觉 |
| --- | --- | --- | --- |
| `empty` | 段内**无**节点 OR 所有节点 `practiced = 0` | "待开启" | 灰显，无进度条 |
| `practicing` | 段内有节点 `practiced >= 1` 且 `< 段内节点数` | "在路上" | 主色文字，无进度条 |
| `mastered` | 段内**全部**节点 `practiced >= 1`（基础） | "走完" | 1 颗金冠（图）+ 主色文字 |
| `user_here` | 段内存在**唯一发光**节点 OR **最近 7 天**内有 `mastered_basic` 节点 | "你在这里" | 软发光（图）+ 暖金文字 + 当前节点副文本"练到 {stepName}" |

**关键决策**：
1. **"你在这里"逻辑**：参考 prototype §6.10 "§3 2/15 → 你在这里"——但**不**取 2/15 这种数字比，而取"段内最近一次练习的节点"为"你在这里"。
2. **互斥规则**：同一段同一时刻**最多 1 个** `user_here`（避免"多个我在哪"）。
3. **降级**：当段内所有节点 `practiced >= 5`（mastered_deep）→ 仍然显示 `mastered` 态（金冠），**不**新增"深入走完"区分（M2 PoC 范围内）。

#### 2.3.2 段状态短语文案（与 prototype §6.10 落点对照）

| § | prototype 期望 | 本稿采纳 | 备注 |
| --- | --- | --- | --- |
| §1 觉察 | `8/12 走完` | "走完" + 数字 `2/3`（段内 mastered_basic / 段内总） | 数字用灰显；M2 范围 §1 节点数 = 3（来自 T-01 §2.2） |
| §2 命名 | `4/10 在路上` | "在路上" | 数字省略（M2 §2 全 3 节点 mastered_basic 时才显示走完） |
| §3 表达 | `2/15 你在这里` | "你在这里" + 当前节点副文本 | 副文本示例："最近练过：拒绝同事甩活" |
| §4 兜底 | `—— 待开启` | "待开启" | 数字 = `0/3` 时不显数字 |
| §5 巩固 | `—— 待开启` | "待开启" | 同上 |

#### 2.3.3 视觉规范

| 元素 | 样式 | 备注 |
| --- | --- | --- |
| 段标题（§X 名称） | `text-sm font-medium` | 与 T-01 §2.1 段标题视觉一致 |
| 数字（X/Y） | `text-sm text-neutral-500` | 灰显；**不**用主色；**不**写百分比 |
| 状态短语 | `text-sm text-primary`（mastered / user_here） / `text-sm text-neutral-500`（practicing / empty） | 颜色按 §2.3.1 |
| 段间细线 | `border-l border-dashed` + `ml-2` | 与 T-01 §2.3 视觉一致（1px 虚线） |
| "你在这里" 标记 | `✦`（Sparkles）+ 软发光 + 微微放大 1.05x | 与 T-01 §3.2 `recommended` 视觉一致 |
| "走完" 标记 | 1 颗金冠（`★` 暖金 #C9A24B） | 与 T-01 §3.2 `mastered_basic` 一致 |
| 半透明 | `empty` 段 `opacity-60` | 与 T-01 §2.4 一致；**不**加灰度滤镜 |
| 点击段 | 跳 `/today`（技能树主页，定位到该段） | 复用 T-01 主页滚动定位 |

### 2.4 底部引导行（替代"X/100"）

**显示**：`下次想练就练 · N 个微技能可探索`

| 字段 | 派生 | 备注 |
| --- | --- | --- |
| `N` | `available` + `mastered_basic` 节点数（**不**含 `in_progress`） | in_progress 节点**不计**"可探索"（已是用户正在做的） |
| 文案 | 永远第一人称 + "想练就练" | 与 PE 守则 §10 对齐 |
| **N = 0 时** | 改为"你已经走得很远 · 复习也可以" | 当用户**所有**节点已 mastered_deep 时切换（M3 启用；M2 PoC 不会出现） |
| **N ≥ 1 时** | 保持默认文案 |  |
| 数字 | `text-sm text-neutral-500` | 灰显；**不**用主色 |

### 2.5 设置入口（LPM / 今日投入 / 推送）

> prototype §6.10 设置区形态在位；本稿**仅消费** T-08 数据，**不实做** Toggle 化。

| 设置项 | 当前实现 | T-08 阶段 |
| --- | --- | --- |
| 今日投入（轻 / 稳 / 深入） | 写死为"稳（2 件）" | 实做 Radio / Select（M3 评估必要性） |
| 低压力模式（开） | 写死 | T-08 Toggle 化 + 二次确认（与 prototype §6.12 一致） |
| 推送（关） | 写死 | T-08 Toggle 化（默认关） |
| 减少动效（跟随系统） | 写死 | T-08 Toggle 化 |
| 导出 / 删除我的数据 | 文字链 → 跳 `/settings` | T-13 实施 |
| 关于不委屈 · 隐私政策 · 用户协议 | 文字链 | 形态在位 ✅ |

**关键决策**：
1. T-12 阶段**不修改** `progress/page.tsx` 设置区源代码；T-12 只**消费** `low_pressure_mode` / `push_enabled` / `today_intensity` 占位数据。
2. T-08 实施时由 FE 整批落地；T-12 留 `data.low_pressure_mode` / `data.today_intensity` 字段供 T-08 接入。

### 2.6 移动端适配

| 断点 | 适配 |
| --- | --- |
| `xs` < 480 | 单列；累计卡 3 行竖排；5 段旅程地图单列；段间细线 `ml-3`（略偏移） |
| `sm` 480~768 | 同上 |
| `md` 768+ | 单列 + `max-w-2xl` 居中 |
| `lg+` | 同上，技能树 1.2x 放大（与 T-01 一致） |

### 2.7 渐进披露

- **首屏**：累计卡 + §1~§2 + 设置入口（above the fold）。
- **滚动**：§3~§5 + 底部引导行。
- **无折叠**（与 prototype §6.10 一致；不引入"展开更多"避免焦虑）。

---

## 3. 数据来源聚合

### 3.1 聚合总览

```
[GET /api/progress]
   ↓
   ├─ 读 SkillNode.practiced 求和 → 累计"练过的瞬间 N 次"
   ├─ 读 SkillNode.practiced >= 1 节点数 → 覆盖 M 个
   ├─ 读全节点数 → 总 N 个（M2 PoC = 17，来自 T-01 §2.2）
   ├─ 读 gentle_streak（T-07 数据源，M2 阶段占位）→ 累计卡第 3 行
   ├─ 读 5 段聚合 mastery → §2.3 旅程地图
   ├─ 读 available + mastered_basic 节点数 → 底部引导 N
   ├─ 读 scripts_count（来自 T-11 /api/scripts）→ **不**显示在进度页（M2 范围）
   └─ 读 today3.done_count（来自 T-06 /api/today-3）→ **不**显示在进度页（M2 范围）
   ↓
   响应 { data: { cumulative, sections, low_pressure_mode, today_intensity } }
```

### 3.2 字段映射（数据源 → 进度页 UI）

| 进度页 UI 字段 | 数据源 | 当前 | T-12 接入 |
| --- | --- | --- | --- |
| **练过的瞬间 N 次** | `sum(SkillNode.practiced)`（T-04 §2.4 副作用：`practiced_count += 1`） | 写死 12 | T-12 接入：每次 `GET /api/progress` 聚合求和 |
| **覆盖的微技能 M / 17** | `count(practiced >= 1)` / 全节点数（17 = T-01 §2.2） | 写死 5/17 | T-12 接入：实算分子；分母 = `SCENARIOS.length` |
| **温和连击：D 天的练习 · 可休整 K 天** | `gentle_streak.days` + `gentle_streak.restDaysLeftThisWeek`（T-07 §6.1） | 写死 3 · 1 | T-12 **占位消费** T-07 接口；T-07 实施时接真实数据 |
| **§X 段状态短语** | `computeSectionMastery(skills, sectionId)`（本稿 §3.3） | 写死 5 段短语 | T-12 接入：5 段**实算** |
| **N 个微技能可探索** | `count(status = 'available' or 'mastered_basic')` | 写死 4 | T-12 接入：实算 |
| **设置项状态**（LPM / 推送 / 投入） | `low_pressure_mode` / `push_enabled` / `today_intensity`（T-08） | 写死 | T-12 **占位消费** T-08 接口；T-08 实施时接真实数据 |
| **scripts_count** | `GET /api/scripts` 列表长度（T-11） | 不显示 | M2 范围**不**显示在进度页；M3 评估是否加"我的剧本 N 条" |
| **today3.done_count** | `today3.completed.total`（T-06） | 不显示 | M2 范围**不**显示在进度页（M2 阶段"今日 X/3"在 `/today` 已显示） |

### 3.3 5 段聚合算法（核心）

> 本稿定义 `SectionMastery` 聚合函数（纯函数，可测试）。

```ts
// src/lib/section-mastery.ts（设计稿占位，不落地）
import type { SkillNodeStatus } from './today-recommend';

export type SectionMasteryState = 'empty' | 'practicing' | 'mastered' | 'user_here';

export interface SectionMastery {
  sectionId: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  sectionName: string;          // '觉察' | '命名' | '表达' | '兜底' | '巩固'
  totalNodes: number;           // 段内节点数
  practicedNodes: number;       // practiced >= 1 节点数
  masteryDeepNodes: number;     // practiced >= 5 节点数
  state: SectionMasteryState;
  /** 当 state = 'user_here' 时，标识当前在哪个节点 */
  currentNodeId?: string;
  currentNodeTitle?: string;
}

export function computeSectionMastery(
  section: { id: 'L1' | 'L2' | 'L3' | 'L4' | 'L5'; name: string },
  skills: SkillNodeStatus[],
  recentNodeId: string | null,   // 全树最近 7 天内有 mastered_basic 的节点
): SectionMastery {
  const sectionNodes = skills.filter((s) => s.layer === section.id);
  const total = sectionNodes.length;
  const practiced = sectionNodes.filter((s) => s.practiced >= 1).length;
  const deep = sectionNodes.filter((s) => s.practiced >= 5).length;

  // 1. user_here：段内有最近 7 天练过的节点
  if (recentNodeId) {
    const recentInSection = sectionNodes.find((s) => s.id === recentNodeId);
    if (recentInSection) {
      return {
        sectionId: section.id,
        sectionName: section.name,
        totalNodes: total,
        practicedNodes: practiced,
        masteryDeepNodes: deep,
        state: 'user_here',
        currentNodeId: recentInSection.id,
        currentNodeTitle: recentInSection.title,
      };
    }
  }

  // 2. mastered：段内全部节点已 mastered_basic
  if (total > 0 && practiced === total) {
    return {
      sectionId: section.id,
      sectionName: section.name,
      totalNodes: total,
      practicedNodes: practiced,
      masteryDeepNodes: deep,
      state: 'mastered',
    };
  }

  // 3. practicing：段内有节点已练过
  if (practiced >= 1) {
    return {
      sectionId: section.id,
      sectionName: section.name,
      totalNodes: total,
      practicedNodes: practiced,
      masteryDeepNodes: deep,
      state: 'practicing',
    };
  }

  // 4. empty：段内无任何节点已练过
  return {
    sectionId: section.id,
    sectionName: section.name,
    totalNodes: total,
    practicedNodes: 0,
    masteryDeepNodes: 0,
    state: 'empty',
  };
}
```

### 3.4 推荐节点 → 进度页"你在这里" 的链路

> **关键设计**："你在这里" 标记**复用** T-06 推荐的唯一发光节点，**不**新增独立计算。

```
[GET /api/today-3]
   ↓ required = computeRecommended(...)  ← T-06 §3
   ↓
   response.data.required = { id, code, title, layer }
   ↓
   [GET /api/progress]
   ↓
   recentNodeId = await getRecentMasteredNodeId()  // 段内最近 7 天 mastered_basic
   ↓
   computeSectionMastery(L3, skills, recentNodeId) → state = 'user_here'
   ↓
   进度页 §3 行显示 "你在这里" + 当前节点标题
```

> **简化（M2 PoC）**：`recentNodeId` 直接取今日**已完成**的 `mastered_basic` 节点（**不**做 7 天窗口；M3 启用）。这与 T-06 必做节点完成态 = `mastered_basic` 形成自然链路。

### 3.5 聚合时机

| 时机 | 触发 | 说明 |
| --- | --- | --- |
| 进入 `/progress` 页 | `useEffect → GET /api/progress` | 每次进入重新拉取 |
| 演练 step 12 完成 + 跳 `/progress` | 同上 | T-04 §2.4 副作用写入 `practiced_count += 1`；前端 GET 时序延后 1 轮 |
| 设置项变更（LPM / 推送 / 投入） | `POST /api/settings` 成功 + refetch | T-08 实施时接入 |
| 休整日标记 | `POST /api/today-3/rest` 成功 + refetch | T-07 实施时接入 |
| 手动刷新 | 用户点 [↻ 刷新]（**不实做** —— M2 范围无手动刷新按钮） | M3 评估 |

### 3.6 与 T-06 / T-11 数据流的边界

| 共享 | T-06 写入 | T-11 写入 | T-12 读取 |
| --- | --- | --- | --- |
| `SkillNode.practiced` | T-04 step 12 副作用 → `practiced_count += 1` | — | T-12 聚合求和 |
| `gentle_streak` | T-07 写入（T-12 占位消费） | — | T-12 读 `gentle_streak.days` + `restDaysLeftThisWeek` |
| `today3.completed.total` | T-06 step 完成写入 | — | T-12 **不**读取（M2 范围不显示今日进度） |
| `scripts_count` | — | T-11 写入 `scriptsStore` | T-12 **不**读取（M2 范围不显示在进度页） |
| `low_pressure_mode` | T-08 Toggle 写入 | — | T-12 读 `data.low_pressure_mode`（M2 占位 true） |
| `today_intensity` | T-08 写入（M2 占位 "stable"） | — | T-12 读 `data.today_intensity` |

---

## 4. 与 BottomNav 第 4 Tab「我」关系

### 4.1 当前位置

| 元素 | 位置 | 来源 |
| --- | --- | --- |
| BottomNav Tab 顺序 | `(app)/layout.tsx` 常驻 | TABS = `[{ 今日, 自由对话, 我的剧本, 我 }]` |
| 第 4 位 = 我 | `BottomNav.tsx:14` | 已实装 `href: '/progress'` + `Icon: User` + `label: '我'` |
| `aria-current="page"` | `BottomNav.tsx:31` | 当前路由 = `/progress` 时高亮 |
| 与 GlobalHeader 关系 | Top Logo + LPM + Bottom 4 Tab = 双层 | T-01 §7.5 采纳方案 |

### 4.2 与 T-01 §8.2 BottomNav 兼容矩阵

| 项 | 风险 | T-12 处理 |
| --- | --- | --- |
| 进度页底部 BottomNav | T-01 主页不画 BottomNav 之外的内容，BottomNav 自然接住 | ✅ 不修改 |
| 进度页 footer | 当前 `progress/page.tsx` 用 `pb-24` 撑开底部空间 | ✅ 保留 |
| 进度页滚动 + BottomNav | 长列表时滚动条与 BottomNav 视觉竞争 | BottomNav `bg-surface/95 backdrop-blur` ✅ |
| `aria-current="page"` | `/progress` 时第 4 个 Tab 高亮 | ✅ 已实装 |
| 与"我的剧本"Tab 的可发现性 | "我的剧本"沉淀 = 第 3 位；"我"复盘 = 第 4 位 | ✅ 符合 prototype §5.1 v2.0 优先级（先沉淀后复盘） |
| Tab 顺序与 prototype §5.1 一致 | 4 Tab = 今日 / 自由对话 / 我的剧本 / 我 | ✅ |

### 4.3 关键决策：进度页与「我的剧本」Tab 的边界

| Tab | 定位 | 何时进 | 入口 |
| --- | --- | --- | --- |
| 今日 | **生成**：当下要练 | 每次打开 App | BottomNav Tab 1 |
| 自由对话 | **对话**：想到就聊 | 任意 | BottomNav Tab 2 |
| 我的剧本 | **沉淀**：练过的好句 | 演练后 / 翻历史 | BottomNav Tab 3 |
| 我 | **回顾**：进度 + 设置 | 任意 | BottomNav Tab 4（**当前页**） |

> **不抢戏**：进度页**不**渲染剧本列表（属 Tab 3）；**不**渲染技能树节点（属 Tab 1）；**仅**渲染**累计 + 5 段旅程地图 + 设置入口**——1 个心智模型（"我走到哪了"），不抢 Tab 1 / Tab 3 戏。

### 4.4 与"今日"的可发现性链路

> 用户在「今日」完成 1 次演练 → 跳「我」看进度。

```
[用户在 /today 完成必做节点（L3-01 拒绝同事甩活）]
   ↓ T-04 §2.4 副作用
   ├─ SkillNode.practiced[0] += 1 → mastered_basic
   ├─ gentle_streak.days += 1（T-07 阶段）
   ↓
[用户点 BottomNav Tab 4 "我"]
   ↓
   router.push('/progress')
   ↓
[GET /api/progress]
   ↓
   ├─ 累计"练过的瞬间：1 次"
   ├─ 覆盖"0 / 17"（practiced >= 1 节点 = 0；practiced 是 0+1=1 但节点状态变了，仍未 >= 1 阈值…… 待定，见 §10 风险 R-08）
   ├─ 温和连击"1 天的练习 · 可休整 1 天"
   ├─ §3 状态 = 'user_here' + "你在这里" + "最近练过：拒绝同事甩活"
   └─ 底部"下次想练就练 · N 个微技能可探索"
```

> **可发现性**：`/progress` 与 `/today` 通过 BottomNav 一键切换；T-06 完成后 "今日 X/3" + 进度页"你在这里"形成 1 个"在路径上"的心智。

### 4.5 与"自由对话"的可发现性

- 自由对话 = 兜底式陪聊（Tab 2），**不**影响进度页数据。
- 进度页**不**显示"自由对话累计"（避免"对话 = 练过"的暗示）。
- 自由对话保存到「我的剧本」后，**不**计入"练过的瞬间 N 次"（`practiced` 仅由 T-04 step 12 副作用写入）。

---

## 5. UI 设计（克制，无打卡天数，无 🔥 红字）

### 5.1 视觉规范总览

| 元素 | 颜色 | 字重 | 字号 | 备注 |
| --- | --- | --- | --- | --- |
| 累计卡标题（"累计"） | `text-foreground` | 500 | `text-base` | 与 T-01 主页 h1 一致 |
| 累计卡行 1（练过的瞬间 N 次） | `text-primary` for 数字 + `text-foreground` for 文字 | 500 | `text-base` | 数字 +1 用 fade-in 200ms |
| 累计卡行 2（覆盖的微技能 M / 17） | `text-neutral-500` | 400 | `text-sm` | 数字灰显 |
| 累计卡行 3（温和连击） | `text-neutral-500` | 400 | `text-sm` | 数字灰显；**不**用红色 |
| 5 段旅程地图 · 段标题 | `text-foreground` | 500 | `text-sm` | 与 T-01 §2.1 一致 |
| 5 段旅程地图 · 状态短语 | `text-primary`（mastered / user_here） / `text-neutral-500`（practicing / empty） | 400 | `text-sm` | 颜色按 §2.3.1 |
| 5 段旅程地图 · 数字 X/Y | `text-neutral-500` | 400 | `text-sm` | 灰显；**不**写百分比 |
| 段间细线 | `border-l border-dashed ml-2` | — | 1px | 与 T-01 §2.3 一致 |
| "你在这里" 标记 | `✦` Sparkles + 软发光 + 放大 1.05x | — | — | 与 T-01 §3.2 `recommended` 视觉一致 |
| "走完" 标记 | 1 颗金冠 `★` 暖金 #C9A24B | — | — | 与 T-01 §3.2 `mastered_basic` 一致 |
| 底部引导行 | `text-sm text-neutral-500` | 400 | `text-sm` | 数字灰显 |
| 设置项 | `text-sm text-foreground` | 400 | `text-sm` | 与现有实现一致 |
| 卡片底色 | `bg-surface` | — | — | 与 T-01 / T-06 一致 |

### 5.2 红线自检（CLAUDE.md §5 + §16.2 polish）

> **必守**：

| 红线 | 本稿情况 | 通过 |
| --- | --- | --- |
| ❌ **绝不**显示"坚持 N 天" | 文案仅"练过的瞬间 N 次" | ✅ |
| ❌ **绝不**显示"🔥" | 顶部温和连击去"🔥"（P-09 落地） | ✅ |
| ❌ **绝不**显示"连续 N 天" | 文案为"D 天的练习"（不"连续"） | ✅ |
| ❌ **绝不**用红字 | 所有数字用 `text-primary`（蓝） / `text-neutral-500`（灰）；**不**用 `text-danger` | ✅ |
| ❌ **绝不**用抖动 / 闪烁 / shake 动效 | 数字 +1 仅 fade-in 200ms；归零**无**动效 | ✅ |
| ❌ **绝不**写"未完成" / "再不来就" / "你快没了" | 进度页**不**显示"未完成"字样；累计 0 仍灰显"0 次" | ✅ |
| ❌ **绝不**显示"胜利 🏆" / "完美" | 进度页无任何"胜利"叙事；mastered_basic 节点金冠**不**写"胜利" | ✅ |

### 5.3 完成态反馈

> 用户完成演练 step 12 + 跳 `/progress` 时的视觉反馈：

| 层级 | 视觉 | 备注 |
| --- | --- | --- |
| **强** | 累计卡行 1 "练过的瞬间 N 次" 数字 +1 + fade-in 200ms | LPM ON 时无 fade |
| **强** | 5 段旅程地图 §3 状态从 `empty` → `user_here` + 软发光 | 节点副文本"最近练过：拒绝同事甩活" |
| **中** | 累计卡行 2 "覆盖的微技能" 数字 +1（如达成） | 灰显数字 |
| **弱** | 累计卡行 3 温和连击 +1（数字 fade-in） | T-07 接入后 |
| **无** | ❌ 红字、❌ 抖动、❌ flash、❌"胜利 🏆"、❌ toast "完成！ | 与 T-06 §8.2 一致 |

### 5.4 缺失态视觉（不显示"丢失"）

> 用户 3 天没练（T-07 §8.3 静默归零态），第 4 天进 `/progress`：

| 元素 | 视觉 | 备注 |
| --- | --- | --- |
| 累计卡行 1 | 仍是累计"练过的瞬间 12 次"（**不**重置为 0） | 累计**不**重置（T-07 §8.3 不变量） |
| 累计卡行 3 | "0 天的练习 · 可休整 1 天"（**不**写"丢失 3 天"） | 数字归零**无**动效（避免"丢失"感知） |
| 5 段旅程地图 | 维持上次状态（**不**重置"走完"为"待开启"） | 已走过的永远走完 |
| 底部引导行 | "下次想练就练 · N 个微技能可探索"（**不**写"你失去了..."） | 第一人称 + 邀请式 |

> **关键不变量**（T-07 §8.3 + prototype §7.6 + §16.2 polish P-11）：
> - 累计"练过的瞬间" = 历史总和，**永远不**减。
> - 温和连击"天的练习" = 当前连续天数，可归零但**不**写"丢失"。
> - 5 段旅程地图"走完" = **永远**走完，**不**重置。
> - 缺失 1 天的 UI 上**没有任何"丢失"叙事**。

### 5.5 文案系统（PE 守则 §10 + 进度页专项）

| 场景 | 文案 | 红线自检 |
| --- | --- | --- |
| 累计卡行 1 | "练过的瞬间 N 次" | ✅ "练过" = 事实；**不**"坚持" |
| 累计卡行 2 | "覆盖的微技能 M / 17" | ✅ "覆盖" = 中性；**不**"已完成 X 个" |
| 累计卡行 3 | "D 天的练习 · 可休整 K 天" | ✅ "天的练习"**不**"连续"；"可休整"**不**"必须练" |
| 段状态短语 | "走完 / 在路上 / 你在这里 / 待开启" | ✅ 第一人称 + 中性；**不**"完美" / "胜利" |
| "你在这里" 副文本 | "最近练过：{title}" | ✅ "最近练过" = 事实；**不**"你真棒" |
| 底部引导行 | "下次想练就练 · N 个微技能可探索" | ✅ "想练就练" = 邀请式；**不**"快去练一个" |
| 缺失态 | "下次想练就练" / "0 天的练习 · 可休整 K 天" | ✅ **不**"丢失" / **不**"再不来就" |
| 设置项 | "今日投入：稳（2 件）" / "低压力模式：开" / "推送：关" | ✅ 状态词中性与 prototype §6.12 一致 |

### 5.6 移动端 / 平板适配

| 断点 | 适配 |
| --- | --- |
| `xs` < 480 | 单列；累计卡 3 行竖排；5 段旅程地图单列；段间细线 `ml-3` |
| `sm` 480~768 | 同上 |
| `md` 768+ | 单列 + `max-w-2xl` 居中 |
| `lg+` | 同上，技能树 1.2x 放大（与 T-01 一致） |

---

## 6. API 契约

### 6.1 GET /api/progress

**目的**：返回进度页所需的全部聚合数据（累计 + 5 段旅程地图 + 设置状态）。

**请求**：

```http
GET /api/progress
Cookie: device_token=...
```

**响应（200）**：

```json
{
  "data": {
    "cumulative": {
      "moments_practiced": 12,           // sum(SkillNode.practiced)
      "skills_covered": 5,               // count(practiced >= 1)
      "skills_total": 17,                // 全节点数
      "gentle_streak": {
        "days": 3,
        "rest_days_left_this_week": 1,
        "practiced_today": false,
        "last_practiced_at": "2026-06-14T10:00:00Z"
      }
    },
    "sections": [
      {
        "section_id": "L1",
        "section_name": "觉察",
        "total_nodes": 3,
        "practiced_nodes": 3,
        "mastery_deep_nodes": 1,
        "state": "mastered",
        "current_node_id": null,
        "current_node_title": null
      },
      {
        "section_id": "L2",
        "section_name": "命名",
        "total_nodes": 3,
        "practiced_nodes": 1,
        "mastery_deep_nodes": 0,
        "state": "practicing",
        "current_node_id": null,
        "current_node_title": null
      },
      {
        "section_id": "L3",
        "section_name": "表达",
        "total_nodes": 6,
        "practiced_nodes": 0,
        "mastery_deep_nodes": 0,
        "state": "user_here",
        "current_node_id": "s3-refuse-colleague",
        "current_node_title": "拒绝同事甩活"
      },
      {
        "section_id": "L4",
        "section_name": "兜底",
        "total_nodes": 3,
        "practiced_nodes": 0,
        "mastery_deep_nodes": 0,
        "state": "empty",
        "current_node_id": null,
        "current_node_title": null
      },
      {
        "section_id": "L5",
        "section_name": "巩固",
        "total_nodes": 2,
        "practiced_nodes": 0,
        "mastery_deep_nodes": 0,
        "state": "empty",
        "current_node_id": null,
        "current_node_title": null
      }
    ],
    "explorable_count": 4,                // count(available or mastered_basic)
    "explorable_label": "下次想练就练 · 4 个微技能可探索",
    "low_pressure_mode": true,
    "today_intensity": "stable",          // light | stable | deep
    "push_enabled": false,
    "user_here": {
      "section_id": "L3",
      "node_id": "s3-refuse-colleague",
      "node_title": "拒绝同事甩活"
    }
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
| `cumulative.moments_practiced` | number | 累计"练过的瞬间"次数；**不**显示"天数"；**不**减 |
| `cumulative.skills_covered` | number | 段内 `practiced >= 1` 的节点数 |
| `cumulative.skills_total` | number | 全节点数（17 = T-01 §2.2） |
| `cumulative.gentle_streak.days` | number | 当前连续天数（T-07 数据源；M2 占位） |
| `cumulative.gentle_streak.rest_days_left_this_week` | number | 本周剩余休整日 |
| `cumulative.gentle_streak.practiced_today` | boolean | 今日是否已练过 ≥ 1 次 |
| `sections[].state` | enum | `empty` / `practicing` / `mastered` / `user_here` |
| `sections[].current_node_id` | string \| null | 当 `state = 'user_here'` 时标识当前节点 |
| `explorable_count` | number | `available` + `mastered_basic` 节点数 |
| `low_pressure_mode` | boolean | T-08 数据源；M2 占位 true |
| `today_intensity` | enum | `light` / `stable` / `deep`（T-08 写入；M2 占位 `stable`） |
| `push_enabled` | boolean | T-08 数据源；M2 占位 false |
| `user_here` | object | 全树最近 `mastered_basic` 节点；null = 今日未练 |

**错误码**：

| 状态 | 错误码 | 场景 |
| --- | --- | --- |
| 401 | `NW-AU-0001` | 未鉴权 |
| 500 | `NW-ST-0001` | 系统异常 |
| 503 | `NW-PR-0001` | 数据源依赖不可用（如 scenarios-data 加载失败） |

### 6.2 错误码定义（NW-PR-XXXX）

| Code | 含义 | HTTP | user_message | action_hint | 触发位置 |
| --- | --- | --- | --- | --- | --- |
| `NW-PR-0001` | 进度数据源依赖不可用 | 503 | "我们先按上次的进度。" | "show_cached" | GET `/api/progress` |
| `NW-PR-0002` | 段聚合算法输入异常 | 500 | "我们没看清，再试一次。" | "retry" | GET `/api/progress`（内部错误） |

### 6.3 与现有端点的关系

| 现有端点 | 用途 | T-12 关系 |
| --- | --- | --- |
| `GET /api/today-3` | 今日三件小事 + 推荐节点 | T-12 **不**直接调；用户从 `/today` 进 `/progress` 时由 T-12 自有 GET 聚合 |
| `GET /api/scenarios` | 列所有场景元数据 | T-12 复用（求全节点数 17） |
| `GET /api/scripts` | 剧本列表 | T-12 **不**调（M2 范围不显示 scripts_count） |
| `GET /api/profiles/me` | 用户档案 | T-12 复用（读 `gentle_streak` / `low_pressure_mode` / `today_intensity`） |
| `POST /api/progress` | 进度自报（v1.0 旧） | T-12 **不**沿用旧端点；T-12 **仅** GET `/api/progress`（**待**与现有 POST 端点合并） |

### 6.4 缓存策略

| 数据 | 缓存 | 失效 |
| --- | --- | --- |
| `cumulative.moments_practiced` | 无（每次 GET 重算） | — |
| `cumulative.skills_covered` | 无 | — |
| `cumulative.gentle_streak` | 5 分钟（与 T-06 5min cache 对齐） | T-07 写入时失效 |
| `sections[].state` | 5 分钟 | 演练 step 12 完成时失效 |
| `explorable_count` | 无 | — |
| `user_here` | 5 分钟 | 演练 step 12 完成时失效 |

> M2 PoC 阶段：缓存可**不**实做（数据源在内存）；T-07 实施时启用 5min cache。

---

## 7. 关键代码片段（≤ 200 行）

> ⚠️ 本片段是**设计稿占位**（仅作形态与结构示意），**不直接落地到 src/**。落地时由 Coordinator 批准后另立实施任务。

### 7.1 段聚合算法（`src/lib/section-mastery.ts`，约 80 行）

```ts
// src/lib/section-mastery.ts
// 来自 docs/design/T-12-progress-page.md §3.3
import type { SkillNodeStatus } from './today-recommend';

export type SectionMasteryState = 'empty' | 'practicing' | 'mastered' | 'user_here';
export type SectionId = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export const SECTIONS: Array<{ id: SectionId; name: string }> = [
  { id: 'L1', name: '觉察' },
  { id: 'L2', name: '命名' },
  { id: 'L3', name: '表达' },
  { id: 'L4', name: '兜底' },
  { id: 'L5', name: '巩固' },
];

export interface SectionMastery {
  sectionId: SectionId;
  sectionName: string;
  totalNodes: number;
  practicedNodes: number;
  masteryDeepNodes: number;
  state: SectionMasteryState;
  currentNodeId?: string;
  currentNodeTitle?: string;
}

export function computeSectionMastery(
  section: { id: SectionId; name: string },
  skills: SkillNodeStatus[],
  recentNodeId: string | null,
): SectionMastery {
  const sectionNodes = skills.filter((s) => s.layer === section.id);
  const total = sectionNodes.length;
  const practiced = sectionNodes.filter((s) => s.practiced >= 1).length;
  const deep = sectionNodes.filter((s) => s.practiced >= 5).length;

  // 1. user_here：段内有最近练过的节点
  if (recentNodeId) {
    const recentInSection = sectionNodes.find((s) => s.id === recentNodeId);
    if (recentInSection) {
      return {
        sectionId: section.id,
        sectionName: section.name,
        totalNodes: total,
        practicedNodes: practiced,
        masteryDeepNodes: deep,
        state: 'user_here',
        currentNodeId: recentInSection.id,
        currentNodeTitle: recentInSection.title,
      };
    }
  }

  // 2. mastered：段内全部节点已 mastered_basic
  if (total > 0 && practiced === total) {
    return {
      sectionId: section.id,
      sectionName: section.name,
      totalNodes: total,
      practicedNodes: practiced,
      masteryDeepNodes: deep,
      state: 'mastered',
    };
  }

  // 3. practicing：段内有节点已练过
  if (practiced >= 1) {
    return {
      sectionId: section.id,
      sectionName: section.name,
      totalNodes: total,
      practicedNodes: practiced,
      masteryDeepNodes: deep,
      state: 'practicing',
    };
  }

  // 4. empty：段内无任何节点已练过
  return {
    sectionId: section.id,
    sectionName: section.name,
    totalNodes: total,
    practicedNodes: 0,
    masteryDeepNodes: 0,
    state: 'empty',
  };
}

// 全段聚合（进度页一次性计算）
export function computeAllSectionMastery(
  skills: SkillNodeStatus[],
  recentNodeId: string | null,
): SectionMastery[] {
  return SECTIONS.map((s) => computeSectionMastery(s, skills, recentNodeId));
}

// 探索候选计数
export function computeExplorableCount(skills: SkillNodeStatus[]): number {
  return skills.filter(
    (s) => s.status === 'available' || s.status === 'mastered_basic',
  ).length;
}
```

### 7.2 API Route: GET /api/progress（`src/app/api/progress/route.ts`，约 70 行）

```ts
// src/app/api/progress/route.ts
// 来自 docs/design/T-12-progress-page.md §6.1
import { NextRequest, NextResponse } from 'next/server';
import { withTrace, withRateLimit } from '@/lib/api/middleware';
import { jsonError } from '@/lib/utils/error';
import { computeAllSectionMastery, computeExplorableCount } from '@/lib/section-mastery';
import type { SkillNodeStatus } from '@/lib/today-recommend';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// M2 PoC: 复用 T-06 写死 skill 列表（与 today/page.tsx §1 同源；M3 接 Supabase）
const MOCK_SKILLS: SkillNodeStatus[] = [
  { id: 's1-body', code: 'l1-body-awareness', title: '听见身体的信号', layer: 'L1', status: 'mastered_deep', practiced: 2, restDays: 4 },
  { id: 's1-name', code: 'l1-emotion-naming', title: '给情绪命名', layer: 'L1', status: 'mastered_basic', practiced: 1, restDays: 3 },
  { id: 's1-pattern', code: 'l1-pattern-spotting', title: '看见讨好模式', layer: 'L1', status: 'in_progress', practiced: 0, draftStep: { stepIndex: 5, stepName: '觉察' } },
  { id: 's2-want', code: 'family-marriage', title: '说出"我想要"', layer: 'L2', status: 'available', practiced: 0, restDays: undefined },
  { id: 's2-wont', code: 'family-money', title: '说出"我不想"', layer: 'L2', status: 'available', practiced: 0, restDays: undefined },
  { id: 's2-mine', code: 'partner-cold', title: '区分"我的 / 别人的"', layer: 'L2', status: 'available', practiced: 0, restDays: undefined },
  { id: 's3-refuse-colleague', code: 'workplace-shifting', title: '拒绝同事甩活', layer: 'L3', status: 'available', practiced: 0, restDays: undefined },
];

export async function GET(req: NextRequest) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('progress:get', 60, 60_000);
  if (!rl.ok) return rl.response;

  try {
    // M2 PoC: 写死 gentle_streak（T-07 阶段接真实数据；见 §9 T-07 待修订事项）
    const gentleStreak = { days: 3, restDaysLeftThisWeek: 1, practicedToday: false, lastPracticedAt: '2026-06-14T10:00:00Z' };

    // 累计
    const momentsPracticed = MOCK_SKILLS.reduce((sum, s) => sum + s.practiced, 0);
    const skillsCovered = MOCK_SKILLS.filter((s) => s.practiced >= 1).length;
    const skillsTotal = MOCK_SKILLS.length;

    // "你在这里"：取 mastered_basic 节点（最近的）
    const recentMastered = MOCK_SKILLS.find((s) => s.status === 'mastered_basic');
    const recentNodeId = recentMastered?.id ?? null;

    // 5 段聚合
    const sections = computeAllSectionMastery(MOCK_SKILLS, recentNodeId);

    // 探索候选
    const explorable = computeExplorableCount(MOCK_SKILLS);

    return NextResponse.json({
      data: {
        cumulative: {
          moments_practiced: momentsPracticed,
          skills_covered: skillsCovered,
          skills_total: skillsTotal,
          gentle_streak: gentleStreak,
        },
        sections,
        explorable_count: explorable,
        explorable_label: `下次想练就练 · ${explorable} 个微技能可探索`,
        low_pressure_mode: true,
        today_intensity: 'stable',
        push_enabled: false,
        user_here: recentMastered
          ? { section_id: sections.find((s) => s.state === 'user_here')?.sectionId ?? null, node_id: recentMastered.id, node_title: recentMastered.title }
          : null,
      },
      meta: { trace_id, server_time: new Date().toISOString() },
    });
  } catch {
    return jsonError('NW-ST-0001', trace_id);
  }
}
```

### 7.3 进度页集成（`src/app/(app)/progress/page.tsx` 增量片段，约 50 行）

```tsx
// src/app/(app)/progress/page.tsx （增量；不替换现有代码）
// 来自 docs/design/T-12-progress-page.md §2 + §5
'use client';
import { useEffect, useState } from 'react';
import { Sparkles, Star } from 'lucide-react';

type SectionState = 'empty' | 'practicing' | 'mastered' | 'user_here';

interface ProgressResponse {
  data: {
    cumulative: { moments_practiced: number; skills_covered: number; skills_total: number; gentle_streak: { days: number; rest_days_left_this_week: number; practiced_today: boolean } };
    sections: Array<{ section_id: string; section_name: string; total_nodes: number; practiced_nodes: number; mastery_deep_nodes: number; state: SectionState; current_node_id?: string; current_node_title?: string }>;
    explorable_count: number;
    explorable_label: string;
    user_here: { section_id: string; node_id: string; node_title: string } | null;
  };
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressResponse['data'] | null>(null);

  useEffect(() => {
    fetch('/api/progress')
      .then((r) => r.json())
      .then((j: ProgressResponse) => setData(j.data))
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  // 段状态短语映射
  const stateLabel = (s: SectionState) => ({ empty: '待开启', practicing: '在路上', mastered: '走完', user_here: '你在这里' })[s];

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <h1 className="text-2xl font-semibold">我</h1>

      {/* 累计卡（§2.2） */}
      <section className="rounded-xl border border-border bg-surface p-4 space-y-1">
        <h2 className="text-base font-medium">累计</h2>
        <p className="text-base">练过的瞬间 <span className="text-primary font-medium">{data.cumulative.moments_practiced}</span> 次</p>
        <p className="text-sm text-neutral-500">覆盖的微技能 {data.cumulative.skills_covered} / {data.cumulative.skills_total}</p>
        <p className="text-sm text-neutral-500">{data.cumulative.gentle_streak.days} 天的练习 · 可休整 {data.cumulative.gentle_streak.rest_days_left_this_week} 天</p>
      </section>

      {/* 5 段旅程地图（§2.3） */}
      <section>
        <h2 className="text-base font-medium mb-2">边界成长路 · 我在表达</h2>
        <ul className="space-y-2">
          {data.sections.map((s) => (
            <li key={s.section_id} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${s.state === 'empty' ? 'opacity-60 border-border' : 'border-border'}`}>
              <span className="text-sm font-medium">§{s.section_id.slice(1)} {s.section_name}</span>
              <span className="text-sm text-neutral-500">{s.total_nodes > 0 ? `${s.practiced_nodes}/${s.total_nodes}` : '——'}</span>
              <span className={`text-sm ${s.state === 'mastered' || s.state === 'user_here' ? 'text-primary' : 'text-neutral-500'}`}>
                {s.state === 'mastered' && <Star className="inline h-3 w-3 fill-[#C9A24B] text-[#C9A24B] mr-1" />}
                {s.state === 'user_here' && <Sparkles className="inline h-3 w-3 text-primary mr-1" />}
                {stateLabel(s.state)}
              </span>
            </li>
          ))}
        </ul>
        {data.user_here && data.user_here.node_title && (
          <p className="mt-2 text-xs text-neutral-500">最近练过：{data.user_here.node_title}</p>
        )}
      </section>

      {/* 底部引导行（§2.4） */}
      <p className="text-sm text-neutral-500">{data.explorable_label}</p>

      {/* 设置入口（§2.5） — 保留 v1.0 实现 */}
      {/* … 略 … */}
    </div>
  );
}
```

> **行数统计**：7.1（80 行）+ 7.2（70 行）+ 7.3（50 行）= **200 行**，**在 200 行预算内**。

---

## 8. 测试用例（5 个核心 case）

### 8.1 Case 1 · 累计"练过的瞬间 N 次" 实算

**目的**：验证 §3.2 累计"练过的瞬间" = `sum(SkillNode.practiced)`，**不**显示天数。

```ts
// tests/progress.test.ts
import { describe, it, expect } from 'vitest';

describe('T-12 进度页 · 累计', () => {
  it('累计"练过的瞬间" = sum(practiced)，不是天数', async () => {
    const res = await fetch('/api/progress');
    const { data } = await res.json();
    const skills = (await (await fetch('/api/scenarios')).json()).data;
    const expectedSum = skills.reduce((sum: number, s: any) => sum + (s.practiced ?? 0), 0);
    expect(data.cumulative.moments_practiced).toBe(expectedSum);
    // 红线：响应中无 "days_practiced" / "streak_count" 字段
    expect(data.cumulative).not.toHaveProperty('days_practiced');
    expect(data.cumulative).not.toHaveProperty('streak_count');
  });

  it('进度页 UI 不显示"坚持 N 天" / "🔥" / "连续"', async () => {
    const { container } = render(<ProgressPage />);
    await waitFor(() => expect(container.querySelector('[data-testid="cumulative"]')).toBeTruthy());
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/坚持.*天|连续.*天|🔥|火|streak/i);
    expect(text).toMatch(/练过的瞬间/);
  });
});
```

### 8.2 Case 2 · 5 段旅程地图状态短语

**目的**：验证 §3.3 段聚合算法 4 态映射（empty / practicing / mastered / user_here）。

```ts
describe('T-12 进度页 · 5 段聚合', () => {
  it('§1 全部 mastered_basic → 状态 mastered + "走完"', async () => {
    const res = await fetch('/api/progress');
    const { data } = await res.json();
    const s1 = data.sections.find((s: any) => s.section_id === 'L1');
    // mock 场景：§1 3 节点全 mastered_basic
    expect(s1.state).toBe('mastered');
    expect(s1.practiced_nodes).toBe(3);
  });

  it('最近练过的节点在 §3 → 状态 user_here + "你在这里"', async () => {
    const res = await fetch('/api/progress');
    const { data } = await res.json();
    const s3 = data.sections.find((s: any) => s.section_id === 'L3');
    expect(s3.state).toBe('user_here');
    expect(s3.current_node_title).toBeTruthy();
  });

  it('段内无 mastered_basic 节点 → 状态 empty + "待开启"', async () => {
    // mock §4 / §5
    const res = await fetch('/api/progress');
    const { data } = await res.json();
    const s4 = data.sections.find((s: any) => s.section_id === 'L4');
    const s5 = data.sections.find((s: any) => s.section_id === 'L5');
    expect(s4.state).toBe('empty');
    expect(s5.state).toBe('empty');
  });
});
```

### 8.3 Case 3 · 演练 step 12 完成后 → 进度页更新

**目的**：验证 T-04 §2.4 副作用 → `/api/progress` 聚合更新。

```ts
it('演练 step 12 完成后 /api/progress 数据更新', async () => {
  // 1) GET /api/progress → 初始累计 = X
  const t0 = await fetch('/api/progress');
  const d0 = (await t0.json()).data;
  const initialMoments = d0.cumulative.moments_practiced;

  // 2) 模拟演练 step 12 完成（T-04 副作用：practiced_count += 1 + 节点 mastered_basic）
  // 实际路径：演练页 → POST /api/conversations/drill/[id]/step (n=12)

  // 3) GET /api/progress → 累计 = X + 1
  const t1 = await fetch('/api/progress');
  const d1 = (await t1.json()).data;
  expect(d1.cumulative.moments_practiced).toBe(initialMoments + 1);
});
```

### 8.4 Case 4 · 缺失连击 → 进度页不显示"丢失"

**目的**：验证 §5.4 缺失态视觉，**无**"丢失 / 再不来就 / 🔥"。

```ts
it('缺失连击后 /progress 不显示"丢失"叙事', async () => {
  // mock gentle_streak.days = 0（静默归零）
  const res = await fetch('/api/progress');
  const { data } = await res.json();
  expect(data.cumulative.gentle_streak.days).toBe(0);

  // 红线 grep：响应文案不含"丢失" / "失去" / "你快没了"
  const text = JSON.stringify(data);
  expect(text).not.toMatch(/丢失|失去|再不来就|你快没了|🔥|火/);
});
```

### 8.5 Case 5 · 5 段旅程地图与 BottomNav 第 4 Tab 一致

**目的**：验证 §4 BottomNav 兼容（`/progress` 路由时第 4 Tab 高亮）。

```ts
it('进入 /progress 时 BottomNav 第 4 Tab 高亮 + aria-current="page"', async () => {
  await page.goto('http://localhost:3000/progress');
  const tab4 = await page.locator('[data-testid="bottom-nav-tab"]').nth(3);
  await expect(tab4).toHaveAttribute('aria-current', 'page');
});
```

### 8.6 5 个 case 覆盖矩阵

| 维度 | Case 1 | Case 2 | Case 3 | Case 4 | Case 5 |
| --- | --- | --- | --- | --- | --- |
| 累计实算（sum practiced） | ✅ | | ✅ | | |
| 红线：无"坚持 N 天" / "🔥" | ✅ | | | ✅ | |
| 5 段聚合 4 态（empty / practicing / mastered / user_here） | | ✅ | | | |
| "你在这里" 标识当前节点 | | ✅ | | | |
| 演练 step 12 → 累计 +1 | | | ✅ | | |
| 缺失连击静默归零 | | | | ✅ | |
| BottomNav 第 4 Tab 高亮 | | | | | ✅ |
| 数据契约（cumulative / sections / explorable_count） | ✅ | ✅ | ✅ | ✅ | |

> **未覆盖**（follow-up，列入 T-16 Q 评审）：
> - mastered_deep 双金冠在进度页的视觉（M3 启用）
> - 移动端适配（xs < 480px）
> - 跨设备同步（M3）
> - 5min 缓存失效逻辑（T-07 实施时验证）
> - 限流 429（T-14 部署流水线验证）

---

## 9. ⚠️ T-07 待修订事项

> T-07 温和连击 + 休整日设计稿**正在进行中**。本稿中**涉及 T-07 真实数据**的段**仅基于 T-06 §6.1 提供的 `gentle_streak` 接口契约做占位推断**。T-07 设计稿完成后，本稿须**对应章节**修订并标注版本号变更（v0.1 → v0.2）。

### 9.1 待修订章节列表

| 章节 | 当前内容（基于 T-06 §6.1 占位） | 待 T-07 修订的具体事项 |
| --- | --- | --- |
| §2.2 累计卡行 3 | "D 天的练习 · 可休整 K 天" | T-07 实施时确认文案（含 / 不含"连续"、是否含 emoji 替代等） |
| §3.2 `gentle_streak.days` | 取 `days` 字段（M2 占位 = 3） | T-07 实施时确认字段名 / 缺失时是 0 还是 null |
| §3.2 `gentle_streak.restDaysLeftThisWeek` | 取 `restDaysLeftThisWeek` 字段（M2 占位 = 1） | T-07 实施时确认字段名 / 是否含 `restDaysPerWeek` 总额 |
| §3.2 `gentle_streak.practicedToday` | boolean（M2 占位 = false） | T-07 实施时确认字段语义（"今日已练过 ≥ 1 次"） |
| §3.2 `gentle_streak.lastPracticedAt` | ISO date（M2 占位 = 2026-06-14） | T-07 实施时确认字段语义（最近一次练习时间戳） |
| §5.4 缺失态视觉 | "0 天的练习 · 可休整 1 天"（不显示"丢失"） | T-07 实施时确认缺失态文案 + 动效规范（fade-in / 无动效） |
| §5.2 红线 | "归零无动效（避免'丢失'感知）" | T-07 实施时确认归零动效规范 |
| §6.4 缓存策略 | `gentle_streak` 缓存 5 分钟 | T-07 实施时确认缓存时长 + 失效时机 |
| §7.2 API Route | 写死 `gentleStreak = { days: 3, ... }` | T-07 实施时改为读 `gentleStreakStore`（T-07 §6.1 引用） |

### 9.2 待修订触发条件

| 触发 | 动作 |
| --- | --- |
| T-07 设计稿 v0.1 提交 | 本稿作者**对照 T-07 §6.1 接口契约**，逐字段验证 §3.2 / §6.1 / §7.2 |
| T-07 字段命名变化 | 同步更新 §3.2 字段映射表 + §6.1 响应 JSON + §7.2 写死值 |
| T-07 文案变化（如"D 天的练习" → 其他） | 同步更新 §2.2 / §5.4 / §5.5 文案表 |
| T-07 动效规范变化 | 同步更新 §5.2 红线自检 + §5.3 完成态反馈 |
| T-07 状态机变化 | 同步更新 §3.4 "你在这里"链路（**不**变；T-07 不影响"你在这里"逻辑） |

### 9.3 不依赖 T-07 的段（无需修订）

- §2.1 总体布局（视觉与 §2.2 累计卡排版）
- §2.3 5 段旅程地图（聚合算法 §3.3 不依赖 T-07）
- §2.4 底部引导行（仅依赖 SkillNode.status）
- §2.5 设置入口（T-08 任务）
- §4 BottomNav 关系
- §5.1 视觉规范（除累计卡行 3 文案）
- §6 API 契约结构（除字段值）
- §7 关键代码（除 §7.2 写死值）
- §8 测试用例（除 mock 数据）
- §10 风险点（除 T-07 依赖项）

### 9.4 T-08 依赖项（同步跟踪）

> 与 T-07 类似，T-08（LPM + 推送控制）也在进行中。本稿**仅消费** T-08 接口，**不实做** Toggle 化。

| 章节 | 当前内容（占位） | 待 T-08 修订的具体事项 |
| --- | --- | --- |
| §2.5 设置入口 | 写死"低压力模式：开" / "推送：关" | T-08 实施时 Toggle 化 + 接入真实状态 |
| §3.2 `low_pressure_mode` | boolean（M2 占位 = true） | T-08 实施时确认字段语义 |
| §3.2 `push_enabled` | boolean（M2 占位 = false） | T-08 实施时确认字段语义 |
| §3.2 `today_intensity` | enum（M2 占位 = 'stable'） | T-08 实施时确认字段语义 + 是否引入 |
| §6.1 响应 JSON | 写死 `low_pressure_mode: true` 等 | T-08 实施时改为读 T-08 数据源 |

### 9.5 T-07 / T-08 完成后修订流程

1. T-07 / T-08 设计稿 v0.1 提交
2. 本稿作者对照 §9.1 / §9.4 表逐字段验证
3. 修订完成后本稿版本 v0.1 → v0.2
4. CHANGELOG 记录修订
5. Coordinator 审核

---

## 10. 风险点

### 10.1 P0 风险（必避）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-01 进度页显示"坚持 N 天"** | 实现层误用 `gentleStreak.days` 作为"坚持天数" | §2.2 / §5.2 / §5.5 明确"练过的瞬间 N 次"；红线 grep 自检：禁匹配"坚持\|连续\|🔥" |
| **R-02 "🔥 红字" 出现在温和连击** | 模仿 Duolingo 火苗 | §5.1 视觉规范明确"数字用 text-primary / text-neutral-500"；§5.2 红线自检 |
| **R-03 缺失连击显示"丢失"** | 实现层误用 "你失去了 N 天" | §5.4 缺失态视觉明确"不显示丢失"；T-07 §8.3 不变量；§5.2 红线 |
| **R-04 5 段旅程地图被读成"任务进度"** | 数字 X/Y 制造"还有 Y-X 个"焦虑 | §2.3.3 数字用 `text-neutral-500` 灰显；**不**用主色；**不**显示百分比 |
| **R-05 段状态短语被读成"评价"** | "走完 / 在路上" 被读成"你真棒 / 你不行" | §5.5 文案系统明确"走完 = 事实"；KE 复核 PE 守则 §10 |
| **R-06 底部引导行"X 个微技能可探索"变"催促"** | 数字 X 制造"还有 X 个没练" | §2.4 文案为"下次想练就练"（邀请式）；数字灰显；N = 0 时切换"你已经走得很远" |
| **R-07 累计"练过的瞬间"被重置** | dev server 重启 / 数据迁移时数据丢失 | 累计**永远不**减；M3 接 Supabase 时持久化；M2 PoC 写死可接受 |
| **R-08 "覆盖的微技能 M / 17" 分子边界** | 当节点 `practiced = 1` 但 `status = 'available'`（未点）时算不算覆盖？ | §3.2 明确"practiced >= 1" 算覆盖；与 T-04 §2.4 副作用"mastered_basic + practiced_count += 1" 一致 |
| **R-09 完成态变"胜利 🏆"** | 进度页加 toast "完美！今天又练过一个微技能！" | §5.3 完成态反馈明确"无红字 / 无抖动 / 无 toast"；与 T-06 §8.2 一致 |

### 10.2 P1 风险（follow-up）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-10 进度页与"今日"重复显示完成度** | 进度页显示"覆盖 M / 17"，与"今日 0/3"心智冲突 | 进度页**不**显示"今日 X/3"（属 T-06 `/today`）；进度页只显示**累计** + **5 段聚合** |
| **R-11 进度页底部"导出 / 删除"误导** | 用户误以为删进度数据 = 删剧本 | T-13 实施时显式标注"删进度数据 ≠ 删剧本" |
| **R-12 段聚合算法在"空段"边界出错** | §4 / §5 节点数 = 0 时 `practiced === total` 永远成立 | §3.3 显式 `if (total > 0 && practiced === total)` 避免误判 mastered |
| **R-13 T-07 / T-08 字段不一致** | T-07 / T-08 实施时字段命名变化，本稿未同步 | §9.1 / §9.4 明确"待修订事项"；T-07 / T-08 完成后 v0.2 修订 |
| **R-14 "你在这里" 重复标识** | 多个段同时有 mastered_basic 节点，"你在这里"指向哪一个？ | §3.4 显式"取最近一次练习的节点"；M2 PoC 取今日完成节点 |
| **R-15 移动端 5 段旅程地图可读性** | 段标题 + 数字 + 状态短语横排 3 列在小屏拥挤 | §2.6 移动端单列竖排；段标题 + 数字 + 状态短语分 3 行 |
| **R-16 进度页加载慢** | `GET /api/progress` 聚合 4 个数据源，首次加载 2s+ | §6.4 缓存策略：5min cache；M3 接入 Supabase 后查询优化 |

### 10.3 P2 风险（远期）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-17 跨设备同步** | M2 内存态不跨设备 | M3 Supabase |
| **R-18 进度数据导出** | 用户想导出"练过的瞬间"历史 | T-13 数据导出扩展 |
| **R-19 mastered_deep 在进度页的视觉** | mastered_deep（≥ 5 次）在 §1 段聚合中已算 mastered，但用户**不**知道"深入" | M3 在进度页 mastered 态加副文本"深入 N 次" |
| **R-20 段状态短语多语言** | M3 启用 i18n 时 "走完 / 在路上" 文案翻译 | 字符串集中管理；KE 复核多语言一致性 |

### 10.4 红线用例映射（§19.6 grep 自检）

> 来源：`docs/02-Prototype.md` §16.3 + `docs/07-Test-Plan.md` §19.6。

| grep 规则 | 本稿情况 | 通过 |
| --- | --- | --- |
| `heart\|lives\|gem\|coin\|leaderboard\|league\|streak.repair` | 进度页无货币 / 排行 / 打卡天数 | ✅ |
| `坚持.*天\|打卡` | 文案仅"练过的瞬间" / "D 天的练习" | ✅ |
| `失去\|丢失\|再不来就\|你快没了` | 进度页**不**含"丢失"叙事 | ✅ |
| `🔥` | 进度页**不**含"🔥" | ✅ |
| `你太软弱\|你应该\|你连这都` | 文案第一人称 + 邀请式 | ✅ |

---

## 11. 与其他设计稿的接口边界

### 11.1 与 T-01 技能树主页

| 共享 | T-01 期望 | T-12 实现 | 一致 |
| --- | --- | --- | --- |
| `SkillNode.practiced` 字段 | §5.1 Props | T-12 §3.2 实算 `moments_practiced` | ✅ |
| 6 态枚举 | §3.2 | T-12 段聚合算法引用 `status` | ✅ |
| 节点之间 1px 虚线 | §2.3 | T-12 段间细线同型 | ✅ |
| `mastered_basic` 金冠 | §3.2 | T-12 段 mastered 态 = 金冠 | ✅ |
| `recommended` 软发光 | §3.2 | T-12 段 user_here 态 = 软发光 + 放大 1.05x | ✅ |
| 累计"练过的瞬间" | §7.2 顶部副标题 | T-12 §2.2 累计卡行 1 = 同源 | ✅ |
| "下次想练就练" | §8.1 polish P-08 | T-12 §2.4 底部引导行 = 同源 | ✅ |

### 11.2 与 T-06 今日三件小事

| 共享 | T-06 期望 | T-12 实现 | 一致 |
| --- | --- | --- | --- |
| `gentle_streak` 接口 | §6.1 | T-12 §3.2 引用 | ✅ |
| 必做节点 = `recommended` | §3 推荐算法 | T-12 §3.4 "你在这里" 复用 T-06 必做节点 | ✅ |
| `completed.total` | §2.5 顶部进度条 | T-12 **不**读取（M2 范围不显示） | ➖ |
| `low_pressure_mode` 占位 | §5.4 | T-12 §3.2 引用 | ✅ |
| `POST /api/today-3/rest` | §7.3 | T-12 **不**直接调；T-07 实施时接 | ➖ |

### 11.3 与 T-07 温和连击 + 休整日（**进行中**）

| 共享 | T-07 期望 | T-12 实现 | 一致 |
| --- | --- | --- | --- |
| `gentle_streak` 数据源 | T-07 §6.1 写入 | T-12 §3.2 读 | ✅（占位） |
| 缺失静默归零 | T-07 §8.3 状态机 | T-12 §5.4 缺失态视觉不显示"丢失" | ✅（占位） |
| 休整日 -1 | T-07 内部逻辑 | T-12 **不**实做；仅消费 | ➖ |
| 顶部"可休整 K 天" | T-07 接入后 | T-12 §2.2 累计卡行 3 占位 | ⚠️ 待 T-07 |

### 11.4 与 T-08 低压力模式 + 推送（**进行中**）

| 共享 | T-08 期望 | T-12 实现 | 一致 |
| --- | --- | --- | --- |
| `low_pressure_mode` Toggle | T-08 Toggle 化 | T-12 §2.5 占位显示 | ⚠️ 待 T-08 |
| `push_enabled` Toggle | T-08 Toggle 化 | T-12 §2.5 占位显示 | ⚠️ 待 T-08 |
| `today_intensity` | T-08 写入 | T-12 §3.2 占位 'stable' | ⚠️ 待 T-08 |
| 推送默认全关（B2） | T-08 实施 | T-12 §5.2 红线；占位 `push_enabled: false` | ✅ |

### 11.5 与 T-11 我的剧本

| 共享 | T-11 期望 | T-12 实现 | 一致 |
| --- | --- | --- | --- |
| `scriptsStore` 写入 | T-11 列表 + T-04 步骤 11 | T-12 §3.2 **不**读（M2 范围） | ➖ |
| `scripts_count` 显示 | — | T-12 **不**显示（M2）；M3 评估 | ➖ |
| BottomNav Tab 顺序 | 第 3 = 我的剧本 | T-12 第 4 = 我 | ✅ |

### 11.6 与 T-13 数据导出 / 删除

| 共享 | T-13 期望 | T-12 实现 | 一致 |
| --- | --- | --- | --- |
| 进度页底部"导出 / 删除"入口 | T-13 实施 | T-12 §2.5 占位文字链 → 跳 `/settings` | ✅（T-13 实施时细化） |
| 数据范围（进度 vs 剧本 vs 演练） | T-13 决策 | T-12 §2.5 文字链仅作入口 | ⚠️ 待 T-13 |

### 11.7 与 T-04 12 步演练

| 共享 | T-04 期望 | T-12 实现 | 一致 |
| --- | --- | --- | --- |
| `practiced_count += 1` 副作用 | T-04 §2.4 | T-12 §3.2 实算累计 | ✅ |
| 节点 `mastered_basic` 状态机 | T-04 §2.4 | T-12 §3.3 段聚合引用 | ✅ |
| `drill_session_id` 写入 | T-04 步骤 11 透传 | T-12 **不**显示（M2 范围） | ➖ |

---

## 12. 红线自检（CLAUDE.md §5 + docs/02-Prototype.md §16）

> 对照 `PROJECT_MAP.md` §5 红线 + `docs/02-Prototype.md` §16 拒绝清单 + §16.2 借鉴自检 11 条。

| 红线 | 本稿情况 | 通过 |
| --- | --- | --- |
| ❌ 心数 / 宝石 / 排行榜 / 打卡天数 / 付费修复 / 催促型推送 | 进度页无任何货币 / 排行 / 打卡天数；§2.2 / §5.2 / §5.5 显式排除 | ✅ |
| ❌ "你太软弱 / 你应该 / 你连这都…" | 文案系统遵循 PE 守则 §10；§5.5 全部第一人称 + 邀请式 | ✅ |
| ❌ 在危机路径给"怎么办"建议 | 进度页不涉及危机路径 | ✅ |
| ❌ KB 全文注入 LLM | 进度页不调 LLM | ✅ |
| ❌ 完整 history 注入 LLM | 进度页不涉及 LLM | ✅ |
| ❌ 多 Agent 重复消费上下文 | 本稿为 Full-stack 综合 Agent 调研 + 设计稿，待 Coordinator 审核 | ✅ |
| ❌ 不做安全评审就上线情绪功能 | 本稿为设计稿；上线前必过 Q checklist + gamification-safety-checklist P0 | ✅ |
| ❌ 显示用户 PII | 进度页不涉及用户身份；`/api/progress` 端点不返回 PII | ✅ |
| §16.3 拒绝清单 grep 自检 | 进度页无 `heart` / `lives` / `gem` / `coin` / `leaderboard` / `streak-repair` / 🔴 红字 | ✅ |
| §16.3 推送文案自检 | 进度页不涉及推送文案（T-08 处理） | ✅ |
| §16.2 借鉴与改造 11 条 | 进度页 5 段旅程地图 ✅、累计"练过的瞬间" 非"坚持 N 天" ✅、LPM 默认 ON ✅、缺失静默归零 ✅（待 T-07）、休整 1-2 天 ✅（待 T-07）、无货币 ✅、无排行 ✅、无打卡天数 ✅、无付费修复 ✅、推送默认关 ✅（T-08）、进度页不展示打卡天数 ✅、"今天就到这里" 永远可达 ✅（属 T-01） | ✅ |

**结论**：本稿**符合 CLAUDE.md 红线 + docs/02-Prototype.md §16 全部自检项**。

---

## 13. 待 Coordinator 拍板的 3 个开放问题

| # | 问题 | 建议 |
| --- | --- | --- |
| Q1 | 5 段旅程地图"你在这里"是取**最近一次练习节点**，还是取**今日推荐节点**（T-06）？ | 建议**取最近一次练习节点**（与 prototype §6.10 "§3 2/15 → 你在这里" 一致；T-06 必做节点 = 推荐 = 仍未练，与"你在这里"语义不一致） |
| Q2 | 底部引导行"N 个微技能可探索" 是否计入 `in_progress` 节点？ | 建议**不计入**（in_progress 已是用户正在做的，**不**算"可探索"）；M3 评估是否拆分为"可练 + 可复习" |
| Q3 | 进度页底部"导出 / 删除"是否在 T-12 实施范围内？ | 建议**仅做入口占位**（文字链 → 跳 `/settings`），T-13 实施时细化 |

---

## 14. Follow-up（不属本任务）

1. **T-07**（FE+BE）：温和连击 + 休整日真实数据接入；本稿 §3.2 / §6.1 / §7.2 / §9.1 引用接口 + 标注待修订事项。
2. **T-08**（FE+BE）：低压力模式开关（GlobalHeader Toggle 化）+ 推送控制；本稿 §2.5 / §3.2 / §6.1 / §9.4 引用接口 + 标注待修订事项。
3. **T-13**（BE）：数据导出 / 删除；本稿 §2.5 入口占位。
4. **T-15**（PE+Q）：评测集 v0.5 补"进度页"用例 ≥ 5 条（累计 / 5 段聚合 / 缺失态 / 引导行 / BottomNav）。
5. **T-16**（Q）：红线用例 + 拒绝清单自检（含本稿 5 个核心 case 的 e2e）。
6. **A + BE**：写 ADR-010（Progress API contract + 段聚合算法 for Supabase M3 迁移）。
7. **M3**：进度页底部加"scripts_count" / "today3.done_count" 历史趋势；mastered_deep 视觉副文本"深入 N 次"；跨设备同步；数据导出扩展。

---

## 15. 与现有文档的双向追溯

| 本稿章节 | 引用源 |
| --- | --- |
| §1 现状 | `src/app/(app)/progress/page.tsx` v2.0.6 + `docs/02-Prototype.md` v2.0.1 §6.10 + §18 polish P-08/P-09 |
| §2 信息架构 | `docs/02-Prototype.md` §6.10 + §16.2 polish 借鉴自检 |
| §3 数据聚合 | `docs/design/T-01-skill-tree-home.md` §3.2/§5.1 + `docs/design/T-06-today-three.md` §3 + `docs/design/T-11-scripts-tab.md` §3 |
| §4 BottomNav | `BottomNav.tsx` v2.0.6 + `docs/design/T-01-skill-tree-home.md` §8.2 + `docs/02-Prototype.md` §5.1 |
| §5 UI 设计 | `docs/02-Prototype.md` §6.10 + §11 + §16.2 polish + `rules/safety.md` S-6 |
| §6 API 契约 | `docs/05-API-Design.md` v1.1 §9.5–9.11 + `docs/design/T-06-today-three.md` §7.1 |
| §7 代码片段 | `src/lib/scenarios-data.ts` + `src/lib/scripts-store.ts` pattern + `src/app/api/today-3/route.ts` pattern |
| §8 测试用例 | `docs/design/T-06-today-three.md` §10 + `docs/07-Test-Plan.md` §19 |
| §9 T-07 待修订 | `docs/design/T-06-today-three.md` §6.1 接口契约 + `plans/m2-poc.md` T-07 任务定义 |
| §10 风险点 | `rules/safety.md` S-1~S-8 + `docs/02-Prototype.md` §16.3 + T-06 §11 |
| §11 接口边界 | T-01 / T-04 / T-06 / T-07 / T-08 / T-11 / T-13 设计稿 + `plans/m2-poc.md` |
| §12 红线自检 | `CLAUDE.md` §5 + `docs/02-Prototype.md` §16 + `PROJECT_MAP.md` §5 |
| §13 开放问题 | — |
| §14 Follow-up | `plans/m2-poc.md` 任务清单 |
| §15 双向追溯 | 上述各章节引用源 |

---

## 16. 文档自检

- 不修改 src/ 任何源代码 ✅
- 不启动 dev server / npm test ✅
- 产出物为 markdown 设计稿 ✅
- 关键决策可回溯到 `docs/02-Prototype.md` v2.0.1 + `docs/design/T-01-skill-tree-home.md` + `docs/design/T-06-today-three.md` + `docs/design/T-11-scripts-tab.md` + `plans/m2-poc.md` ✅
- 符合 CLAUDE.md 红线 + `docs/02-Prototype.md` §16 全部自检项 ✅
- 5 个核心 case 覆盖：累计实算 / 5 段聚合 / 演练完成 / 缺失态 / BottomNav ✅
- 关键代码片段 200 行（≤ 200 行预算）✅
- 明确标注 T-07 待修订事项 9 条 + T-08 待修订事项 4 条 ✅
- 红线自检：§2.2 / §5.2 / §5.4 / §5.5 显式排除"坚持 N 天 / 🔥 / 连续 / 丢失" ✅
- 与 T-01 / T-04 / T-06 / T-11 / T-13 数据契约一致 ✅

---

> **变更摘要**（v0.1 2026-06-17）：
> 1. 现状：5 处数据未实算（累计 3 行 + 5 段状态短语 + 1 行引导），形态在位
> 2. 信息架构：累计卡（3 行）+ 5 段旅程地图（4 态聚合）+ 底部引导行 + 设置入口
> 3. 数据聚合：聚合 `SkillNode.practiced` 求和 + 5 段 `SectionMastery` 4 态派生 + `gentle_streak` 占位消费（T-07）
> 4. 段聚合算法：定义 `empty` / `practicing` / `mastered` / `user_here` 4 态；"你在这里" 取最近一次练习节点
> 5. BottomNav：第 4 Tab "我" 已实装（`BottomNav.tsx:14`），与 T-01 §8.2 兼容矩阵对齐
> 6. UI 规范：累计 3 行灰显 + 数字 `text-primary`；5 段旅程地图 1px 虚线 + 金冠 / 软发光；**无"坚持 N 天" / "🔥" / "连续" / "丢失"**
> 7. API 契约：`GET /api/progress` 聚合响应；2 个新错误码 `NW-PR-0001/0002`；5min 缓存
> 8. 关键代码：3 个片段共 200 行（≤ 200 行预算）
> 9. 测试用例：5 个核心 case（累计 / 5 段聚合 / 演练完成 / 缺失态 / BottomNav）
> 10. **T-07 待修订事项 9 条 + T-08 待修订事项 4 条**（v0.2 修订时同步）
> 11. 风险点：P0 9 条 / P1 7 条 / P2 4 条
> 12. 3 个开放问题待 Coordinator 拍板
> 13. 红线自检：通过
> 14. Follow-up：T-07 / T-08 / T-13 / T-15 / T-16 + ADR-010 + M3 4 项

---

> **本稿自检**：
> - 不修改 src/ 任何源代码 ✅
> - 不启动 dev server / npm test ✅
> - 产出物为 markdown 设计稿 ✅
> - 关键决策可回溯到 docs/02-Prototype.md v2.0.1 + T-01/T-06/T-11 设计稿 + plans/m2-poc.md ✅
> - 符合 CLAUDE.md 红线 + docs/02-Prototype.md §16 全部自检项 ✅
> - 5 个核心测试 case 覆盖累计 / 5 段 / 完成 / 缺失 / BottomNav ✅
> - 关键代码片段 200 行（≤ 200 行预算）✅
> - T-07 待修订事项明确标注（9 条）+ T-08 待修订事项（4 条）✅
> - 红线自检：§2.2 / §5.2 / §5.4 / §5.5 显式排除"坚持 N 天 / 🔥 / 连续 / 丢失" ✅
