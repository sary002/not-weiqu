# T-06 · 今日三件小事 · 设计稿

> **任务编号**：T-06（plans/m2-poc.md）
> **关联任务**：T-01（FE 技能树主页）/ T-03（FE 演练 UI）/ T-04（BE 演练后端）/ T-07（FE+BE 温和连击 + 休整日）/ T-08（FE+BE 低压力模式 + 推送控制）/ T-12（FE+BE 我 → 进度）
> **关联切片**：S-PoC-01 阿瑶的 1 次演练（节点完成 → 进度 1/3 → 顶部温和连击 +1）
> **Owner（设计）**：FE + BE（联合）
> **Reviewer**：C、PM、PE、KE、Q
> **阶段**：调研 + 设计（**不修改 src/ 下任何源代码**）
> **本稿状态**：待 Coordinator 审核
> **版本**：v0.1（2026-06-17）

---

## 0. 阅读须知

- 本稿只描述**信息架构、推荐算法、与技能树主页 / LPM / 温和连击的耦合、API 契约、UI 形态、JSX 骨架**。**不输出可运行代码、不动 src/ 任何文件**。
- 一切设计决策可回溯到：
  - `docs/02-Prototype.md` v2.0.1 §5.4（今日三件小事）+ §6.2（技能树主页形态）+ §16.2 polish 借鉴自检
  - `docs/design/T-01-skill-tree-home.md` v0.1（节点 6 态 / 状态机切换 / 与今日三件的映射）
  - `docs/design/T-03-drill-frontend.md` v0.1（演练草稿持久化 / 步骤 12 完成回 /today）
  - `docs/design/T-04-drill-backend.md` v0.1（DrillSession 副作用清单 / practiced 累计）
  - `plans/m2-poc.md` T-06（T-03/T-04 → T-07 → T-08 的依赖链）
- 本稿**不修改** `src/app/(app)/today/page.tsx`、`src/components/skilltree/SkillNode.tsx`、`src/lib/scenarios-data.ts`、`src/lib/scripts-store.ts` 等任何源文件；落地由 Coordinator 批准后另立实施任务。

---

## 1. 现状分析（gap）

### 1.1 与 v2.0.1 polish 的契合度

| 项 | v2.0.1 polish 期望 | 当前实现 | 评估 |
| --- | --- | --- | --- |
| 主页**不渲染独立**"今日三件小事"区（polish P-01） | 融进技能树；今日推荐 = 唯一发光节点 | `today/page.tsx` 仅渲染技能树 5 段 | ✅ P-01 已落地；但 T-06 需补"1 必做 + 2 选做"的数据层映射 |
| 顶部条无"🔥 3 天"（polish P-09） | "练过 N 次 · M 天的练习 · 可休整 K 天" | `today/page.tsx:78` 写死为"3 天的练习" | ⚠️ 副标题文案对齐；但 `gentleStreak` **未接 API**，T-07 阶段才接 |
| 节点推荐不写"今日"文字（polish P-07） | 仅发光 + 放大 1.05x | 当前实现 className 写"推荐"文字 | ❌ 详见 T-01 §1.2 |
| 锁定节点不显示 🔒（polish P-06） | 半透明 + hover 引导 | 当前常驻文字 | ❌ 详见 T-01 §1.2 |
| 今日三件小事数据来源 | 1 必做 = 系统推荐节点；2 选做 = 复习 + 知识小卡/自定义 | **完全缺失** | ❌ **本稿任务 T-06** |
| 三件小事**不显示**"未完成"红色 | 灰色进度条 "今日 0/3" | 缺失 | ❌ **本稿设计** |
| "今天就到这里"按钮永远可达 | 任意时刻可达 | `today/page.tsx:113` 存在 | ✅ |
| 推送默认全关（B2） | LPM 默认 ON | `GlobalHeader` Toggle 占位 | ⚠️ Toggle 化由 T-08 实做 |

### 1.2 当前实现与 prototype §5.4 的对比

| 项 | prototype §5.4 期望 | 当前实现 | 评估 |
| --- | --- | --- | --- |
| **必做**（1 件）来源 | 技能树当前位置（系统推荐） | `today/page.tsx` 内存写死 `s2-want.status='recommended'` | ⚠️ **写死 vs 算法生成**——M2 PoC 接受写死，但 T-06 应**显式定义**推荐算法 |
| **选做 A**（1 件）来源 | 复习（系统从"未掌握"中挑 1） | 缺失 | ❌ 本稿设计 |
| **选做 B**（1 件）来源 | 知识小卡 OR 自定义场景 | 缺失（自定义场景 M3 / 知识小卡 M3） | ❌ M2 PoC 范围内**仅占位** |
| 用户可否跳过必做 | 可换成"今日休整" | 无"今日休整"入口 | ❌ 本稿设计（与 T-07 休整日联动） |
| 用户可否跳过选做 | 可跳过 | 缺失 | ❌ 本稿设计 |
| 完成度"X/3"显示 | 灰色进度条，**不显示**"未完成"红色 | 缺失 | ❌ 本稿设计 |
| 50% / 100% / 150% 累计 | 1 件 = 50% / 2 件 = 100% / 3 件 = 150% | 缺失 | ❌ 本稿**不引入**（避免"内卷式"目标；见 §2.5 决策） |
| 完成 1 件的视觉反馈 | Jobs 风格克制动画，无红字 / 抖动 | 缺失 | ❌ 本稿设计 §6 |

### 1.3 与其他设计稿的依赖

| 依赖 | 文档 | T-06 需引用的关键点 |
| --- | --- | --- |
| 节点 6 态 + 状态机 | T-01 §3.3 | 必做 = 唯一 `recommended` 节点；其他可点 = `available` / `mastered_basic` / `in_progress` |
| `practiced` / `draftStep` 共享契约 | T-03 §4.4 | `practiced` 由演练 step 12 写入 `localStorage.drill_progress.{code}`；`draftStep` 由暂停写入 `localStorage.drill_draft.{code}` |
| 演练完成副作用 | T-04 §2.4 | step 12 异步副作用 = 节点 `mastered_basic` + `practiced_count += 1` + 温和连击 +1 + 草稿清除 |
| 温和连击 + 休整日 | T-07 待写 | 本稿**仅占位**接口；不实做 streak 数值 |
| 低压力模式开关 | T-08 待写 | 本稿**引用** `GlobalHeader.LPM` 状态；不实做 Toggle 化 |
| 顶部状态条 | T-01 §7 | 副标题"练过 N 次 · M 天的练习 · 可休整 K 天"复用 T-07 数据源 |

### 1.4 现状总结

- **形态到位**：主页技能树 + 唯一发光节点（polish P-01/P-07 已落地）；LPM 默认 ON（B1）；"今天就到这里"永远可达。
- **数据层缺失**：推荐算法**写死**而非计算；"今日 X/3"**无 UI**；"今日休整"**无入口**；选做 A/B**无数据源**。
- **横向依赖清晰**：T-06 处于"T-03/T-04（演练闭环）→ T-07（温和连击）→ T-08（LPM 开关）"依赖链的**第 1 步**——必须把"必做 + 2 选做"的**数据契约**定义清楚，但不实做 streak / LPM 真实数据。
- **本稿定位**：定义"今日三件小事"的**信息架构 + 推荐算法 + API 契约 + UI 形态**，给 T-07/T-08 留接口。

---

## 2. 信息架构（1 必做 + 2 选做）

### 2.1 三件小事的位置（v2.0.1 polish P-01 落地态）

> **关键决策**：三件小事**不渲染独立区**，而是通过技能树节点的**视觉编码**传达（polish P-01 已落地）。
> 本稿新增的"今日进度条" + "今日休整"按钮放在顶部状态条**下方**，**不**侵入技能树区域。

```
┌────────────────────────────────────────────────────────┐
│ 今日                                                │
│ 🌱 练过 12 次 · 3 天的练习 · 可休整 1 天            │  ← T-07 接入后真实数据
│                                                        │
│ ┌─ 今日 1/3 ──────────────────────────────────────┐ │
│ │  ◐ ◯ ◯    1 件必做 + 2 件选做              [休整] │ │  ← T-06 新增
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ─ 边界成长路 ─────────────────────────                │
│                                                        │
│           §1 觉察                                       │
│           ┌─听见身体的信号 ─┐                          │
│           │ ★★  练过 2 次  │                          │
│           └─────────────────┘                          │
│           …                                            │
│           §2 命名                                       │
│           ┌─说出"我想要" ──┐  ✦ ← 软发光（必做）       │
│           │                │     不显示"今日"           │
│           └─────────────────┘                          │
│           …                                            │
│                                                        │
│           §3~§5 半透明                                  │
│                                                        │
│ [ 今天就到这里 ]                                       │
│ 不委屈是成长陪伴，不替代专业心理咨询。                  │
└────────────────────────────────────────────────────────┘
```

### 2.2 三件小事语义

| 类型 | 数量 | 来源 | 用户可否跳过 | 完成语义 |
| --- | --- | --- | --- | --- |
| **必做** | 1 | 技能树 `recommended` 节点（系统推荐） | 可换成"今日休整"（点 [休整] 按钮） | 完成 = `recommended → mastered_basic` 或 `available → in_progress → mastered_basic` |
| **选做 A** | 1 | 系统从"`mastered_basic` / `in_progress` 节点"挑 1（"复习"） | 可跳过 | 完成 = `mastered_basic → mastered_deep` 或 `in_progress → mastered_basic` |
| **选做 B** | 1 | 知识小卡（M3）/ 自定义场景（M3） / **M2 占位**"自由对话入口" | 可跳过 | M2 PoC 范围 = "自由对话"入口（底部 Tab 2） |

### 2.3 节点到三件小事的映射（数据流）

```
[GET /api/today-3]
   ↓
   ├─ 必做 = computeRecommended(skills, gentleStreak, restDaysLeft, lowPressureMode)
   ├─ 选做 A = pickReviewCandidate(skills, recommendedId)
   └─ 选做 B = placeholder（"去自由对话"或"今日休整"）
   ↓
   响应 { data: { required: {...}, optional: [a, b], completed: 0/3, canRest: boolean } }
   ↓
   today/page.tsx 渲染：3 个圈 ◐ ◯ ◯ + [休整] 按钮
```

### 2.4 必做节点的确定（核心规则）

> 详见 §3 推荐算法。

**简述**：
1. 若今日已有 `recommended` 节点 → 必做 = 该节点。
2. 否则调 `computeRecommended(skills, gentleStreak, restDaysLeft, lowPressureMode)` 选 1：
   - 优先级：`available`（未练过） > `mastered_basic`（练过 1 次待深入） > `in_progress`（有草稿）
   - 同优先级按 `rest_days`（距上次练习时间）**降序**选最久的。
3. 选做 A = 在 `recommended` 之外，按**与必做不同段**（layer）的规则挑 1 个复习节点。

### 2.5 完成度的视觉传达

| 完成度 | 视觉 | 备注 |
| --- | --- | --- |
| 0/3 | `○○○` 全灰 + "今日 0/3" 灰色小字 | **无**"未完成"红字；**无**红色感叹号 |
| 1/3 | `◐○○` 第一个填充 + "今日 1/3" 灰色 | **无**"已完成 1 件"红字 |
| 2/3 | `◐◐○` 前两个填充 | 同上 |
| 3/3 | `◐◐◐` 全填充 + "今日 3/3" **仍然灰色**（不内卷） | 灰色 = "今天够了" 而非 "🎉 完成" |
| 休整态 | `○○○` 全灰 + "今天先休息" 小字 | **不显示**"你今天没练" |

> **关键决策**：完成度**始终用灰色**（`text-neutral-500`），**不**用绿色（避免"胜利"叙事）；**不**写"完成 50% / 100%"数字（避免"内卷式"目标，prototype §16.1 polish 期望）；**不**显示"未完成"红色。

### 2.6 选做 B 在 M2 PoC 的占位

> prototype §5.4 期望"知识小卡 OR 自定义场景"，两者均 M3 上。M2 PoC 范围内：

| 选做 B | 内容 | UI | 完成度 |
| --- | --- | --- | --- |
| **去自由对话** | 跳 `/conversation` | 文字链 | **不**计完成度（M2 阶段）；M3 接入"知识小卡"后改为可标记完成 |
| **今日休整**（替代必做） | 用户主动放弃今日必做 | 文字链 | 必做变灰；"今日 0/3"不变红 |

> **关键决策**：选做 B **不计入**完成度（M2 范围）；用户完成"自由对话"也不算 1/3。原因：prototype §5.4 "50% / 100% / 150%" 是 M3 上知识小卡时的目标形态，M2 PoC 仅验证"必做"路径。

---

## 3. "今日推荐"算法

### 3.1 输入数据

```ts
interface RecommendInput {
  /** 所有 SkillNode（含 locked / available / in_progress / mastered_basic / mastered_deep） */
  skills: SkillNodeStatus[];
  /** 温和连击上下文 */
  gentleStreak: {
    /** 连续 N 天都有"练过"；缺失 = 0 */
    days: number;
    /** 每周剩余休整日（M2 阶段：从 settings / T-07 接入） */
    restDaysLeftThisWeek: number;
    /** 今日是否已练过 */
    practicedToday: boolean;
  };
  /** 低压力模式开关（M2 阶段：从 GlobalHeader / T-08 接入） */
  lowPressureMode: boolean;
  /** 今日 UTC 日期（用于 daily 重算） */
  today: string;  // ISO date 'YYYY-MM-DD'
}

type SkillNodeStatus = {
  id: string;
  code: string | null;
  title: string;
  layer: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  status: 'locked' | 'available' | 'in_progress' | 'mastered_basic' | 'mastered_deep' | 'recommended';
  practiced: number;
  /** 距上次练习天数；undefined = 从未练过 */
  restDays?: number;
  /** 草稿步骤（in_progress 时存在） */
  draftStep?: { stepIndex: number; stepName: string };
  /** 最近一次练习时间戳 ISO；undefined = 从未 */
  lastPracticedAt?: string;
};
```

### 3.2 推荐算法（纯函数，可测试）

> 来源：`docs/design/T-01-skill-tree-home.md` §3.3 + prototype §5.4 + 竞品研究 §5 M2/M4（Daily Quests + 每日微课）。
> **核心原则**：
> 1. 全树同一时刻**最多 1 个** `recommended` 节点（polish P-07 唯一发光规则）。
> 2. 推荐算法**不区分 LPM**：LPM 决定**视觉**（发光强度），不影响**算法选谁**（避免 LPM OFF 时漏推荐）。
> 3. 休整日**不重置**推荐（用户进入 `/today` 仍能看到推荐）；只是"必做可换成休整"。

```ts
// src/lib/today-recommend.ts（设计稿占位，不落地）
export function computeRecommended(input: RecommendInput): SkillNodeStatus | null {
  // 1. 若已有 recommended 节点（来自 daily 重算缓存），直接复用
  const cached = input.skills.find((s) => s.status === 'recommended');
  if (cached) return cached;

  // 2. 候选池：排除 locked / mastered_deep（已掌握深入 → 不再推送）
  const candidates = input.skills.filter((s) =>
    s.status !== 'locked' &&
    s.status !== 'mastered_deep' &&
    s.code !== null  // 必须有可演练的内容
  );

  if (candidates.length === 0) return null;

  // 3. 优先级排序（分数高者优先）
  const scored = candidates.map((skill) => {
    let score = 0;

    // 优先级 a: in_progress（有草稿 → 优先恢复）
    if (skill.status === 'in_progress') score += 100;

    // 优先级 b: available（未练过 → 新鲜度最高）
    if (skill.status === 'available') score += 50;

    // 优先级 c: mastered_basic（已掌握基础 → 复习 / 推进深入）
    if (skill.status === 'mastered_basic') score += 30;

    // 加分项: rest_days 距上次练习时间（越久越优先）
    if (skill.restDays !== undefined) {
      // 0 天 = +0；1 天 = +5；3 天 = +15；7 天 = +35
      score += Math.min(skill.restDays * 5, 35);
    } else {
      // 从未练过 = +40（新鲜感最高）
      score += 40;
    }

    // 加分项: 段层（优先低段 = 入门优先，但 M2 PoC 仅 §1~§2 + L3-01）
    // 暂不按 layer 加分（M2 PoC 段层固定）

    return { skill, score };
  });

  // 4. 取分数最高
  scored.sort((a, b) => b.score - a.score);
  return scored[0].skill;
}

// 选做 A 算法：与必做不同 layer 的复习候选
export function pickReviewCandidate(
  skills: SkillNodeStatus[],
  recommendedId: string,
): SkillNodeStatus | null {
  const recommended = skills.find((s) => s.id === recommendedId);
  const candidates = skills.filter((s) =>
    s.status !== 'locked' &&
    s.id !== recommendedId &&
    s.code !== null &&
    s.status !== 'recommended' &&
    // 仅 mastered_basic / available（不是 in_progress，避免与必做"恢复草稿"冲突）
    (s.status === 'mastered_basic' || s.status === 'available')
  );

  if (candidates.length === 0) return null;

  // 优先 mastered_basic（复习价值更高）
  const sorted = candidates.sort((a, b) => {
    if (a.status === 'mastered_basic' && b.status !== 'mastered_basic') return -1;
    if (b.status === 'mastered_basic' && a.status !== 'mastered_basic') return 1;
    // 同优先级按 rest_days 降序
    const aDays = a.restDays ?? 0;
    const bDays = b.restDays ?? 0;
    return bDays - aDays;
  });

  // 段层与必做不同（避免"全是 §2"）
  if (recommended) {
    const diffLayer = sorted.find((s) => s.layer !== recommended.layer);
    if (diffLayer) return diffLayer;
  }

  return sorted[0];
}
```

### 3.3 评分细节（基于 SkillNode.practiced / rest_days / gentle_streak）

| 维度 | 规则 | 分值 | 备注 |
| --- | --- | --- | --- |
| **状态优先级** | `in_progress` | +100 | 有草稿 → 优先恢复 |
| | `available` | +50 | 未练过 → 新鲜感 |
| | `mastered_basic` | +30 | 练过 1 次 → 复习 / 推进 |
| | `mastered_deep` | **过滤掉** | 已掌握深入 → 不再推送（避免重复推送已稳定的） |
| | `locked` | **过滤掉** | 不可达 |
| **rest_days 加分** | 0 天 | +0 | 刚练过 → 不必立即再推 |
| | 1 天 | +5 | |
| | 3 天 | +15 | |
| | 7 天 | +35 | |
| | 7+ 天 | +35（封顶） | |
| | `undefined`（从未练过） | +40 | 新鲜度 |
| **gentle_streak 加分** | `days = 0` | +0 | 缺失静默归零态 → 仍推（不惩罚） |
| | `days = 1~6` | +0 | 不区分 |
| | `days >= 7` | -10 | 连击 ≥ 7 天 → 降低推荐频率（避免成瘾） |
| | `practicedToday = true` | -50 | 今日已练过 → 必做降权（仍展示但不"催促"） |
| **LPM 影响** | `lowPressureMode = true` | 不改算法 | LPM 仅影响视觉（发光降级） |
| | `lowPressureMode = false` | 不改算法 | |

> **关键不变量**：算法**不读** `gentle_streak` 作为**正向激励**——只用作**减负**（高分用户少推）。这与 prototype §16.2 polish "无打卡天数" 一致。

### 3.4 M2 PoC 阶段的简化（M3 升级路径）

| 维度 | M2 PoC（本稿） | M3 升级 |
| --- | --- | --- |
| 数据源 | 内存写死（`today/page.tsx` 当前）+ `localStorage` 增量 | 接 Supabase `practiced` 表 |
| `rest_days` 计算 | `today - lastPracticedAt`（基于 `localStorage.drill_progress.{code}`） | 同 M2，但数据从 BE 拉 |
| `gentle_streak.days` | **写死**为 `3`（prototype 期望） | T-07 接入真实数据 |
| `gentle_streak.restDaysLeftThisWeek` | **写死**为 `1` | T-07 接入 |
| `lowPressureMode` | 从 `GlobalHeader` 读占位（**当前未 Toggle 化**） | T-08 接入真实 Toggle |
| 推荐节点缓存 | 每次 `GET /api/today-3` 重新算 | 每日 0:00 定时算 + cache |
| 选做 A | 同 §3.2 `pickReviewCandidate` | 同 |
| 选做 B | 占位（"去自由对话"） | 接知识小卡 / 自定义场景 |

> **本稿**只设计 M2 PoC 形态，**留接口**给 T-07 / T-08 接真实数据。

### 3.5 推荐算法的可解释性

> 用户**不**直接看到"为什么是它"，但**间接**通过以下线索感知：
> 1. **唯一发光**（polish P-07）：视觉传达"这是为你推荐的"。
> 2. **进度环 / 金冠**：用户从 `available` → `mastered_basic` 看到节点变化，**反向**理解"我刚练过这个"。
> 3. **顶部温和连击**：练过 +1 后"练过 N 次" 数字 +1，**反向**理解"系统记得"。
>
> **关键决策**：T-06 **不**写"系统推荐你练「拒绝同事甩活」"等文案；推荐通过**视觉**传达，不通过**文字解释**（与 polish P-07 一致）。

---

## 4. 与技能树主页的关系（来自 T-01 §5）

### 4.1 数据流（主页视角）

```
[today/page.tsx 加载]
   ↓
useEffect → GET /api/today-3
   ↓
   ├─ required = 必做节点（含 code / title / practiced / restDays）
   ├─ optional = [选做 A, 选做 B 占位]
   ├─ completed = "今日 0/3" (initial)
   └─ canRest = gentle_streak.restDaysLeftThisWeek > 0
   ↓
[today/page.tsx 渲染]
   ├─ 顶部"今日 X/3"进度条（3 个圈 ◐ ◯ ◯）
   ├─ [休整] 按钮（当 canRest = true 时可见）
   ├─ SkillTree（5 段）
   │    ├─ required 节点 status = 'recommended'（软发光）
   │    ├─ 其他可点节点 status = 'available' / 'mastered_basic' / 'in_progress'
   │    └─ 必做节点在选做 A/B 列表里也展示（提供快速入口）
   └─ "今天就到这里"按钮（永远可达）
```

### 4.2 必做节点的双重身份（关键设计）

| 位置 | 状态 | 视觉 | 行为 |
| --- | --- | --- | --- |
| 技能树里 | `recommended`（软发光 + 放大 1.05x） | 与 T-01 §3.2 `recommended` 一致 | 点 → 进 `/drill?code=X` |
| 顶部"今日进度条"里 | **不重复渲染**（避免双重视觉冲突） | — | — |
| 选做列表里 | **不展示**（避免"必做 = 选做"语义混乱） | — | — |

> **关键决策**：必做节点**只在技能树**视觉传达；顶部进度条**仅显示完成度**，**不**显示节点标题。
> 原因：polish P-01 "主页是 1 个心智模型（路径），不是 3 个（顶部状态 / 今日列表 / 技能树）"。

### 4.3 选做节点的呈现（与必做的关系）

| 选做类型 | 在技能树里 | 在顶部"今日 X/3"进度条里 | 在选做列表（如未来展开）里 |
| --- | --- | --- | --- |
| **选做 A** | **保持原状态**（`available` / `mastered_basic`）—— 不高亮，不发光 | **占用 1 圈**（第 2 圈） | **可选**：在 `<details>` 折叠区显示"选做 A：节点名 · 选做 B：去自由对话"，**默认折叠**（polish P-01 不抢眼） |
| **选做 B** | **不渲染**（独立入口） | **占用 1 圈**（第 3 圈） | 同上 |

> **M2 PoC 简化**：本稿**不**渲染"选做列表"折叠区（M3 上）；仅在顶部进度条**hover/focus** 时显示 3 圈对应的"做什么"（tooltip 或 `aria-label`）。

### 4.4 与 T-01 §5 的契约对齐

| T-01 期望 | T-06 实现 | 一致 |
| --- | --- | --- |
| 主页是 1 个心智模型（路径），不是 3 个（polish P-01） | 必做节点仅在技能树呈现；顶部"今日 X/3"是**完成度指示器**，不显示节点名 | ✅ |
| 节点 6 态：recommended 全树唯一 | 推荐算法确保 `recommended` 唯一 | ✅ |
| 推荐节点不写"今日"文字（polish P-07） | T-06 **不**在推荐节点加任何"今日必做"标记 | ✅ |
| 节点连接线 + 1px 虚线（T-01 §2.3） | T-06 不涉及节点连接（属 T-01 polish） | ➖ |
| 顶部状态条（温和连击 + LPM 入口） | T-06 **复用** T-01 §7 的状态条位置；不新增第二条 | ✅ |

### 4.5 与 BottomNav / GlobalHeader 的兼容

| 组件 | 与 T-06 的关系 | 兼容性 |
| --- | --- | --- |
| `GlobalHeader` | LPM 开关位于 GlobalHeader 右侧（T-08 实施）；T-06 引用状态但不实做 Toggle | ✅ T-06 读 `lowPressureMode` 占位（默认 true） |
| `BottomNav` | 4 Tab（今日 / 自由对话 / 我的剧本 / 我）；T-06 不修改 | ✅ |
| 顶部"今日 X/3"进度条 | **不在** GlobalHeader（避免双重）；位置在 `today/page.tsx` 内 header 下方 | ✅ |

---

## 5. 与低压力模式（LPM）的耦合

### 5.1 LPM 影响范围（本稿范围）

| 维度 | LPM ON（默认） | LPM OFF |
| --- | --- | --- |
| **算法** | 不变 | 不变（算法不区分 LPM；§3.2） |
| **推荐节点视觉** | 静态 ring + 软发光（无 motion-safe 放大） | 软发光 + 放大 1.05x（motion-safe） |
| **顶部"今日 X/3"动效** | 数字 +1 静默（无 fade） | 数字 +1 fade-in 200ms |
| **完成态反馈** | "练过 1 次"静态文字 | "练过 1 次" fade-in 200ms |
| **"今天先休息"入口** | **永远可达**（[休整] 按钮） | 同 |
| **推送** | 全关（默认） | 用户可订阅"今日完成"轻提示（T-08） |
| **节点动效** | 静态（无 fade） | 状态切换 fade 200ms |

### 5.2 LPM 与"今日休整"的耦合

> 用户**永远**可点 [休整] 按钮将"必做"换成"今日休整"，**不**受 LPM 影响。

```
[用户在 /today 顶部点 [休整]]
   ↓
POST /api/today-3/rest
   ↓
[服务端]
   ├─ 校验 gentle_streak.restDaysLeftThisWeek > 0
   ├─ 若 yes：标记今日 rest=true → 必做节点降级（recommended → available）
   ├─ 若 no：返回 NW-TD-0001（"本周休整已用完"）
   ↓
[客户端]
   ├─ "今日 X/3" 显示 "今天先休息"
   ├─ 推荐节点降级发光（recommended → available）
   └─ 用户**仍**可点技能树上其他节点（自由探索）
```

### 5.3 LPM 与推荐算法的边界

> **关键决策**：LPM 开关**不影响**推荐节点**选谁**，**仅影响**视觉与动效。
> 理由：
> 1. LPM 是用户对"动效 / 推送 / 视觉刺激"的偏好，**不**是"我想练什么"的偏好。
> 2. 若 LPM OFF 时换推荐节点，会形成"切换 LPM = 切换节点"的诡异映射（用户不知发生了什么）。
> 3. prototype §16.2 polish "顶部常驻 LPM 开关，默认 ON" 仅指**视觉**与**推送**，不指**算法**。

### 5.4 LPM 数据流（M2 PoC 占位）

> M2 PoC 阶段：LPM 状态从 `GlobalHeader` 读占位（**当前未 Toggle 化**），默认值 `true`。
> T-08 实施时：LPM Toggle 化 + 推送控制；T-06 **不修改** GlobalHeader 源代码。

```ts
// 客户端读 LPM 占位（M2）
function readLowPressureMode(): boolean {
  // M2 PoC: 从 localStorage 占位
  if (typeof window === 'undefined') return true;  // SSR 默认
  return localStorage.getItem('lpm_enabled') !== 'false';  // 默认 true
}
```

---

## 6. 与温和连击的耦合（T-07 占位设计）

### 6.1 T-07 数据契约（T-06 引用 · 不实做）

> 来源：`plans/m2-poc.md` T-07 + prototype §7.6 + §8.3 温和连击状态机。
> 本稿**不实做** T-07；仅定义 T-06 端**消费**的接口。

```ts
// T-07 待实施；本稿仅定义接口
interface GentleStreak {
  /** 连续 N 天都有"练过"；缺失静默归零 */
  days: number;
  /** 每周可休整天数（默认 1，最多 2） */
  restDaysPerWeek: number;
  /** 本周剩余休整日 */
  restDaysLeftThisWeek: number;
  /** 今日是否已练过 ≥ 1 次 */
  practicedToday: boolean;
  /** 最近一次练习时间 ISO */
  lastPracticedAt: string | null;
}

// T-06 读此接口计算 canRest + 影响推荐算法（§3.3 gentle_streak 加分）
```

### 6.2 T-06 与 T-07 的数据流

```
[GET /api/today-3]
   ↓
   ├─ 读 gentle_streak（T-07 数据源：内存 / Supabase M3）
   ├─ 计算 canRest = gentle_streak.restDaysLeftThisWeek > 0
   ├─ 读 low_pressure_mode（T-08 数据源：localStorage 占位）
   ├─ 读 skills（含 practiced / rest_days / last_practiced_at）
   ├─ 调 computeRecommended(input)
   ├─ 调 pickReviewCandidate(skills, recommendedId)
   ├─ 选做 B = 占位（M2 阶段："去自由对话"）
   └─ 响应 { required, optional: [a, b], completed: "0/3", canRest, gentle_streak: {...} }
```

### 6.3 必做完成时对温和连击的影响

> 用户完成必做（演练 step 12 完成） → 节点 `mastered_basic` + 顶部温和连击 +1。
> 详见 T-04 §2.4 副作用清单 + T-07 实施。
> **T-06 不实做** 连击 +1 逻辑；T-06 仅**消费** `gentle_streak` 数据。

### 6.4 今日休整时对温和连击的影响

```
[POST /api/today-3/rest]
   ↓
[服务端 T-07 逻辑]
   ├─ gentle_streak.restDaysLeftThisWeek -= 1
   ├─ 标记今日 rest=true
   └─ 不影响 days（连击不断，因为是"休整"而非"缺失"）
```

> **关键不变量**：休整日**不**计入"缺失"——T-07 温和连击状态机中，休整日 = "不连续也不断签"，与"今日完成"等价。
> 来源：prototype §7.6 + §8.3。

### 6.5 T-06 不实现的内容（明确边界）

| 不实现 | 原因 |
| --- | --- |
| 温和连击 +1 逻辑 | T-07 任务 |
| 休整日计数 | T-07 任务 |
| LPM Toggle 化 | T-08 任务 |
| 推送控制 | T-08 任务 |
| 演练完成反馈 → 温和连击 +1 的副作用触发 | T-04 副作用 + T-07 数据写入 |

> 本稿**仅定义 T-06 端**消费 `gentle_streak` 的接口，不实做 T-07 内部逻辑。

---

## 7. API 契约

### 7.1 GET /api/today-3

**目的**：返回今日 1 必做 + 2 选做 + 完成度 + 休整状态。

**请求**：

```http
GET /api/today-3
Cookie: device_token=...
```

**响应（200）**：

```json
{
  "data": {
    "today": "2026-06-17",
    "required": {
      "id": "s2-want",
      "code": "family-marriage",
      "title": "说出\"我想要\"",
      "layer": "L2",
      "scene_tags": ["family", "催婚"],
      "difficulty": 3,
      "practiced": 0,
      "rest_days": null,
      "status": "recommended",
      "rationale": "available+rest_undefined"   // 算法可解释性（M3 上线时使用）
    },
    "optional": [
      {
        "id": "s1-name",
        "code": "l1-emotion-naming",
        "title": "给情绪命名",
        "layer": "L1",
        "scene_tags": ["self", "命名"],
        "difficulty": 1,
        "practiced": 1,
        "rest_days": 3,
        "status": "mastered_basic",
        "kind": "review"      // 选做 A
      },
      {
        "kind": "placeholder",  // 选做 B（M2 占位）
        "action": "free_conversation",
        "label": "去自由对话",
        "href": "/conversation"
      }
    ],
    "completed": {
      "required_done": false,
      "optional_a_done": false,
      "optional_b_done": false,
      "total": "0/3"
    },
    "can_rest": true,             // gentle_streak.restDaysLeftThisWeek > 0
    "gentle_streak": {
      "days": 3,
      "rest_days_left_this_week": 1,
      "practiced_today": false
    },
    "low_pressure_mode": true
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
| `today` | ISO date | 服务端判定；客户端**不**传 |
| `required.code` | string | 演练 code（点 → `/drill?code=X`） |
| `required.status` | `'recommended'` | 必做节点在技能树里**永远**是这个态 |
| `optional[].kind` | `'review' \| 'placeholder'` | review = 选做 A；placeholder = 选做 B（M2 占位） |
| `completed.total` | `"X/3"` | 字符串，**不**用数字（避免"X 是数字"暗示倒计时） |
| `can_rest` | boolean | true 时 [休整] 按钮可达 |
| `gentle_streak` | object | T-07 数据源；M2 PoC 阶段从 T-07 占位读 |
| `low_pressure_mode` | boolean | T-08 数据源；M2 PoC 阶段从 localStorage 读占位 |

**错误码**：

| 状态 | 错误码 | 场景 |
| --- | --- | --- |
| 401 | `NW-AU-0001` | 未鉴权 |
| 500 | `NW-ST-0001` | 系统异常 |
| 503 | `NW-TD-0002` | 推荐算法依赖数据源不可用（如 scenarios-data 加载失败） |

### 7.2 POST /api/today-3/[id]/done

**目的**：标记必做 / 选做 A 完成（即"我练过了"）；选做 B（M2 占位）无此端点。

**请求**：

```json
POST /api/today-3/s2-want/done
Cookie: device_token=...
Content-Type: application/json

{
  "data": {
    "id": "s2-want",
    "code": "family-marriage",
    "drill_session_id": "drill-<uuid>"   // 可选：演练会话 ID
  },
  "meta": { "client_msg_id": "uuid" }
}
```

> **设计意图**：T-06 **不**在此端点内实做"演练 step 12 完成"的副作用（mastered_basic + 累计 +1 + 温和连击 +1）。这些副作用由 **T-04 step 12 完成**触发（T-04 §2.4 + T-07 接入）。T-06 此端点仅：
> 1. 校验 `id` 在今日三件小事内；
> 2. 校验 `code` 与 `id` 对应的 skill 一致；
> 3. 校验 `drill_session_id`（若提供）存在且状态为 `completed`；
> 4. 写今日完成态到 `localStorage.today_done.{id}` 或 M3 接 Supabase；
> 5. 返回更新后的 `completed.total`。

**响应（200）**：

```json
{
  "data": {
    "id": "s2-want",
    "completed_at": "2026-06-17T10:15:00Z",
    "completed": {
      "required_done": true,
      "optional_a_done": false,
      "optional_b_done": false,
      "total": "1/3"
    }
  },
  "meta": { "trace_id": "uuid", "server_time": "2026-06-17T10:15:00Z" }
}
```

**错误码**：

| 状态 | 错误码 | 场景 |
| --- | --- | --- |
| 400 | `NW-TD-0001` | `id` 不在今日三件小事列表内 |
| 400 | `NW-TD-0003` | `code` 与 `id` 不匹配 |
| 404 | `NW-CO-0001` | `drill_session_id` 不存在 |
| 410 | `NW-DR-0013` | `drill_session_id` 状态非 `completed` |
| 401 | `NW-AU-0001` | 未鉴权 |
| 500 | `NW-ST-0001` | 系统异常 |

### 7.3 POST /api/today-3/rest（可选 · M2 PoC 占位）

**目的**：标记今日"休整"，必做降级 + 休整日 -1。

**请求**：

```json
POST /api/today-3/rest
Cookie: device_token=...
Content-Type: application/json

{ "data": {}, "meta": { "client_msg_id": "uuid" } }
```

**响应（200）**：

```json
{
  "data": {
    "rested": true,
    "gentle_streak": {
      "days": 3,
      "rest_days_left_this_week": 0,
      "practiced_today": false
    },
    "today_view": {
      "label": "今天先休息",
      "total": "0/3",
      "required": null        // 必做降级为 null
    }
  },
  "meta": { "trace_id": "uuid", "server_time": "2026-06-17T10:00:00Z" }
}
```

**错误码**：

| 状态 | 错误码 | 场景 |
| --- | --- | --- |
| 400 | `NW-TD-0001` | 本周休整已用完（`restDaysLeftThisWeek = 0`） |
| 401 | `NW-AU-0001` | 未鉴权 |
| 500 | `NW-ST-0001` | 系统异常 |

> **M2 PoC 决策**：本端点**可**在 M2 阶段实做（轻量 + 0 LLM）；M3 接入 Supabase 时改为事务操作。

### 7.4 错误码定义（NW-TD-XXXX）

| Code | 含义 | HTTP | user_message | action_hint | 触发位置 |
| --- | --- | --- | --- | --- | --- |
| `NW-TD-0001` | 三件小事操作不在范围内 / 休整已用完 | 400 | "今天的事已记下。" / "本周休整已用过。" | "show_today" | POST `/today-3/[id]/done` / POST `/today-3/rest` |
| `NW-TD-0002` | 推荐算法依赖数据源不可用 | 503 | "我们先按上次的结果。" | "show_cached" | GET `/today-3` |
| `NW-TD-0003` | `code` 与 `id` 不匹配 | 400 | "对不上，再试一次。" | "show_today" | POST `/today-3/[id]/done` |

### 7.5 与现有端点的关系

| 现有端点 | 用途 | T-06 关系 |
| --- | --- | --- |
| `GET /api/scenarios` | 列所有场景元数据 | T-06 复用（推荐算法读 `scenarios-data`） |
| `GET /api/profiles/me` | 用户档案 | T-06 复用（读 `gentle_streak` / `low_pressure_mode`） |
| `POST /api/scripts` | 保存剧本 | T-06 不直接调；演练 step 11 调（T-04 §7） |
| `POST /api/conversations/drill/start` | 创建演练会话 | T-06 不直接调；用户在 `/today` 点必做节点进演练页后调 |

---

## 8. UI 设计（卡片布局 / 已完成反馈 / 不打勾不闪烁）

### 8.1 顶部"今日 X/3"进度条 + [休整] 按钮

```
┌────────────────────────────────────────────────────────┐
│ 今日                                                │
│ 🌱 练过 12 次 · 3 天的练习 · 可休整 1 天            │
│                                                        │
│ ┌─ 今日 1/3 ──────────────────────────────────────┐ │
│ │  ◐ ◯ ◯   1 件必做 + 2 件选做              [休整] │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ─ 边界成长路 ─────────────────────────                │
│ …                                                    │
```

**视觉规范**：

| 元素 | 样式 | 备注 |
| --- | --- | --- |
| 进度条容器 | `border border-border bg-surface rounded-xl px-4 py-3` | 与技能树卡片同型 |
| "今日 X/3" 文字 | `text-sm text-neutral-500` | 灰色次要；**不**用 `text-primary` |
| 3 个圈 | `h-2 w-2 rounded-full` 填充态 `bg-primary/40`；未填充 `bg-border` | 静默色，不刺眼 |
| [休整] 按钮 | `text-sm text-neutral-500 hover:text-foreground` 文字按钮 | **不**做主按钮；**不**做按钮色 |
| 移动端（< 480px） | 进度条与按钮**单行**；按钮文字改"今日休息" | 短文案 |

**关键决策**：
1. **不显示**"必做 = 节点名"文字（避免双重心智模型；§4.2）。
2. **不显示**"未完成"红色感叹号（prototype §5.4 + §16.3 拒绝清单）。
3. **不显示**"🎉 完成"绿色（避免胜利叙事；§2.5）。
4. **不显示**"倒计时" / "X 天后过期"（避免催促；B2/B3）。
5. [休整] 按钮**永远**是文字按钮（**不**做按钮色），与 prototype §16.2 polish "不强调不催促" 一致。

### 8.2 已完成反馈（克制版）

> 用户完成必做后（演练 step 12 完成 + 跳回 /today）：

**触发时机**：

| 触发 | 来源 |
| --- | --- |
| 演练 step 12 完成 + 跳 `/today` | T-04 §2.4 副作用：节点 `mastered_basic` |
| T-06 `POST /api/today-3/[id]/done` 确认 | T-06 端点（可选；M2 PoC 接受仅依赖 T-04 副作用） |
| 必做节点软发光消失 | SkillNode 状态从 `recommended → mastered_basic` |
| 顶部"今日 X/3" 第 1 圈从 `bg-primary/40` → `bg-primary/60`（略加深） | 静默色变化，**不**用绿色 |
| 顶部状态条"练过 N 次" 数字 +1 | T-07 接入温和连击后；M2 写死 |

**反馈层级**：

| 层级 | 视觉 | 备注 |
| --- | --- | --- |
| **强** | 节点 `recommended → mastered_basic`（金冠填充） | 用户在技能树**已可见** |
| **中** | 顶部进度条第 1 圈颜色变化（静默） | 用户**主动看**才注意 |
| **弱** | 顶部温和连击 +1（数字 fade-in） | LPM ON 时**无**fade |
| **无** | ❌ 红字、❌ 抖动、❌ 抖动 + flash、❌"胜利 🏆"、❌ toast "完成！" | prototype §16.3 + §11 禁用 |

> **关键不变量**：完成反馈**永远**克制（§16.1 polish）；**无**"胜利 / 🎉 / 完成 / 棒"等评价性话术（与 PE 守则 §10 一致）。

### 8.3 "今天先休息" 态

```
┌────────────────────────────────────────────────────────┐
│ 今日                                                │
│ 🌱 练过 12 次 · 3 天的练习 · 可休整 0 天            │  ← T-07 接入后真实数据
│                                                        │
│ ┌─ 今日 ─────────────────────────────────────────┐ │
│ │  今天先休息                            [取消]  │ │  ← 文字按钮 [取消]
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ─ 边界成长路 ─────────────────────────                │
│ 节点全部降级（recommended → available），无发光       │
│ …                                                    │
```

**关键决策**：
1. 用户点 [休整] 后，"今日 X/3" 进度条变 "今天先休息" 文字（**不**保留 0/3）。
2. 顶部状态条"可休整 K 天" 数字 -1（K = 0 时 [休整] 按钮隐藏）。
3. 推荐节点降级（`recommended → available`），技能树**无发光**。
4. [取消] 文字按钮可达（**不**做按钮色）；点后恢复 `recommended` 节点（K + 1）。
5. **不显示**"今日休整成功" toast；**不显示**红/绿色反馈。

### 8.4 选做 A / B 完成态

| 选做类型 | 完成视觉 |
| --- | --- |
| **选做 A**（复习节点） | 节点 `mastered_basic → mastered_deep`（双金冠）+ 顶部进度条第 2 圈变深 |
| **选做 B**（M2 占位"去自由对话"） | M2 阶段**不计入**完成度；M3 接入知识小卡后改为可标记完成 |

### 8.5 "今天就到这里" 按钮（永远可达）

```
[ 今天就到这里 ]
```

**保留位置**：`today/page.tsx` 底部（当前已存在，**不修改**）。
**行为**：跳 `/conversation`（自由对话，v1.0 习惯，与 T-01 §1.1 "张力点"一致）。
**视觉**：`text-sm text-neutral-500` 文字按钮 + `border-b border-dashed` 下划线（**不**做主按钮）。

### 8.6 移动端适配（xs < 480px）

| 元素 | 桌面端 | 移动端 |
| --- | --- | --- |
| 进度条 + [休整] | 单行 3 圈 + 文字 + 按钮 | 单行缩短；按钮文案"今日休息" |
| 进度条 | `text-sm` | `text-xs` |
| [休整] 按钮位置 | 右侧 | 右侧（不变） |
| 技能树节点 | 水平居中 + 圆角 20 | 全宽 + 圆角 12 |

---

## 9. 关键代码片段（≤ 200 行）

> ⚠️ 本片段是**设计稿占位**（仅作形态与结构示意），**不直接落地到 src/**。落地时由 Coordinator 批准后另立实施任务。

### 9.1 推荐算法（`src/lib/today-recommend.ts`，约 80 行）

```ts
// src/lib/today-recommend.ts
// 来自 docs/design/T-06-today-three.md §3
import { scenarios } from './scenarios-data';

export type SkillNodeStatus = {
  id: string;
  code: string | null;
  title: string;
  layer: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  status: 'locked' | 'available' | 'in_progress' | 'mastered_basic' | 'mastered_deep' | 'recommended';
  practiced: number;
  restDays?: number;
  lastPracticedAt?: string;
  draftStep?: { stepIndex: number; stepName: string };
};

export interface RecommendInput {
  skills: SkillNodeStatus[];
  gentleStreak: {
    days: number;
    restDaysLeftThisWeek: number;
    practicedToday: boolean;
  };
  lowPressureMode: boolean;
  today: string;
}

// 主推荐算法（§3.2）
export function computeRecommended(input: RecommendInput): SkillNodeStatus | null {
  // 1. 复用已有 recommended（daily 重算缓存）
  const cached = input.skills.find((s) => s.status === 'recommended');
  if (cached && cached.code && scenarios.some((sc) => sc.code === cached.code)) {
    return cached;
  }

  // 2. 候选池：排除 locked / mastered_deep / 无 code
  const candidates = input.skills.filter(
    (s) => s.status !== 'locked' && s.status !== 'mastered_deep' && s.code !== null,
  );
  if (candidates.length === 0) return null;

  // 3. 评分（§3.3）
  const scored = candidates.map((skill) => {
    let score = 0;
    if (skill.status === 'in_progress') score += 100;
    if (skill.status === 'available') score += 50;
    if (skill.status === 'mastered_basic') score += 30;
    if (skill.restDays !== undefined) {
      score += Math.min(skill.restDays * 5, 35);
    } else {
      score += 40;  // 从未练过
    }
    // gentle_streak 减负项
    if (input.gentleStreak.days >= 7) score -= 10;
    if (input.gentleStreak.practicedToday) score -= 50;
    return { skill, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].skill;
}

// 选做 A 算法（§3.2）
export function pickReviewCandidate(
  skills: SkillNodeStatus[],
  recommendedId: string,
): SkillNodeStatus | null {
  const recommended = skills.find((s) => s.id === recommendedId);
  const candidates = skills.filter(
    (s) =>
      s.id !== recommendedId &&
      s.code !== null &&
      (s.status === 'mastered_basic' || s.status === 'available'),
  );
  if (candidates.length === 0) return null;

  const sorted = candidates.sort((a, b) => {
    if (a.status === 'mastered_basic' && b.status !== 'mastered_basic') return -1;
    if (b.status === 'mastered_basic' && a.status !== 'mastered_basic') return 1;
    return (b.restDays ?? 0) - (a.restDays ?? 0);
  });

  // 段层与必做不同
  if (recommended) {
    const diff = sorted.find((s) => s.layer !== recommended.layer);
    if (diff) return diff;
  }
  return sorted[0];
}
```

### 9.2 API Route: GET /api/today-3（`src/app/api/today-3/route.ts`，约 60 行）

```ts
// src/app/api/today-3/route.ts
// 来自 docs/design/T-06-today-three.md §7.1
import { NextRequest, NextResponse } from 'next/server';
import { withTrace, withRateLimit } from '@/lib/api/middleware';
import { jsonError } from '@/lib/utils/error';
import { computeRecommended, pickReviewCandidate } from '@/lib/today-recommend';
import { scenarios } from '@/lib/scenarios-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// M2 PoC: 写死 skill 列表（与 today/page.tsx §1 同源；M3 接 Supabase）
const MOCK_SKILLS = [
  { id: 's1-body', code: 'l1-body-awareness', title: '听见身体的信号', layer: 'L1' as const, status: 'mastered_deep' as const, practiced: 2, restDays: 4 },
  { id: 's1-name', code: 'l1-emotion-naming', title: '给情绪命名', layer: 'L1' as const, status: 'mastered_basic' as const, practiced: 1, restDays: 3 },
  { id: 's1-pattern', code: 'l1-pattern-spotting', title: '看见讨好模式', layer: 'L1' as const, status: 'in_progress' as const, practiced: 0, draftStep: { stepIndex: 5, stepName: '觉察' } },
  { id: 's2-want', code: 'family-marriage', title: '说出"我想要"', layer: 'L2' as const, status: 'available' as const, practiced: 0, restDays: undefined },
  { id: 's2-wont', code: 'family-money', title: '说出"我不想"', layer: 'L2' as const, status: 'available' as const, practiced: 0, restDays: undefined },
  { id: 's2-mine', code: 'partner-cold', title: '区分"我的 / 别人的"', layer: 'L2' as const, status: 'available' as const, practiced: 0, restDays: undefined },
];

export async function GET(req: NextRequest) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('today3:get', 60, 60_000);
  if (!rl.ok) return rl.response;

  try {
    // M2 PoC: 写死 gentle_streak / low_pressure_mode（M3 接真实数据）
    const gentleStreak = { days: 3, restDaysLeftThisWeek: 1, practicedToday: false };

    const required = computeRecommended({
      skills: MOCK_SKILLS,
      gentleStreak,
      lowPressureMode: true,
      today: new Date().toISOString().slice(0, 10),
    });
    if (!required) return jsonError('NW-TD-0002', trace_id);

    const optionalA = pickReviewCandidate(MOCK_SKILLS, required.id);

    return NextResponse.json({
      data: {
        today: new Date().toISOString().slice(0, 10),
        required: {
          id: required.id,
          code: required.code,
          title: required.title,
          layer: required.layer,
          scene_tags: scenarios.find((s) => s.code === required.code)?.scene_tags ?? [],
          difficulty: scenarios.find((s) => s.code === required.code)?.difficulty ?? 1,
          practiced: required.practiced,
          rest_days: required.restDays ?? null,
          status: 'recommended' as const,
          rationale: `${required.status}+${required.restDays !== undefined ? `rest_${required.restDays}` : 'rest_undefined'}`,
        },
        optional: [
          optionalA
            ? {
                id: optionalA.id,
                code: optionalA.code,
                title: optionalA.title,
                layer: optionalA.layer,
                scene_tags: scenarios.find((s) => s.code === optionalA.code)?.scene_tags ?? [],
                difficulty: scenarios.find((s) => s.code === optionalA.code)?.difficulty ?? 1,
                practiced: optionalA.practiced,
                rest_days: optionalA.restDays ?? null,
                status: optionalA.status,
                kind: 'review' as const,
              }
            : { kind: 'placeholder' as const, action: 'free_conversation', label: '去自由对话', href: '/conversation' },
          // 选做 B 占位（M2）
          { kind: 'placeholder' as const, action: 'free_conversation', label: '去自由对话', href: '/conversation' },
        ],
        completed: { required_done: false, optional_a_done: false, optional_b_done: false, total: '0/3' },
        can_rest: gentleStreak.restDaysLeftThisWeek > 0,
        gentle_streak: gentleStreak,
        low_pressure_mode: true,
      },
      meta: { trace_id, server_time: new Date().toISOString() },
    });
  } catch {
    return jsonError('NW-ST-0001', trace_id);
  }
}
```

### 9.3 主页集成（`src/app/(app)/today/page.tsx` 增量片段，约 50 行）

```tsx
// src/app/(app)/today/page.tsx （增量；不替换现有代码）
// 来自 docs/design/T-06-today-three.md §4.1 + §8.1
import { useEffect, useState } from 'react';

interface TodayResponse {
  data: {
    today: string;
    required: { id: string; code: string; title: string; status: 'recommended' };
    optional: Array<{ id?: string; code?: string; title?: string; kind: 'review' | 'placeholder'; label?: string; href?: string }>;
    completed: { required_done: boolean; optional_a_done: boolean; optional_b_done: boolean; total: string };
    can_rest: boolean;
  };
}

export default function TodayPage() {
  const [today3, setToday3] = useState<TodayResponse['data'] | null>(null);

  useEffect(() => {
    fetch('/api/today-3')
      .then((r) => r.json())
      .then((j: TodayResponse) => setToday3(j.data))
      .catch(() => setToday3(null));
  }, []);

  // 渲染顶部进度条
  const renderTodayProgress = () => {
    if (!today3) return null;
    const { completed, can_rest } = today3;
    const dots = [
      completed.required_done,
      completed.optional_a_done,
      completed.optional_b_done,
    ];
    return (
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">今日 {completed.total}</span>
          <div className="flex gap-1.5" aria-label={`今日完成度 ${completed.total}`}>
            {dots.map((d, i) => (
              <span
                key={i}
                aria-hidden
                className={`h-2 w-2 rounded-full ${d ? 'bg-primary/60' : 'bg-border'}`}
              />
            ))}
          </div>
          <span className="text-xs text-neutral-500">1 件必做 + 2 件选做</span>
        </div>
        {can_rest && (
          <button
            type="button"
            onClick={handleRest}
            className="text-sm text-neutral-500 hover:text-foreground"
            aria-label="今日先休息"
          >
            休整
          </button>
        )}
      </div>
    );
  };

  const handleRest = async () => {
    await fetch('/api/today-3/rest', { method: 'POST' });
    // 触发 /today 重新 fetch
  };

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24">
      <header className="py-6">
        <h1 className="text-2xl font-semibold">今日</h1>
        <p className="mt-1 text-sm text-neutral-500">🌱 练过 12 次 · 3 天的练习 · 可休整 1 天</p>
      </header>
      {renderTodayProgress()}
      {/* 后续: 技能树 + 今天就到这里 */}
    </main>
  );
}
```

> **行数统计**：9.1（80 行）+ 9.2（60 行）+ 9.3（50 行）= **190 行**，**在 200 行预算内**。

---

## 10. 测试用例：5 个核心 case

### 10.1 Case 1 · 必做节点推荐（in_progress 优先）

**目的**：验证 §3.3 状态优先级（in_progress > available > mastered_basic）。

```ts
// tests/today-recommend.test.ts
import { describe, it, expect } from 'vitest';
import { computeRecommended } from '@/lib/today-recommend';

describe('T-06 今日推荐算法', () => {
  it('有 in_progress 时优先推荐', () => {
    const input = {
      skills: [
        { id: 'a', code: 'c1', title: 'A', layer: 'L1' as const, status: 'available' as const, practiced: 0, restDays: 3 },
        { id: 'b', code: 'c2', title: 'B', layer: 'L2' as const, status: 'in_progress' as const, practiced: 0, draftStep: { stepIndex: 5, stepName: '觉察' } },
        { id: 'c', code: 'c3', title: 'C', layer: 'L3' as const, status: 'mastered_basic' as const, practiced: 1, restDays: 2 },
      ],
      gentleStreak: { days: 3, restDaysLeftThisWeek: 1, practicedToday: false },
      lowPressureMode: true,
      today: '2026-06-17',
    };
    const result = computeRecommended(input);
    expect(result?.id).toBe('b');  // in_progress 优先级最高
  });

  it('available 无 rest_days 时优先于 mastered_basic', () => {
    const input = {
      skills: [
        { id: 'a', code: 'c1', title: 'A', layer: 'L1' as const, status: 'available' as const, practiced: 0, restDays: undefined },
        { id: 'b', code: 'c2', title: 'B', layer: 'L2' as const, status: 'mastered_basic' as const, practiced: 1, restDays: 3 },
      ],
      gentleStreak: { days: 3, restDaysLeftThisWeek: 1, practicedToday: false },
      lowPressureMode: true,
      today: '2026-06-17',
    };
    const result = computeRecommended(input);
    expect(result?.id).toBe('a');  // available + rest_undefined = 90 分 vs mastered_basic + rest_3 = 45 分
  });
});
```

### 10.2 Case 2 · 演练完成后进度从 0/3 → 1/3

**目的**：验证 §8.2 已完成反馈（克制版）+ §7.2 done 端点。

```ts
it('演练 step 12 完成后 /today 显示 1/3', async () => {
  // 1) GET /api/today-3 → required = L3-01
  const t0 = await fetch('/api/today-3');
  const { data: d0 } = await t0.json();
  expect(d0.completed.total).toBe('0/3');
  expect(d0.required.code).toBe('workplace-shifting');

  // 2) 模拟演练 step 12 完成（T-04 副作用：节点 mastered_basic + 累计 +1）
  // 实际路径：演练页 → POST /api/conversations/drill/[id]/step (n=12)

  // 3) POST /api/today-3/[id]/done
  const done = await fetch(`/api/today-3/${d0.required.id}/done`, {
    method: 'POST',
    body: JSON.stringify({ data: { id: d0.required.id, code: d0.required.code } }),
  });
  expect(done.status).toBe(200);
  const { data: d1 } = await done.json();
  expect(d1.completed.required_done).toBe(true);
  expect(d1.completed.total).toBe('1/3');
});
```

### 10.3 Case 3 · 今日休整 → 推荐节点降级 + 可休整天数 -1

**目的**：验证 §5.2 休整流程 + §7.3 rest 端点。

```ts
it('点 [休整] 后必做降级 + 休整日 -1', async () => {
  // 1) GET /api/today-3 → can_rest = true
  const t0 = await fetch('/api/today-3');
  const { data: d0 } = await t0.json();
  expect(d0.can_rest).toBe(true);
  expect(d0.gentle_streak.rest_days_left_this_week).toBe(1);

  // 2) POST /api/today-3/rest
  const rest = await fetch('/api/today-3/rest', { method: 'POST' });
  expect(rest.status).toBe(200);
  const { data: d1 } = await rest.json();
  expect(d1.rested).toBe(true);
  expect(d1.gentle_streak.rest_days_left_this_week).toBe(0);
  expect(d1.today_view.label).toBe('今天先休息');
  expect(d1.today_view.required).toBeNull();
});

it('本周休整已用完时 POST /rest 拒绝', async () => {
  // 模拟 restDaysLeftThisWeek = 0
  // POST /api/today-3/rest → 400 + NW-TD-0001
  const r = await fetch('/api/today-3/rest', { method: 'POST' });
  expect(r.status).toBe(400);
  const body = await r.json();
  expect(body.error.code).toBe('NW-TD-0001');
});
```

### 10.4 Case 4 · 完成反馈不显示红字 / 不抖动 / 不闪烁

**目的**：验证 §8.2 已完成反馈克制版（无红字 / 抖动 / flash）。

```ts
it('完成必做后 UI 不引入红字 / 抖动 / 闪烁', async () => {
  // 1) 完成必做（演练 step 12）
  // 2) 跳回 /today
  // 3) 抓取 DOM 验证：
  //    - 无 className 含 'red' / 'danger' / 'shake' / 'flash' / 'pulse-error'
  //    - 顶部"今日 1/3" 文字 color = text-neutral-500（非红）
  //    - 节点状态 = mastered_basic（★ 描边），非"🎉 完成"
  //    - 无 toast / alert "完成！" "胜利！" "你真棒！"
  const { container } = render(<TodayPage />);
  // 完成演练后
  // ... (模拟 fetch return + state)
  expect(container.innerHTML).not.toMatch(/red|danger|shake|flash|完成！|胜利|你真棒/);
});
```

### 10.5 Case 5 · 推荐算法不区分 LPM（LPM 仅影响视觉）

**目的**：验证 §5.3 "LPM 不影响算法选谁"。

```ts
it('LPM ON / OFF 推荐结果一致（算法不区分 LPM）', () => {
  const skills = [
    { id: 'a', code: 'c1', title: 'A', layer: 'L1' as const, status: 'available' as const, practiced: 0, restDays: 3 },
    { id: 'b', code: 'c2', title: 'B', layer: 'L2' as const, status: 'mastered_basic' as const, practiced: 1, restDays: 1 },
  ];
  const gentleStreak = { days: 3, restDaysLeftThisWeek: 1, practicedToday: false };

  const r1 = computeRecommended({ skills, gentleStreak, lowPressureMode: true, today: '2026-06-17' });
  const r2 = computeRecommended({ skills, gentleStreak, lowPressureMode: false, today: '2026-06-17' });
  expect(r1?.id).toBe(r2?.id);  // 算法一致
});
```

### 10.6 5 个 case 覆盖矩阵

| 维度 | Case 1 | Case 2 | Case 3 | Case 4 | Case 5 |
| --- | --- | --- | --- | --- | --- |
| 推荐算法（in_progress / available / mastered_basic） | ✅ | | | | |
| 演练完成反馈 0/3 → 1/3 | | ✅ | | ✅ | |
| 休整流程（rest 端点 + 降级） | | | ✅ | | |
| 完成反馈克制版（无红字 / 抖动） | | | | ✅ | |
| LPM 不影响算法 | | | | | ✅ |
| 错误码（NW-TD-0001） | | | ✅ | | |
| 数据契约（required / optional / completed） | | ✅ | ✅ | | |

> **未覆盖**（follow-up，列入 T-16 Q 评审）：
> - 选做 A 完成态（mastered_basic → mastered_deep）
> - 选做 B 占位（"去自由对话"，M2 阶段**不**计入完成度）
> - 移动端适配（xs < 480px）
> - 限流 429（T-14 部署流水线验证）
> - 跨设备同步（M3）

---

## 11. 风险点

### 11.1 P0 风险（必避）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-01 推荐算法不透明** | 用户不知"为什么是它"，可能产生不信任 | 仅视觉传达（唯一发光），**不**写"系统推荐你..."文字解释；polish P-07 立场 |
| **R-02 顶部"今日 X/3"被读成"任务进度"** | 数字 X/3 会制造"还有 2 件"的暗示 | 文字"今日 X/3"用 `text-neutral-500` 灰色；**不**用主色；**不**显示百分比 |
| **R-03 完成反馈变"胜利 🏆"** | T-04 step 12 完成后若加 toast，会破坏克制原则 | §8.2 明确：仅节点 `mastered_basic` + 顶部进度条第 1 圈颜色变化（静默色），**无**toast / 🎉 / 文字"完成" |
| **R-04 休整日被算成"缺失"** | 静默归零不区分休整 vs 缺失 | T-07 状态机 + §6.4 不变量；本稿仅定义接口 |
| **R-05 推荐节点过多** | 若 LPM OFF + 推荐算法选中多个 → 视觉冲突 | §3.3 全树唯一 `recommended` 强制（polish P-07 落地） |
| **R-06 必做节点完成态与 in_progress 草稿冲突** | 用户暂停演练（in_progress）+ 必做完成（mastered_basic）→ 同一节点同时有 2 个状态标记 | T-01 §3.3 状态机互斥；草稿仅 `in_progress`，完成仅 `mastered_basic`，由 step 12 清除草稿（T-04 §2.4） |

### 11.2 P1 风险（follow-up）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-07 选做 A 与必做同 layer** | 用户 3 件全在 §2 → 视觉单一 | §3.2 `pickReviewCandidate` 优先不同 layer；fallback 同 layer |
| **R-08 选做 B 占位"去自由对话"不计入** | M2 PoC 范围 1/3 永远是必做；用户困惑 | 顶部进度条第 3 圈**永远**灰；hover tooltip "自由对话不计入今日进度" |
| **R-09 休整后 [取消] 入口暴露** | 用户点 [休整] 后 [取消] 是否显示？"取消"是否会鼓励"频繁切换"？ | 本稿建议 [取消] 显示（用户掌控感），但 [休整] 计数仍 -1；M3 评估是否改为"今日不可撤销休整" |
| **R-10 推荐算法基于内存写死** | `today/page.tsx` 数据是内存态，dev server 重启数据丢失 | M2 PoC 接受；M3 接 Supabase `practiced` 表 |
| **R-11 必做完成的副作用触发顺序** | 节点 `mastered_basic`（T-04）+ 进度 1/3（T-06）+ 温和连击 +1（T-07）3 个副作用并发 → 状态不一致 | T-04 §2.4 已定义为"后端 step 12 异步副作用"；前端 GET `/api/today-3` 时序延后 1 轮 |
| **R-12 休整日 LPM OFF 时是否禁用 [休整]** | LPM OFF 时用户可订阅推送；推送 + 休整是否冲突？ | [休整] 永远可达（LPM 与休整独立维度）；推送文案由 T-08 控制 |

### 11.3 P2 风险（远期）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-13 选做 B "知识小卡 / 自定义场景" 上线** | M3 上线时，本稿 placeholder 需要切换 | M3 实施时扩展 `optional[].kind` 枚举 + UI 形态 |
| **R-14 跨设备同步** | M2 阶段仅 localStorage | M3 Supabase + RLS |
| **R-15 推荐算法个性化** | 用户分层（新用户 / 老用户）推荐策略不同 | M3+ 引入"用户分层"维度 |
| **R-16 50% / 100% / 150% 完成度（prototype §5.4）** | M2 范围内**不**引入（避免内卷）；M3 上线时需重新设计视觉 | 本稿**显式不引入**；M3 评估"完成度数字"是否仍有意义 |

---

## 12. 与其他设计稿的接口边界

### 12.1 与 T-01 技能树主页

| 共享 | T-01 期望 | T-06 实现 | 一致 |
| --- | --- | --- | --- |
| 节点 `recommended` 全树唯一 | §3.3 唯一发光规则 | §3.3 推荐算法确保唯一 | ✅ |
| 推荐节点不写"今日"文字（polish P-07） | §3.2 视觉矩阵 | T-06 **不**在推荐节点加任何文字 | ✅ |
| 节点 `mastered_basic` 视觉 | §3.2 金冠 1 颗 | T-06 必做完成态=`mastered_basic`（与 T-01 一致） | ✅ |
| `practiced` 字段 | §5.1 Props | T-06 读 `localStorage.drill_progress.{code}` 增量 | ✅ |
| `draftStep` 字段类型 | T-01 §3.3 `{ stepIndex, stepName }` | T-06 不直接读写 `draftStep`；由 T-03/T-04 写入 | ➖ |
| 顶部状态条位置 | T-01 §7.2 双层方案 | T-06 "今日 X/3" 进度条放在主页 header 下方；**不**侵入 GlobalHeader | ✅ |

### 12.2 与 T-03 / T-04 演练

| 共享 | T-03/T-04 期望 | T-06 实现 | 一致 |
| --- | --- | --- | --- |
| 必做完成 = 演练 step 12 完成 | T-04 §2.4 副作用 | T-06 通过 GET `/api/today-3` 读最新 `completed.total` | ✅ |
| `POST /api/today-3/[id]/done` 校验 `drill_session_id` | — | T-06 §7.2 校验 `drill_session_id` 存在且状态为 `completed` | ✅ |
| 节点 `mastered_basic` 写入 | T-04 §2.4 | T-06 **不**直接写节点；由 T-04 副作用 | ➖ |
| 草稿持久化 | T-03 §2.4 localStorage | T-06 不涉及草稿（属 T-03） | ➖ |
| 步骤 9 收束话术 | T-04 §4.1 | T-06 不涉及（属 T-04） | ➖ |

### 12.3 与 T-07 温和连击 + 休整日

| 共享 | T-07 期望 | T-06 实现 | 一致 |
| --- | --- | --- | --- |
| 读 `gentle_streak` 数据 | T-07 数据源 | T-06 §7.1 响应含 `gentle_streak`；§3.3 算法引用 | ✅ |
| `restDaysLeftThisWeek` | T-07 写入 | T-06 `POST /rest` 调用 T-07 内部 `-1` 逻辑 | ✅ |
| 缺失误归静默（M2 阶段写死） | T-07 状态机 | T-06 算法引用但不实做 | ➖ |
| 休整日 = "不连续也不断签" | T-07 §6.4 | T-06 §6.4 不变量 | ✅ |

### 12.4 与 T-08 低压力模式 + 推送

| 共享 | T-08 期望 | T-06 实现 | 一致 |
| --- | --- | --- | --- |
| 读 `low_pressure_mode` | T-08 数据源 | T-06 §7.1 响应含 `low_pressure_mode`；§5 视觉降级 | ✅ |
| LPM Toggle 化 | T-08 实施 | T-06 **不**实做 Toggle；引用占位 | ➖ |
| 推送默认全关（B2） | T-08 实施 | T-06 不涉及推送 | ➖ |

### 12.5 与 T-09 危机兜底

| 共享 | T-09 期望 | T-06 实现 | 一致 |
| --- | --- | --- | --- |
| `/crisis` 兜底页 | T-09 §6.5 跨页面 | T-06 **不**涉及危机检测（演练路径由 T-04 step 9 触发） | ➖ |
| `data.crisis: true` 透出 | T-09 §8.3.2 | T-06 `/today-3` 端点**不**含危机字段 | ➖ |

### 12.6 与 T-12 我 → 进度

| 共享 | T-12 期望 | T-06 实现 | 一致 |
| --- | --- | --- | --- |
| 顶部温和连击 | T-12 复用 T-07 数据 | T-06 §4.1 复用 T-01 §7 状态条 | ✅ |
| "练过的瞬间 N 次" | T-12 累计 | T-06 §8.2 复用 T-04 §2.4 副作用（practiced +1） | ✅ |
| 5 段旅程地图 | T-12 形态 | T-06 不涉及 | ➖ |

---

## 13. 红线自检（CLAUDE.md §5 + docs/02-Prototype.md §16）

> 对照 `PROJECT_MAP.md` §5 红线 + `docs/02-Prototype.md` §16 拒绝清单。

| 红线 | 本稿情况 | 通过 |
| --- | --- | --- |
| ❌ 心数 / 宝石 / 排行榜 / 打卡天数 / 付费修复 / 催促型推送 | 本稿不引入；"练过 N 次" 来自 T-07，**不**写"坚持 N 天"；无宝石 / 排行 / 打卡天数 | ✅ |
| ❌ "你太软弱 / 你应该 / 你连这都…" | 文案系统遵循 prototype §10 + PE 守则；本稿"今天先休息" / "想练就练" 全部第一人称 | ✅ |
| ❌ 在危机路径给"怎么办"建议 | 本稿**不**涉及危机检测；演练 step 9 触发由 T-04 §4.1 + T-09 §8.3 负责 | ✅ |
| ❌ KB 全文注入 LLM | 本稿**不**调 LLM；推荐算法是纯函数 | ✅ |
| ❌ 完整 history 注入 LLM | 不涉及 LLM | ✅ |
| ❌ 多 Agent 重复消费上下文 | 本稿为单 Agent（FE+BE 联合）调研 + 设计稿，待 Coordinator 审核 | ✅ |
| ❌ 不做安全评审就上线情绪功能 | 本稿为设计稿；上线前必过 Q checklist + gamification-safety-checklist P0 | ✅ |
| ❌ 显示用户 PII | 本稿不涉及用户身份；`/today-3` 端点**不**返回 PII | ✅ |
| §16.3 拒绝清单 grep 自检 | 本稿未引入 `heart` / `lives` / `gem` / `coin` / `leaderboard` / `streak-repair` / 🔴 红字 | ✅ |
| §16.3 推送文案自检 | 本稿不涉及推送文案（T-08 处理） | ✅ |
| §16.2 借鉴与改造 11 条 | 主页是技能树 ✅、今日 1/3 用灰色（非红色）✅、LPM 默认 ON ✅、缺失静默归零（T-07）✅、休整 1-2 天 ✅、无货币 ✅、无排行 ✅、无打卡天数 ✅、"今天就到这里" 永远可达 ✅、累计文案"练过 N 次" ✅、"今日 X/3" 用灰色而非红色 ✅ | ✅ |
| §16.1 拒绝 / 不评判 / 不催促 | 错误码文案"对不上，再试一次。"无评判；无"未完成"红字；无"🎉 完成"绿字 | ✅ |

**结论**：本稿**符合 CLAUDE.md 红线 + docs/02-Prototype.md §16 全部自检项**。

---

## 14. 待 Coordinator 拍板的 3 个开放问题

| # | 问题 | 建议 |
| --- | --- | --- |
| Q1 | 推荐算法是否**仅**返回 1 个 `recommended`（唯一发光），还是允许"高优先级多个但视觉仅 1 个发光"？ | 建议**仅 1 个 `recommended`**（polish P-07 全树唯一发光规则 + 本稿 §3.3 算法强制） |
| Q2 | "今日 X/3" 进度条是否**永远显示**，还是仅在"未完成态"显示？完成 3/3 后是否收起？ | 建议**永远显示**（让用户感知"完成度"是常驻指标；prototype §5.4 "灰色进度条"）；3/3 时仍灰显 |
| Q3 | M2 PoC 阶段是否实做 `POST /api/today-3/rest` 端点？还是仅前端 state 切换？ | 建议**实做后端端点**（轻量 + 0 LLM；为 T-07 留 hook；若仅前端则需 M3 重做后端） |

---

## 15. Follow-up（不属本任务）

1. **T-07**（FE+BE）：温和连击 + 休整日真实数据接入；本稿 §3.3 / §6 / §7.1 / §7.3 引用接口。
2. **T-08**（FE+BE）：低压力模式开关（GlobalHeader Toggle 化）+ 推送控制；本稿 §5 / §7.1 引用接口。
3. **T-12**（FE+BE）：我 → 进度（v2.0 形态：5 段旅程地图 + 练过的瞬间）；复用本稿顶部状态条。
4. **T-15**（PE+Q）：评测集 v0.5 补"今日三件小事"用例 ≥ 10 条（必做推荐 / 选做 A 复习 / 选做 B 占位 / 休整 / 完成反馈克制版）。
5. **T-16**（Q）：红线用例 + 拒绝清单自检；本稿 §10.5 个 case 列入 e2e。
6. **A + BE**：写 ADR-009（Today3 API contract + 推荐算法契约 for Supabase M3 迁移）。
7. **M3**：推荐算法接 Supabase `practiced` 表 + `last_practiced_at`；选做 B 接入知识小卡 / 自定义场景；50% / 100% / 150% 完成度数字（若仍需）。

---

## 16. 与现有文档的双向追溯

| 本稿章节 | 引用源 |
| --- | --- |
| §1 现状 | `src/app/(app)/today/page.tsx` + `src/components/skilltree/SkillNode.tsx` + `docs/02-Prototype.md` v2.0.1 §5.4 / §6.2 |
| §2 信息架构 | `docs/02-Prototype.md` §5.4 + `docs/design/T-01-skill-tree-home.md` §3.2 |
| §3 推荐算法 | `docs/design/T-01-skill-tree-home.md` §3.3 + `docs/research/competitor-research.md` §5 M2/M4 + prototype §16.2 polish |
| §4 主页关系 | `docs/design/T-01-skill-tree-home.md` §5 + §7 + polish P-01 |
| §5 LPM 耦合 | `docs/02-Prototype.md` §5.2 + `rules/safety.md` S-6 + T-08 待写 |
| §6 温和连击耦合 | `docs/02-Prototype.md` §7.6 + §8.3 + `plans/m2-poc.md` T-07 |
| §7 API 契约 | `docs/05-API-Design.md` §3 / §5 / §7 + `docs/design/T-04-drill-backend.md` §3 |
| §8 UI | `docs/02-Prototype.md` §6.2 + §11 + §16 polish + `rules/safety.md` S-6 |
| §9 代码片段 | `src/lib/scenarios-data.ts` + `src/lib/scripts-store.ts` + `src/app/api/scripts/route.ts` pattern |
| §10 测试 | `docs/design/T-04-drill-backend.md` §10 + `docs/07-Test-Plan.md` §19 |
| §11 风险点 | `rules/safety.md` S-1~S-8 + `docs/02-Prototype.md` §16.3 |
| §12 接口边界 | T-01 / T-03 / T-04 / T-07 / T-08 / T-09 / T-12 设计稿 + `plans/m2-poc.md` |
| §13 红线自检 | `CLAUDE.md` §5 + `docs/02-Prototype.md` §16 + `PROJECT_MAP.md` §5 |
| §14 开放问题 | — |
| §15 Follow-up | `plans/m2-poc.md` 任务清单 |

---

## 17. 文档自检

- 不修改 src/ 任何源代码 ✅
- 不启动 dev server / npm test ✅
- 产出物为 markdown 设计稿 ✅
- 关键决策可回溯到 `docs/02-Prototype.md` v2.0.1 + `docs/design/T-01-skill-tree-home.md` + `docs/design/T-03-drill-frontend.md` + `docs/design/T-04-drill-backend.md` + `plans/m2-poc.md` ✅
- 符合 CLAUDE.md 红线 + `docs/02-Prototype.md` §16 全部自检项 ✅
- 5 个核心 case 覆盖：推荐算法 / 完成反馈 / 休整流程 / 克制版反馈 / LPM 不影响算法 ✅
- 关键代码片段 190 行（≤ 200 行预算）✅
- 与 T-01 / T-03 / T-04 / T-07 / T-08 / T-12 数据契约一致 ✅

---

> **变更摘要**（v0.1 2026-06-17）：
> 1. 现状：5 处 polish 已落地（P-01 主页融进技能树 / P-07 推荐不写"今日" / P-09 温和连击 / LPM 默认 ON / "今天就到这里"），数据层缺失
> 2. 信息架构：1 必做 + 2 选做（选做 B M2 占位"去自由对话"）；"今日 X/3"灰色进度条；永远灰色（不红不绿）
> 3. 推荐算法：纯函数；优先级 in_progress > available > mastered_basic；rest_days 加分；gentle_streak 减负；全树唯一 recommended
> 4. 主页关系：必做节点仅在技能树呈现（polish P-01）；顶部"今日 X/3"仅显示完成度（不显示节点名）
> 5. LPM 耦合：LPM **不**影响算法选谁；仅影响视觉（动效 + 发光强度）
> 6. 温和连击耦合：T-06 消费 gentle_streak 数据接口，不实做 streak 内部逻辑
> 7. API 契约：GET `/api/today-3` + POST `/api/today-3/[id]/done` + POST `/api/today-3/rest`；3 个新错误码 NW-TD-0001/0002/0003
> 8. UI：顶部进度条 + [休整] 文字按钮；完成反馈克制版（仅节点状态 + 静默色变化，无 toast / 🎉）
> 9. 代码：3 个片段共 190 行（≤ 200 行预算）
> 10. 测试：5 个核心 case 覆盖矩阵
> 11. 风险点：P0 6 条 / P1 6 条 / P2 4 条
> 12. 3 个开放问题待 Coordinator 拍板
> 13. 红线自检：通过
> 14. Follow-up：T-07 / T-08 / T-12 / T-15 / T-16 + ADR-009 + M3 5 项
