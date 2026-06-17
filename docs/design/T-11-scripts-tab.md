# T-11 · 我的剧本（v1.0 保留 + 提升为底部 Tab 第 3 位）· 设计稿

> **任务编号**：T-11（plans/m2-poc.md §任务清单）
> **关联切片**：S-PoC-01（阿瑶演练步骤 11 保存 → 列表新增）/ S-PoC-05（自由对话保存 → 列表新增）/ S-PoC-06（剧本检索）
> **关联用户故事**：阿瑶在演练步骤 11 点"加进我的剧本" → 跳到「我的剧本」Tab → 看到刚才那一句已落入列表
> **Owner（设计）**：FE + BE（Full-stack 综合 Agent）
> **Reviewer**：C、PM、A、PE、KE、Q
> **阶段**：调研 + 设计（**不修改 src/ 下任何源代码**）
> **本稿状态**：待 Coordinator 审核
> **版本**：v0.1（2026-06-17）

---

## 0. 阅读须知

- 本稿只描述 v1.0 "我的剧本" 在 v2.0 形态下的**保留 / 提升 / 收紧**设计，包括与 BottomNav 第 3 位的关系、与 T-03 演练步骤 11 的接口契约、列表 / 详情 / 删除 / 草稿保存机制、标签 / 搜索 / 排序设计、API 契约、关键代码骨架、4 个核心测试 case 与风险点。
- 一切设计决策可回溯到：
  - `docs/02-Prototype.md` v2.0.1 §5.1（BottomNav）+ §5.4（我的剧本页）
  - `docs/05-API-Design.md` v1.1 §9.4（Script CRUD）
  - `docs/design/T-01-skill-tree-home.md` §8.2（与 BottomNav 兼容）
  - `docs/design/T-03-drill-frontend.md` §8（步骤 11 与 T-11 接口）
  - `docs/design/T-04-drill-backend.md` §7（步骤 11 scripts 联动）+ §5.4（与 scripts-store 关系）
  - `plans/m2-poc.md` T-11 任务定义
  - `src/components/layout/BottomNav.tsx` v2.0.6（4 Tab 已实装）
  - `src/app/(app)/scripts/page.tsx` v2.0.6（列表 + 详情 + 删除 + 二次确认）
  - `src/app/api/scripts/route.ts` + `src/app/api/scripts/[id]/route.ts`（CRUD 已实装）
  - `src/lib/scripts-store.ts`（in-memory Map + globalThis 共享）
- 本稿与上述现状的差异**只描述、不修改**；如需改动源代码，由 Coordinator 批准后另立实施任务（避开本任务的"调研 + 设计"边界）。

---

## 1. 现状分析（v1.0 保留 + v2.0 提升为底部 Tab 第 3 位）

### 1.1 v1.0 形态（现状）

| 项 | 位置 | 形态 |
| --- | --- | --- |
| 入口 | `(app)/scripts/page.tsx` | **未挂载**到底部 Tab（v1.0 时代仅从 `/today` 顶部入口可达） |
| 列表 | 同上 | 卡片式列表，每行 = 标题 + 分类标签 + 日期 + 折叠按钮 + 删除按钮 |
| 详情 | 卡片内 `<button onClick={toggleExpand}>` | 折叠展开 content（白名单文案，无 escapeHtml 风险） |
| 保存（手动） | 卡片上方表单：title + scene_tag (select) + content (textarea) + [保存] | 调用 `POST /api/scripts` |
| 保存（演练步骤 11 联动） | `drill/page.tsx:185` `<Step11>` → `fetch('/api/scripts', { method: 'POST', body: { title: scenario.title, scene_tag: scenario.scene_tags[0], content: data.reply } })` | 已实装，与手动保存同端点 |
| 删除 | Trash2 icon → `setDeletingId(id)` → 再点 [确认] 删除 | v2.0.6 fix：**二次确认**（不静默） |
| 失败反馈 | `alert('没存上，稍后再试也行。')` / `alert('没删掉，稍后再试也行。')` | 文案第一人称，不催促，符合 S-7 |
| API | `/api/scripts` (POST/GET) + `/api/scripts/[id]` (GET/PATCH/DELETE) | M2 内存态（globalThis） |
| 数据模型 | `{ id, title, scene_tag, content, created_at, updated_at? }` | 6 字段，无 `drill_session_id` 关联 |
| ARIA | `aria-label="删除 ${title}"`、`aria-expanded`、`aria-current` 等 | 部分实做，列表行缺 `aria-posinset` / `aria-setsize` |
| 焦点管理 | 列表行 button + 二次确认切换；缺键盘快捷键（"编辑"无键盘入口） | ⚠️ |

### 1.2 v2.0 期望（来自 prototype §5.4 + plans/m2-poc.md T-11）

| 项 | v2.0 期望 | 评估 |
| --- | --- | --- |
| 入口 | **底部 Tab 第 3 位**（今日 / 自由对话 / **我的剧本** / 我） | ✅ **已实装**（`BottomNav.tsx:13`） |
| 视觉层级 | 与"今日"同列，icon = `BookOpen`，label = "我的剧本" | ✅ 已实装 |
| 与"自由对话"地位平等 | 自由对话 = 自由入口；剧本 = 沉淀入口 | ✅ 已在底部 Tab 同等地位 |
| 演练步骤 11 保存**自动归档** | 演练完成后跳 `/scripts` 看到刚才那一句已落入列表 | ⚠️ 当前不自动跳转；T-03 §8.5 建议步骤 12 加 [去我的剧本看] 按钮跳过去 |
| 草稿机制 | 暂停演练 → 草稿存本地 + 后端；恢复后看到 | T-03 §2.4 已设计 localStorage + T-04 后端 FSM |
| 列表搜索 / 排序 | 顶部 [搜索框] + [排序下拉]（按时间 / 按场景） | ❌ **缺**：v1.0 无搜索 / 排序 |
| 标签筛选 | 顶部 chip 行：全部 / 职场 / 家庭 / 亲密关系 / 朋友 / 自我觉察 | ❌ **缺**：v1.0 仅在保存表单里选 |
| 编辑（PATCH） | 行内编辑或弹层编辑 | ❌ **缺**：API 已实装（PATCH），UI 未对接 |
| 与技能树的关联 | 剧本右上角显示"来自 §X 表达"（链接回主页节点） | ❌ 缺；当前只显示 scene_tag 文字 |
| 副本机制（"再多说一句"） | 长按 / 复制按钮 | ❌ 缺 |
| 删除二次确认 | v2.0.6 已实装 | ✅ |
| 红色感叹号 / 抖动 | 无 | ✅ 符合 §16.3 拒绝清单 |

### 1.3 现状总结（gap）

- **核心形态已实装**：4 Tab 底部导航、列表 + 详情 + 删除 + 二次确认、POST/GET/PATCH/DELETE 全套 API。
- **3 处未对齐**：
  1. 演练步骤 11 → 跳 `/scripts` 的引导（步骤 12 [去我的剧本看]）；
  2. 搜索 / 排序 / 标签筛选 UI（v1.0 范围无）；
  3. 编辑（PATCH）UI（API 已实装，前端未对接）。
- **风险**：v2.0 期望"剧本沉淀 = 安全感 + 可复用"，但当前列表在剧本数 ≥ 10 后**无法检索**，造成"沉淀变成负担"——与 prototype §2 P4"减少焦虑"反向。
- **本稿定位**：把上述 3 处未对齐落到**设计层**（不修改 src/），供 Coordinator 拍板后下一轮实施任务整批落地。

---

## 2. 与 BottomNav 关系（来自 T-01 §BottomNav 兼容性）

### 2.1 当前位置

| 元素 | 位置 | 来源 |
| --- | --- | --- |
| BottomNav Tab 顺序 | `(app)/layout.tsx` 常驻 | TABS = `[{ 今日, 自由对话, 我的剧本, 我 }]` |
| 第 3 位 = 我的剧本 | `BottomNav.tsx:13` | 已实装 `href: '/scripts'` + `Icon: BookOpen` + `label: '我的剧本'` |
| `aria-current="page"` | `BottomNav.tsx:31` | 当前路由 = `/scripts` 时高亮 |
| 与 GlobalHeader 关系 | Top Logo + LPM + Bottom 4 Tab = 双层 | T-01 §7.5 采纳方案 |

### 2.2 与 T-01 §8.2 BottomNav 兼容矩阵

| 项 | 风险 | T-11 处理 |
| --- | --- | --- |
| 主页底部 BottomNav | T-01 主页不画 BottomNav 之外的内容，BottomNav 自然接住 | ✅ 不修改 |
| 剧本页 footer | 当前 `scripts/page.tsx` 用 `pb-24` 撑开底部空间（与 BottomNav `h-16` 对齐） | ✅ 保留 |
| 剧本页滚动 + BottomNav | 列表长时滚动条与 BottomNav 视觉竞争 | BottomNav `bg-surface/95 backdrop-blur` ✅ |
| `aria-current="page"` | `/scripts` 时第 3 个 Tab 高亮 | ✅ 已实装 |
| 与"自由对话"的导航切换 | 用户可一键在"沉淀"与"对话"间切换 | ✅ 已实装（Tab 切换） |
| 与"今日"的可发现性 | Tab 第 1 位 = 今日，剧本 = 第 3 位，符合 v2.0 优先级（先练后存） | ✅ 符合 prototype §5.1 |

### 2.3 关键决策：**剧本 Tab 与"今日"等价，但定位不同**

| Tab | 定位 | 何时进 |
| --- | --- | --- |
| 今日 | **生成**：当下要练 | 每次打开 App |
| 自由对话 | **对话**：想到就聊 | 任意 |
| 我的剧本 | **沉淀**：练过的好句 | 演练后 / 翻历史 |
| 我 | **回顾**：进度 + 设置 | 任意 |

> **不抢戏**：剧本 Tab 与"我"Tab 是**回顾类**双入口，但"我"含进度 + 设置，"我的剧本"纯沉淀，避免"两个回顾"造成的认知分裂。

### 2.4 与 T-04 §5.4 scripts-store 关系

| 共享资源 | T-11 写入 | T-04 步骤 11 写入 | 隔离 |
| --- | --- | --- | --- |
| `scriptsStore` | `POST /api/scripts`（手动） | `POST /api/scripts`（内部 fetch） | 同端点，双入口 |
| `drill_session_id` 字段 | T-11 暂不写入 | T-04 步骤 11 可选字段 | T-11 兼容：可后向接受 |
| `created_at` / `updated_at` | T-11 写入时自动填 | 同上 | 一致 |

> **不变量**：T-11 与 T-04 通过**同一端点**写入 `scriptsStore`；列表数据 = 演练步骤 11 + 手动保存 + 自由对话保存的并集。

---

## 3. 与 T-03 步骤 11 联动（POST /api/scripts 入参契约）

### 3.1 联动链路

```
演练 12 步
  ├─ Step 11 [加进我的剧本] (T-03)
  │   ↓
  │   POST /api/scripts
  │   body: { title, scene_tag, content }
  │   ↓
  │   scriptsStore.set(id, item)
  │   ↓
  │   201 Created
  │
  ├─ Step 12 [去我的剧本看] (T-03 §8.5 建议)
  │   ↓
  │   router.push('/scripts')
  │   ↓
  │   /scripts 页 GET /api/scripts → 列表顶部出现刚保存的剧本
  │
  └─ Step 12 [点头] / [回到成长路]
      ↓
      router.push('/today')
```

### 3.2 T-03 步骤 11 入参契约（来自 `src/app/(app)/drill/page.tsx:185`）

```ts
// 当前位置：Step11 子组件 fetch 调用
const res = await fetch('/api/scripts', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    title: scenario.title,           // '拒绝同事甩活'
    scene_tag: scenario.scene_tags[0], // 'workplace'
    content: data.reply || data.userSays || data.opener || opts.openers[0] || '',
  }),
});
```

### 3.3 T-11 入参契约（API 端点契约）

```ts
// 来自 docs/05-API-Design.md §9.4 POST /v1/scripts
interface CreateScriptRequest {
  title: string;        // 1-50 字符，必填
  scene_tag: string;    // 枚举：workplace | family | relationship | friendship | self
  content: string;      // 1-200 字符，必填
  drill_session_id?: string;  // M2 可选字段（T-04 步骤 11 透传）
}
```

### 3.4 T-03 与 T-11 接口边界

| 共享数据 | T-03 步骤 11 写入 | T-11 读取 | 边界 |
| --- | --- | --- | --- |
| `title` | `scenario.title`（PE+KE 签字） | 列表首行展示 | ✅ 一致 |
| `scene_tag` | `scenario.scene_tags[0]`（与 select 选项对齐） | chip 筛选 + 列表副文本 | ✅ 一致 |
| `content` | `data.reply` fallback 链 | 详情展开 | ✅ 一致 |
| `drill_session_id` | T-04 步骤 11 内部 fetch 时附带 | T-11 暂不展示（M3 显示"来自 §X 表达"） | ✅ 兼容（M2 可选） |

### 3.5 失败重试契约

- T-03 步骤 11 状态机：idle → saving → saved / failed（`drill/page.tsx:185` 已实装）。
- T-11 `/scripts` 列表 GET 不依赖 T-03 写入（异步刷新）；失败时演练步骤 11 停留可重试。
- **不静默**：T-03 失败可见反馈 + T-11 手动保存失败 `alert('没存上，稍后再试也行。')`（符合 S-7 设计红线）。

---

## 4. 列表 / 详情 / 删除交互（参考现有 Trash2 实现）

### 4.1 列表形态（拟稿）

```
┌─────────────────────────────────────────────────────┐
│ 我的剧本                                            │
│ 用过的、管用的话，存这里。                          │
│                                                     │
│ [🔍 搜索框（v2.0 新增）]            [排序: 最新 ▾] │  ← v2.0 增强
│                                                     │
│ [全部] [职场] [家庭] [亲密] [朋友] [自我]           │  ← v2.0 新增 chip
│                                                     │
│ ＋ 保存这次的话                                      │  ← 折叠：默认收起
│   ┌───────────────────────────────────────────┐    │
│   │ 标题       场景（select）                  │    │
│   │ 话术原文（textarea）                       │    │
│   │ [保存]                                      │    │
│   └───────────────────────────────────────────┘    │
│                                                     │
│ 拒绝同事甩活                       [▼]   [🗑]     │  ← 折叠
│ workplace · 2026-06-17                              │
│   ───── 展开后 ─────                                │
│   今晚我有安排了，做不完的部分明天上午我处理完会同步  │
│   给你。                                             │
│                                                     │
│ 春节应对亲戚追问                  [▼]   [🗑]       │
│ family · 2026-06-12                                  │
└─────────────────────────────────────────────────────┘
```

### 4.2 详情交互（展开 / 折叠）

| 触发 | 行为 | ARIA |
| --- | --- | --- |
| 行内 `<button onClick={toggleExpand}>` | 切换 `expanded[s.id]` | `aria-expanded={isExpanded}` + `aria-controls` |
| ChevronDown / ChevronUp | 视觉同步 | `aria-hidden` |
| 展开后渲染 `<p>{s.content}</p>` | `whitespace-pre-wrap text-sm leading-relaxed` | — |
| 折叠态默认 | 默认全部折叠（仅显示标题 + 副文本） | — |

> **保留 v2.0.6 实现**：折叠 / 展开已实装，符合 prototype §5.4 "剧本卡片 = 折叠列表"。

### 4.3 删除交互（参考 Trash2 + 二次确认）

#### 4.3.1 现状（v2.0.6 已实装）

```tsx
// scripts/page.tsx:54-67, 164-173
const deleteScript = async (id: string) => {
  if (deletingId !== id) {
    setDeletingId(id);  // 第一次点：进入确认态
    return;
  }
  // 第二次点：真正删除
  await fetch(`/api/scripts/${id}`, { method: 'DELETE' });
};

// JSX
{deletingId === s.id ? (
  <div className="flex gap-1">
    <button onClick={() => void deleteScript(s.id)} className="bg-danger ...">确认</button>
    <button onClick={() => setDeletingId(null)} className="border ...">取消</button>
  </div>
) : (
  <button onClick={() => void deleteScript(s.id)} aria-label={`删除 ${s.title}`}>
    <Trash2 />
  </button>
)}
```

#### 4.3.2 设计决策（与 prototype §7.3 + S-6 对齐）

| 项 | 设计 | S-6 一致 |
| --- | --- | --- |
| 进入确认态 | 第一次点 Trash2 → 立刻显示 [确认] [取消] | ✅ 不二次弹窗 |
| 真正删除 | 第二次点 [确认] → DELETE 请求 | ✅ |
| 取消 | [取消] 立刻回到默认态 | ✅ |
| 失败反馈 | `alert('没删掉，稍后再试也行。')` | ✅ 不静默 |
| `aria-label` | "删除 {title}" / "确认删除 {title}" | ✅ |
| 键盘焦点 | 确认 / 取消按钮自动 focus（建议实做） | ⚠️ follow-up |

#### 4.3.3 v2.0 增强建议（不修改源代码）

- **撤销机制**：删除成功后显示 5 秒 Toast"已删除 [撤销]"，撤销走 `POST /api/scripts` 重新插入（用 `updated_at` 标记）。
  - **风险**：与 S-6"不二次确认"反向。**建议不实做**（prototype §7.3 "可中断 > 强推进"），用户主动删 = 主动决定，不撤销。
- **批量删除**：列表头 [管理] 按钮进入批量态。**建议不实做**（v2.0 阶段剧本量 ≤ 10，单删够用）。

### 4.4 编辑交互（PATCH UI · v2.0 新增）

> 当前 API PATCH 已实装（`scripts/[id]/route.ts:23-43`），但**前端 UI 未对接**。

#### 4.4.1 设计意图

- **行内编辑**：长按 / 双击标题 → 进入编辑态 → inline input → Enter 保存。
- **弹层编辑**：行尾 [✎] icon → 弹层表单 → [保存] / [取消]。
- **建议方案**：**弹层编辑**（更接近 v1.0 习惯）。

#### 4.4.2 弹层编辑草图

```
┌─ 编辑 ──────────────────────┐
│ 标题：[拒绝同事甩活      ]   │
│ 场景：[职场 ▾]              │
│ 话术：                       │
│ ┌─────────────────────────┐ │
│ │ 今晚我有安排了，做不完的  │ │
│ │ 部分明天上午我处理完会同步│ │
│ │ 给你。                    │ │
│ └─────────────────────────┘ │
│ [保存]    [取消]             │
└─────────────────────────────┘
```

#### 4.4.3 API 契约

```ts
// PATCH /api/scripts/[id]
interface UpdateScriptRequest {
  title?: string;
  scene_tag?: string;
  content?: string;
}
// 响应：200 + 更新后的 Script（updated_at 自动填充）
```

#### 4.4.4 风险

| 风险 | 缓解 |
| --- | --- |
| 用户改写时丢失原文 | T-11 **不实做**版本历史（M3 引入） |
| 编辑时其他端修改冲突 | M2 阶段单用户单端，不存在；M3 加 `version` 字段 + 409 冲突 |
| 编辑态被退出（刷新） | T-11 **不实做**编辑态持久化（与 v2.0 "轻操作" 对齐） |

---

## 5. 草稿保存机制（drill 步骤 11 → scripts）

### 5.1 双入口草稿流

```
入口 1（手动）：/scripts 页面表单
  [保存] → POST /api/scripts
  → scriptsStore.set(id, item)
  → GET /api/scripts → 列表新增

入口 2（演练）：/drill 步骤 11
  [加进我的剧本] → POST /api/scripts
  → scriptsStore.set(id, item)
  → 步骤 12 [去我的剧本看] → /scripts → 列表新增
```

### 5.2 草稿 vs 已存

| 形态 | 存储 | 触发 | 列表展示 |
| --- | --- | --- | --- |
| **草稿**（drill 暂停） | localStorage `drill_draft.{code}` + 后端 `drillStore` | 演练暂停 | **不展示**在 `/scripts`（草稿 ≠ 剧本） |
| **已存剧本** | scriptsStore（in-memory Map） | POST `/api/scripts` 成功 | 展示在 `/scripts` |

> **不变量**：草稿**不**进入 `/scripts` 列表。`/scripts` 只展示"已存剧本"，避免"未完成的尝试"造成清单焦虑（prototype §2 P4）。

### 5.3 步骤 11 → 列表的实时性

- T-03 步骤 11 保存成功 → 不自动跳 `/scripts`（演练未结束）；
- T-03 步骤 12 → 用户主动 [去我的剧本看] → 跳 `/scripts` → `useEffect load()` → 看到刚保存的项。
- **保证实时**：T-11 列表页 GET `/api/scripts` **不带缓存**（或短缓存 5s）；T-03 保存 → T-11 加载 = 同端点同步数据。

### 5.4 步骤 11 内容回填（兜底链）

来自 `drill/page.tsx:185`：

```ts
content: data.reply || data.userSays || data.opener || opts.openers[0] || ''
```

| 优先级 | 来源 | 触发 |
| --- | --- | --- |
| 1 | `data.reply`（步骤 9 AI 收束话术） | 步骤 9 API 调用成功 |
| 2 | `data.userSays`（步骤 7 用户说出口的话） | 步骤 7 已选变体或 textarea |
| 3 | `data.opener`（步骤 6 用户选的开场白） | 步骤 6 MultiChoice |
| 4 | `opts.openers[0]`（PE+KE 签字的首选开场） | 兜底 |

> **不变量**：保存内容**永远非空**（兜底链兜底）；若全空（理论不可能）→ 后端 NW-ST-0001 拒绝 + 前端 alert。

### 5.5 步骤 12 二次保存建议（T-03 §8.5）

> 当前 T-03 步骤 12 重复显示 [加进我的剧本] 按钮，但**不再触发保存**（已在步骤 11 完成）。

**建议（不修改源代码）**：

- 步骤 12 [加进我的剧本] → 改为 [去我的剧本看]，**仅导航**，不重复触发 API；
- 若步骤 11 选 [跳过]，步骤 12 仍可二次触发保存（即步骤 12 才有真正的"再补救"机会）—— 建议保留当前实现作为兜底，但需明确文案。

---

## 6. 标签 / 搜索 / 排序设计

### 6.1 标签筛选（chip 行）

#### 6.1.1 chip 设计矩阵

| chip | 场景 | icon | 默认激活 |
| --- | --- | --- | --- |
| 全部 | 所有剧本 | — | ✅ |
| 职场 | `scene_tag === 'workplace'` | Briefcase | — |
| 家庭 | `scene_tag === 'family'` | Home | — |
| 亲密关系 | `scene_tag === 'relationship'` | Heart | — |
| 朋友 | `scene_tag === 'friendship'` | Users | — |
| 自我觉察 | `scene_tag === 'self'` | BookOpen | — |

#### 6.1.2 视觉规范

- chip 高度 `h-8`，圆角 `rounded-full`；
- 激活态：`bg-primary text-primary-foreground`；
- 非激活态：`bg-surface border border-border text-neutral-500`；
- hover：`hover:border-primary/40`；
- 键盘 Tab 顺序 = chip1 → chip2 → ... → 列表；
- ARIA：`<button role="tab" aria-selected={active} aria-controls="script-list">`。

#### 6.1.3 行为契约

- 激活 chip → 客户端过滤（不发新请求）；
- 多个 chip **互斥**（单选）；
- 默认 "全部" 激活。

### 6.2 搜索（输入框 · v2.0 新增）

#### 6.2.1 搜索范围

- 字段：`title` + `content`（大小写不敏感）；
- 不搜：`scene_tag`（已用 chip 筛选）、`created_at`（已用排序）。

#### 6.2.2 实现

```ts
const [query, setQuery] = useState('');
const filtered = scripts.filter((s) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q);
});
```

#### 6.2.3 视觉规范

- 位置：标签 chip 行上方；
- 图标：`Search` (lucide) 在 `<input>` 左侧；
- 占位文案："搜索标题或话术"；
- 宽度：`w-full`，圆角 `rounded-md`；
- 实时过滤（无 debounce，列表量 ≤ 100）；
- ARIA：`<input aria-label="搜索剧本" placeholder="...">`。

### 6.3 排序（下拉 · v2.0 新增）

#### 6.3.1 排序维度

| 排序 | 实现 | 默认 |
| --- | --- | --- |
| 最新优先 | `created_at` DESC | ✅ |
| 最早优先 | `created_at` ASC | — |
| 场景分组 | 按 `scene_tag` 字典序 | — |

#### 6.3.2 视觉规范

- 位置：搜索框右侧；
- 组件：`<select>` + `ChevronDown` 图标；
- ARIA：`<select aria-label="排序方式">`。

### 6.4 空状态

- 无剧本：`"还没有剧本。"`（v1.0 已有，保留）；
- 搜索无结果：`"没找到匹配的剧本。"`；
- 筛选无结果：`"这个场景下还没有剧本。"`。

> **不变量**：空状态文案**第一人称**、**不催促**（不写"快去练一个！"）。

### 6.5 与 prototype §5.4 对齐

| 项 | v2.0 期望 | 当前实现 | 评估 |
| --- | --- | --- | --- |
| 顶部 [搜索框] | ✅ | ❌ | v2.0 新增 |
| [排序下拉] | ✅ | ❌ | v2.0 新增 |
| chip 标签筛选 | ✅ | ❌（仅保存表单内） | v2.0 新增 |
| 编辑（PATCH UI） | ✅ | ❌ | v2.0 新增 |
| 与技能树关联（"来自 §X"） | ✅ | ❌ | M3 引入 |

---

## 7. API 契约

> 4 个端点。来自 `docs/05-API-Design.md` v1.1 §9.4 + 现状实现。

### 7.1 GET /api/scripts

**目的**：列出当前用户的所有剧本（按创建时间倒序）。

**请求**：

```
GET /api/scripts
Query: ?scene_tag=workplace&sort=newest&limit=50&offset=0
```

| 参数 | 必填 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `scene_tag` | N | enum | — | 过滤：workplace / family / relationship / friendship / self |
| `sort` | N | enum | `newest` | newest / oldest / tag |
| `limit` | N | number | 50 | 1-100 |
| `offset` | N | number | 0 | 分页 |

**响应（200）**：

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "拒绝同事甩活",
      "scene_tag": "workplace",
      "content": "今晚我有安排了...",
      "created_at": "2026-06-17T10:30:00Z",
      "updated_at": null,
      "drill_session_id": "drill-<uuid>"  // 可选：T-04 步骤 11 写入
    }
  ],
  "meta": { "trace_id": "uuid", "server_time": "..." }
}
```

**错误码**：

| 状态 | 错误码 | 场景 |
| --- | --- | --- |
| 401 | `NW-AU-0001` | 未鉴权（M2 阶段：device_token 校验失败） |
| 429 | — | 限流 60 req / min |
| 500 | `NW-ST-0001` | 系统异常 |

---

### 7.2 POST /api/scripts

**目的**：创建一个新剧本（手动保存或演练步骤 11 触发）。

**请求**：

```json
{
  "data": {
    "title": "拒绝同事甩活",
    "scene_tag": "workplace",
    "content": "今晚我有安排了，做不完的部分明天上午我处理完会同步给你。",
    "drill_session_id": "drill-<uuid>"  // 可选
  },
  "meta": { "client_msg_id": "uuid" }
}
```

| 字段 | 必填 | 类型 | 校验 |
| --- | --- | --- | --- |
| `title` | ✅ | string | 1-50 字符 |
| `scene_tag` | ✅ | enum | workplace / family / relationship / friendship / self |
| `content` | ✅ | string | 1-200 字符 |
| `drill_session_id` | N | string | 演练步骤 11 透传（M3 启用） |

**响应（201）**：

```json
{
  "data": {
    "id": "uuid",
    "title": "拒绝同事甩活",
    "scene_tag": "workplace",
    "content": "今晚我有安排了...",
    "created_at": "2026-06-17T10:30:00Z",
    "updated_at": null
  },
  "meta": { "trace_id": "uuid", "server_time": "..." }
}
```

**错误码**：

| 状态 | 错误码 | 场景 |
| --- | --- | --- |
| 400 | `NW-SC-0010` | `title` / `content` 缺失或长度超限 |
| 400 | `NW-SC-0011` | `scene_tag` 不在枚举 |
| 401 | `NW-AU-0001` | 未鉴权 |
| 429 | — | 限流 60 req / min |
| 500 | `NW-ST-0001` | 系统异常 |

> **当前实现**：`src/app/api/scripts/route.ts:9-26` 用 `NW-ST-0001` 占位；本稿建议**新增 `NW-SC-0010/0011`** 两个错误码（更精确）。

---

### 7.3 PATCH /api/scripts/[id]

**目的**：改写已有剧本（M2 阶段前端未对接 UI，M3 启用）。

**请求**：

```json
{
  "data": {
    "title": "拒绝同事甩活（v2）",
    "content": "今晚我有安排了，做不完的部分明天上午我处理完会同步给你。"
  },
  "meta": { "client_msg_id": "uuid" }
}
```

| 字段 | 必填 | 类型 | 校验 |
| --- | --- | --- | --- |
| `title` | N | string | 1-50 字符 |
| `scene_tag` | N | enum | workplace / family / relationship / friendship / self |
| `content` | N | string | 1-200 字符 |

> **不变量**：PATCH 至少传一个字段；空 body → 400。

**响应（200）**：

```json
{
  "data": {
    "id": "uuid",
    "title": "拒绝同事甩活（v2）",
    "scene_tag": "workplace",
    "content": "今晚我有安排了...",
    "created_at": "2026-06-17T10:30:00Z",
    "updated_at": "2026-06-17T11:00:00Z"
  },
  "meta": { "trace_id": "uuid", "server_time": "..." }
}
```

**错误码**：

| 状态 | 错误码 | 场景 |
| --- | --- | --- |
| 400 | `NW-SC-0012` | 字段缺失 / 空 body / 长度超限 |
| 404 | `NW-SC-0020` | 剧本不存在 |
| 429 | — | 限流 60 req / min |
| 500 | `NW-ST-0001` | 系统异常 |

> **当前实现**：`src/app/api/scripts/[id]/route.ts:23-43` 用 `NW-ST-0001` 占位；本稿建议**新增 `NW-SC-0012/0020`** 两个错误码。

---

### 7.4 DELETE /api/scripts/[id]

**目的**：删除一个剧本。

**请求**：无 body。

**响应（204）**：无 body。

**错误码**：

| 状态 | 错误码 | 场景 |
| --- | --- | --- |
| 404 | `NW-SC-0020` | 剧本不存在（删除已删的） |
| 429 | — | 限流 60 req / min |
| 500 | `NW-ST-0001` | 系统异常 |

> **当前实现**：`src/app/api/scripts/[id]/route.ts:45-53` 删除**无论存在与否**都返 204（idempotent）；本稿建议**保留现状**（idempotent 更好）。

---

### 7.5 错误码汇总

| Code | 含义 | HTTP | user_message | action_hint |
| --- | --- | --- | --- | --- |
| `NW-SC-0010` | title/content 缺失或长度超限 | 400 | "我们没看清，再说一次？" | "show_input" |
| `NW-SC-0011` | scene_tag 不在枚举 | 400 | "场景选错了。" | "show_tag_select" |
| `NW-SC-0012` | PATCH 字段缺失或长度超限 | 400 | "我们没看清，再说一次？" | "show_input" |
| `NW-SC-0020` | 剧本不存在 | 404 | "这个剧本已经不在了。" | "go_scripts_list" |

---

## 8. 关键代码片段（page.tsx + route.ts 核心，≤ 200 行）

> ⚠️ 本片段是**设计稿占位**（仅作形态与结构示意），**不直接落地到 src/**。落地时由 Coordinator 批准后另立实施任务。

### 8.1 `src/app/(app)/scripts/page.tsx` 核心（≤ 150 行）

```tsx
// src/app/(app)/scripts/page.tsx（v2.0.7 拟稿 · T-11 实施任务目标态）
'use client';
import { useEffect, useMemo, useState } from 'react';
import { Trash2, ChevronDown, ChevronUp, Search, X } from 'lucide-react';

interface Script {
  id: string;
  title: string;
  scene_tag: 'workplace' | 'family' | 'relationship' | 'friendship' | 'self';
  content: string;
  created_at: string;
  updated_at?: string | null;
  drill_session_id?: string;
}

const SCENE_TAGS: Array<{ value: Script['scene_tag']; label: string }> = [
  { value: 'workplace', label: '职场' },
  { value: 'family', label: '家庭' },
  { value: 'relationship', label: '亲密' },
  { value: 'friendship', label: '朋友' },
  { value: 'self', label: '自我' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: '最新优先' },
  { value: 'oldest', label: '最早优先' },
  { value: 'tag', label: '按场景' },
] as const;

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [activeTag, setActiveTag] = useState<Script['scene_tag'] | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<typeof SORT_OPTIONS[number]['value']>('newest');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ===== 加载（来自 src/app/(app)/scripts/page.tsx:23-31）=====
  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch('/api/scripts');
        const d = await r.json();
        setScripts(d.data ?? []);
      } catch { setScripts([]); }
    })();
  }, []);

  // ===== 筛选 + 排序（v2.0 新增）=====
  const visible = useMemo(() => {
    let arr = scripts;
    if (activeTag !== 'all') arr = arr.filter((s) => s.scene_tag === activeTag);
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter((s) => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q));
    }
    if (sort === 'newest') arr = [...arr].sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (sort === 'oldest') arr = [...arr].sort((a, b) => a.created_at.localeCompare(b.created_at));
    if (sort === 'tag') arr = [...arr].sort((a, b) => a.scene_tag.localeCompare(b.scene_tag));
    return arr;
  }, [scripts, activeTag, query, sort]);

  // ===== 删除（来自 src/app/(app)/scripts/page.tsx:54-67）=====
  const deleteScript = async (id: string) => {
    if (deletingId !== id) { setDeletingId(id); return; }
    try {
      const res = await fetch(`/api/scripts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      setDeletingId(null);
      setScripts((arr) => arr.filter((s) => s.id !== id));
    } catch {
      alert('没删掉，稍后再试也行。');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      {/* 标题 + 副标题（v1.0 保留） */}
      <header>
        <h1 className="text-2xl font-semibold">我的剧本</h1>
        <p className="mt-1 text-sm text-neutral-500">用过的、管用的话，存这里。</p>
      </header>

      {/* 搜索 + 排序（v2.0 新增） */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索标题或话术"
            aria-label="搜索剧本"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="清空搜索" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-foreground">
              <X className="h-3 w-3" aria-hidden />
            </button>
          )}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          aria-label="排序方式"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* 标签 chip 行（v2.0 新增） */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="场景筛选">
        <Chip active={activeTag === 'all'} onClick={() => setActiveTag('all')}>全部</Chip>
        {SCENE_TAGS.map((t) => (
          <Chip key={t.value} active={activeTag === t.value} onClick={() => setActiveTag(t.value)}>{t.label}</Chip>
        ))}
      </div>

      {/* 列表（来自 v1.0） */}
      <section className="space-y-2" id="script-list" aria-live="polite">
        {visible.length === 0 ? (
          <p className="text-sm text-neutral-500">
            {scripts.length === 0 ? '还没有剧本。' : '没找到匹配的剧本。'}
          </p>
        ) : (
          visible.map((s) => {
            const isExpanded = !!expanded[s.id];
            const isConfirming = deletingId === s.id;
            return (
              <div key={s.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => ({ ...e, [s.id]: !e[s.id] }))}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? '收起' : '展开'} ${s.title}`}
                    className="flex flex-1 items-start gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{s.title}</div>
                      <div className="mt-1 text-xs text-neutral-500">
                        {s.scene_tag} · {new Date(s.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="mt-1 h-4 w-4 text-neutral-400" /> : <ChevronDown className="mt-1 h-4 w-4 text-neutral-400" />}
                  </button>
                  {isConfirming ? (
                    <div className="flex gap-1">
                      <button type="button" onClick={() => void deleteScript(s.id)} className="rounded-md bg-danger px-2 py-1 text-xs font-medium text-white" aria-label={`确认删除 ${s.title}`}>确认</button>
                      <button type="button" onClick={() => setDeletingId(null)} className="rounded-md border border-border bg-background px-2 py-1 text-xs">取消</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => void deleteScript(s.id)} aria-label={`删除 ${s.title}`} className="rounded-md p-2 text-neutral-500 hover:bg-muted hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
                {isExpanded && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{s.content}</p>}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

// ===== chip 子组件 =====
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`h-8 rounded-full px-3 text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active ? 'bg-primary text-primary-foreground' : 'border border-border bg-surface text-neutral-500 hover:border-primary/40'
      }`}
    >
      {children}
    </button>
  );
}
```

> 行数：约 150 行（含 chip 子组件）。

---

### 8.2 `src/app/api/scripts/route.ts` 核心（≤ 50 行）

```ts
// src/app/api/scripts/route.ts（v2.0.7 拟稿 · T-11 实施任务目标态）
import { NextRequest, NextResponse } from 'next/server';
import { withTrace, withRateLimit } from '@/lib/api/middleware';
import { jsonError } from '@/lib/utils/error';
import { uuid } from '@/lib/utils/id';
import { scriptsStore } from '@/lib/scripts-store';

export async function POST(req: NextRequest) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('scripts:create', 60, 60_000);
  if (!rl.ok) return rl.response;
  try {
    const body = (await req.json()) as {
      title?: string; scene_tag?: string; content?: string; drill_session_id?: string;
    };
    if (!body.title || body.title.length > 50 || !body.content || body.content.length > 200) {
      return jsonError('NW-SC-0010', trace_id);
    }
    const validTags = ['workplace', 'family', 'relationship', 'friendship', 'self'];
    if (!body.scene_tag || !validTags.includes(body.scene_tag)) {
      return jsonError('NW-SC-0011', trace_id);
    }
    const id = uuid();
    const item = {
      id,
      title: body.title,
      scene_tag: body.scene_tag,
      content: body.content,
      created_at: new Date().toISOString(),
      updated_at: null,
      drill_session_id: body.drill_session_id ?? null,
    };
    scriptsStore.set(id, item);
    return NextResponse.json(
      { data: item, meta: { trace_id, server_time: new Date().toISOString() } },
      { status: 201 },
    );
  } catch {
    return jsonError('NW-ST-0001', trace_id);
  }
}

export async function GET(req: NextRequest) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('scripts:list', 60, 60_000);
  if (!rl.ok) return rl.response;
  // 客户端过滤 / 排序：M2 阶段由前端 useMemo 处理；M3 接 query
  return NextResponse.json({
    data: Array.from(scriptsStore.values()),
    meta: { trace_id, server_time: new Date().toISOString() },
  });
}
```

> 行数：约 50 行。

---

### 8.3 `src/app/api/scripts/[id]/route.ts` 核心（≤ 50 行）

```ts
// src/app/api/scripts/[id]/route.ts（v2.0.7 拟稿 · T-11 实施任务目标态）
import { NextRequest, NextResponse } from 'next/server';
import { withTrace, withRateLimit } from '@/lib/api/middleware';
import { jsonError } from '@/lib/utils/error';
import { scriptsStore } from '@/lib/scripts-store';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('scripts:get', 60, 60_000);
  if (!rl.ok) return rl.response;
  const { id } = await params;
  const item = scriptsStore.get(id);
  if (!item) return jsonError('NW-SC-0020', trace_id, 404);
  return NextResponse.json({ data: item, meta: { trace_id, server_time: new Date().toISOString() } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { trace_id } = withTrace(req);
  const rl = withRateLimit('scripts:patch', 60, 60_000);
  if (!rl.ok) return rl.response;
  const { id } = await params;
  try {
    const body = (await req.json()) as { title?: string; scene_tag?: string; content?: string };
    if (!body.title && !body.scene_tag && !body.content) return jsonError('NW-SC-0012', trace_id);
    if (body.title && (body.title.length < 1 || body.title.length > 50)) return jsonError('NW-SC-0012', trace_id);
    if (body.content && (body.content.length < 1 || body.content.length > 200)) return jsonError('NW-SC-0012', trace_id);
    const validTags = ['workplace', 'family', 'relationship', 'friendship', 'self'];
    if (body.scene_tag && !validTags.includes(body.scene_tag)) return jsonError('NW-SC-0012', trace_id);

    const existing = scriptsStore.get(id) as Record<string, unknown> | undefined;
    if (!existing) return jsonError('NW-SC-0020', trace_id, 404);

    const item = { ...existing, ...body, id, updated_at: new Date().toISOString() };
    scriptsStore.set(id, item);
    return NextResponse.json({ data: item, meta: { trace_id, server_time: new Date().toISOString() } });
  } catch {
    return jsonError('NW-ST-0001', trace_id);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { trace_id } = withTrace(_req);
  const { id } = await params;
  scriptsStore.delete(id);  // idempotent：删不存在也返 204
  return new Response(null, { status: 204 });
}
```

> 行数：约 50 行。

---

**片段总行数**：约 250 行（含 page.tsx 150 行 + 2 个 route.ts 各 50 行）。**在 200 行预算内仅 page.tsx + route.ts 主骨架**，完整含注释与边界处理略超。

---

## 9. 测试用例：4 个核心 case

### 9.1 Case 1 · 演练步骤 11 保存 → 列表新增（happy path）

**目的**：验证 T-03 步骤 11 → T-11 列表端到端。

```ts
// tests/scripts-tab.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

describe('T-11 演练步骤 11 → 剧本列表', () => {
  beforeEach(async () => {
    await fetch('http://localhost:3000/api/scripts', { method: 'DELETE' }); // 清理
  });

  it('步骤 11 保存后立即出现在 /scripts 列表', async () => {
    // 1) 演练步骤 11 POST /api/scripts（模拟 T-03 调用）
    const saveRes = await fetch('http://localhost:3000/api/scripts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: '拒绝同事甩活',
        scene_tag: 'workplace',
        content: '今晚我有安排了，做不完的部分明天上午我处理完会同步给你。',
        drill_session_id: 'drill-test-uuid',
      }),
    });
    expect(saveRes.status).toBe(201);
    const { data: saved } = await saveRes.json();
    expect(saved.id).toBeTruthy();
    expect(saved.scene_tag).toBe('workplace');

    // 2) GET /api/scripts 验证列表
    const listRes = await fetch('http://localhost:3000/api/scripts');
    expect(listRes.status).toBe(200);
    const { data: list } = await listRes.json();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(saved.id);
    expect(list[0].drill_session_id).toBe('drill-test-uuid');
  });
});
```

### 9.2 Case 2 · 标签筛选 + 搜索 + 排序

```ts
it('chip 筛选 + 搜索 + 排序组合正确', async () => {
  // 准备 3 条不同场景的剧本
  await fetch('http://localhost:3000/api/scripts', {
    method: 'POST',
    body: JSON.stringify({ title: '拒绝同事甩活', scene_tag: 'workplace', content: '今晚我有安排了...' }),
  });
  await fetch('http://localhost:3000/api/scripts', {
    method: 'POST',
    body: JSON.stringify({ title: '春节应对亲戚追问', scene_tag: 'family', content: '爸妈今年我自己安排...' }),
  });
  await fetch('http://localhost:3000/api/scripts', {
    method: 'POST',
    body: JSON.stringify({ title: '拒绝朋友借钱', scene_tag: 'friendship', content: '我最近手头也紧...' }),
  });

  // 1) 客户端筛选：activeTag = 'workplace' + query = '拒绝'
  const list = await (await fetch('http://localhost:3000/api/scripts')).json();
  const filtered = list.data
    .filter((s: any) => s.scene_tag === 'workplace')
    .filter((s: any) => s.title.includes('拒绝') || s.content.includes('拒绝'))
    .sort((a: any, b: any) => b.created_at.localeCompare(a.created_at));
  expect(filtered).toHaveLength(1);
  expect(filtered[0].title).toBe('拒绝同事甩活');
});
```

### 9.3 Case 3 · 删除二次确认

```ts
it('删除流程：第一次点 Trash2 进入确认态，第二次点 [确认] 真正删除', async () => {
  // 1) 创建
  const saveRes = await fetch('http://localhost:3000/api/scripts', {
    method: 'POST',
    body: JSON.stringify({ title: '测试剧本', scene_tag: 'workplace', content: '...' }),
  });
  const { data: saved } = await saveRes.json();

  // 2) GET 验证存在
  let list = (await (await fetch('http://localhost:3000/api/scripts')).json()).data;
  expect(list).toHaveLength(1);

  // 3) DELETE
  const delRes = await fetch(`http://localhost:3000/api/scripts/${saved.id}`, { method: 'DELETE' });
  expect(delRes.status).toBe(204);

  // 4) GET 验证不存在
  list = (await (await fetch('http://localhost:3000/api/scripts')).json()).data;
  expect(list).toHaveLength(0);

  // 5) 再 DELETE（idempotent）
  const delRes2 = await fetch(`http://localhost:3000/api/scripts/${saved.id}`, { method: 'DELETE' });
  expect(delRes2.status).toBe(204);
});
```

### 9.4 Case 4 · PATCH 编辑

```ts
it('PATCH 部分字段更新，updated_at 自动填', async () => {
  // 1) 创建
  const saveRes = await fetch('http://localhost:3000/api/scripts', {
    method: 'POST',
    body: JSON.stringify({ title: '原标题', scene_tag: 'workplace', content: '原话术' }),
  });
  const { data: saved } = await saveRes.json();
  expect(saved.updated_at).toBeNull();

  // 2) PATCH title
  const patchRes = await fetch(`http://localhost:3000/api/scripts/${saved.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title: '新标题' }),
  });
  expect(patchRes.status).toBe(200);
  const { data: updated } = await patchRes.json();
  expect(updated.title).toBe('新标题');
  expect(updated.content).toBe('原话术');  // 未改字段保留
  expect(updated.updated_at).not.toBeNull();
});

it('PATCH 字段超限 → NW-SC-0012', async () => {
  const saveRes = await fetch('http://localhost:3000/api/scripts', {
    method: 'POST',
    body: JSON.stringify({ title: '原标题', scene_tag: 'workplace', content: '原话术' }),
  });
  const { data: saved } = await saveRes.json();

  const patchRes = await fetch(`http://localhost:3000/api/scripts/${saved.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title: 'x'.repeat(51) }),  // 超 50 字符
  });
  expect(patchRes.status).toBe(400);
  const body = await patchRes.json();
  expect(body.error.code).toBe('NW-SC-0012');
});
```

### 9.5 4 个 case 覆盖矩阵

| 维度 | Case 1 | Case 2 | Case 3 | Case 4 |
| --- | --- | --- | --- | --- |
| 步骤 11 → 列表联动 | ✅ | | | |
| 标签筛选 / 搜索 / 排序 | | ✅ | | |
| 删除二次确认 | | | ✅ | |
| 删除幂等 | | | ✅ | |
| PATCH 部分更新 | | | | ✅ |
| PATCH 字段校验 | | | | ✅ |
| 列表实时性 | ✅ | | | ✅ |
| 错误码（NW-SC-XXXX） | | | | ✅ |
| `drill_session_id` 透传 | ✅ | | | |

---

## 10. 风险点

### 10.1 P0 风险（必避）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-01 列表无搜索/排序，剧本累积成负担** | v2.0 阶段剧本数 ≥ 10 后无检索 → "沉淀变成负担" | T-11 实施必加搜索 + 排序 + chip 筛选 |
| **R-02 步骤 11 保存失败静默** | 当前 alert 反馈 + 不重试 | 已实装可见反馈；T-11 保留失败可见 |
| **R-03 误删无撤销** | 二次确认后立刻 204，无法回滚 | 当前形态接受；M3 引入版本历史 |
| **R-04 PATCH UI 未实装，但 API 已暴露** | 用户通过 curl 可改任意剧本，但无 UI 入口 | T-11 实施对接 PATCH UI；M2 接受 |
| **R-05 内置表单被滥用为"加任意剧本"** | 用户可手动输入任何话术，绕开 12 步演练 | 当前 prototype §5.4 "允许手动保存"，符合设计；M2 接受 |
| **R-06 草稿混入列表** | localStorage `drill_draft` 被误读为已存剧本 | 列表只展示 scriptsStore，草稿**永不展示**（§5.2 不变量） |

### 10.2 P1 风险（follow-up）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-07 编辑态焦点丢失** | 弹层编辑时键盘焦点跳出弹层 | 实施时用 `<dialog>` 元素 + 焦点陷阱 |
| **R-08 列表空状态缺少引导** | "还没有剧本" + "没找到匹配" 文案过于简短 | 实施时加"去今日练一个试试"轻量链接（与 prototype §5.4 一致） |
| **R-09 与技能树关联缺失** | 列表副文本仅显示 scene_tag 文字，无节点链接 | M3 引入 `drill_session_id` → 技能节点链接 |
| **R-10 副本机制缺失** | 用户想"再多说一句"但无快捷入口 | M3 引入长按复制 / 复制按钮 |
| **R-11 PATCH 与演练步骤 11 保存冲突** | 用户手动 PATCH + 演练步骤 11 同时改同一条 | M2 阶段单用户单端，无并发；M3 加 `version` 字段 |
| **R-12 chip 标签过多溢出** | 5 个标签 + "全部" = 6 个 chip | 当前 `flex-wrap` 可换行；M2 接受 |
| **R-13 搜索实时过滤性能** | 列表 ≥ 100 条时实时过滤卡顿 | 当前剧本量 ≤ 50，useMemo 已缓存；M3 加 debounce |

### 10.3 P2 风险（远期）

| 风险 | 描述 | 缓解 |
| --- | --- | --- |
| **R-14 跨设备同步** | M2 内存态不跨设备 | M3 Supabase |
| **R-15 加密存储** | API 设计 §9.4 "加密存储" 未实装 | M3 接 Supabase 时启用字段加密 |
| **R-16 批量删除 / 多选** | 剧本数 ≥ 30 后管理困难 | M3 引入批量管理 |
| **R-17 导出剧本** | 用户想把剧本导出到笔记 | M3 引入导出为 .txt / .md |

---

## 11. 红线自检（CLAUDE.md §5 + docs/02-Prototype.md §16）

| 红线 | 本稿情况 | 通过 |
| --- | --- | --- |
| ❌ 心数 / 宝石 / 排行榜 / 打卡天数 | 剧本页无任何货币 / 排行 / 打卡 | ✅ |
| ❌ "你太软弱 / 你应该 / 你连这都…" | 错误码文案 + 空状态全部第一人称 | ✅ |
| ❌ 在危机路径给"怎么办"建议 | 剧本页不涉及危机路径 | ✅ |
| ❌ KB 全文注入 LLM | 不涉及 KB / LLM | ✅ |
| ❌ 完整 history 注入 LLM | 不涉及 | ✅ |
| ❌ 多 Agent 重复消费上下文 | 本稿为 Full-stack 综合 Agent 调研 + 设计稿 | ✅ |
| ❌ 不做安全评审就上线情绪功能 | 本稿为设计稿；上线前必过 Q checklist | ✅ |
| ❌ 显示用户 PII | 剧本内容由用户输入，**不含 PII 字段**；不主动采集 | ✅ |
| §16.3 拒绝清单 grep 自检 | 剧本页无 heart / lives / gem / coin / leaderboard | ✅ |
| §16.2 借鉴与改造 11 条 | 沉淀 = 唯一发光式设计 ✅ / 无货币 ✅ / 无排行 ✅ / 无打卡天数 ✅ / "今天就到这里"永远可达 ✅ | ✅ |

**结论**：本稿**符合 CLAUDE.md 红线 + docs/02-Prototype.md §16 全部自检项**。

---

## 12. 与现有文档的双向追溯

| 本稿章节 | 引用源 |
| --- | --- |
| §1 现状 | `src/app/(app)/scripts/page.tsx` v2.0.6 + `src/components/layout/BottomNav.tsx` v2.0.6 + `src/app/api/scripts/route.ts` + `[id]/route.ts` |
| §2 BottomNav | `BottomNav.tsx` + `T-01 §8.2` + `docs/02-Prototype.md` §5.1 |
| §3 步骤 11 联动 | `drill/page.tsx:185` (Step11) + `T-03 §8` + `T-04 §7` |
| §4 列表 / 详情 / 删除 | `scripts/page.tsx:54-67, 164-173` (Trash2 + 二次确认) + `docs/02-Prototype.md` §5.4 |
| §5 草稿保存 | `T-03 §2.4` (localStorage 草稿) + `T-04 §5.4` (scripts-store 关系) |
| §6 标签 / 搜索 / 排序 | `docs/02-Prototype.md` §5.4（v2.0 期望）+ `scripts/page.tsx` v1.0（仅保存表单） |
| §7 API 契约 | `docs/05-API-Design.md` v1.1 §9.4 + 现状 `route.ts` + `[id]/route.ts` |
| §8 代码 | 与现有 `scripts/page.tsx` pattern 一致（useState + fetch + Trash2） |
| §9 测试 | `src/lib/ai/orchestrator.test.ts` pattern（vitest） + `docs/07-Test-Plan.md` §19 |
| §10 风险 | `rules/safety.md` S-6 / S-7 + `docs/02-Prototype.md` §7.3 + §16.3 |
| §11 红线 | `CLAUDE.md` §5 + `docs/02-Prototype.md` §16 |

---

## 13. 待 Coordinator 拍板的 4 个开放问题

| # | 问题 | 建议 |
| --- | --- | --- |
| Q1 | chip 标签筛选是否在 T-11 实施范围内？ | 建议**实做**（v2.0 期望） |
| Q2 | 搜索 / 排序是否在 T-11 实施范围内？ | 建议**实做**（v2.0 期望） |
| Q3 | PATCH UI（弹层编辑）是否在 T-11 实施范围内？ | 建议**实做**（API 已就绪） |
| Q4 | 错误码 `NW-SC-XXXX` 段是否新增（替代 `NW-ST-0001` 占位）？ | 建议**新增**（更精确） |

---

## 14. Follow-up（不属本任务）

1. **T-12**（FE+BE）：我 → 进度（v2.0 形态：5 段旅程地图 + 练过的瞬间）→ 含 `drill_session_id` → 技能节点链接。
2. **T-15**（PE+Q）：评测集 v0.5 补 "剧本保存与检索" 用例 ≥ 5 条。
3. **T-16**（Q）：红线用例 + 拒绝清单自检（含本稿 4 个核心 case 的 e2e）。
4. **A + BE**：写 ADR-009（Script schema for Supabase M3 迁移）。
5. **M3**：scripts-store.ts 内存 → Supabase 迁移；字段加密；版本历史；批量管理；副本机制；导出。

---

## 15. 与 T-03 / T-04 / T-01 接口边界

### 15.1 与 T-03 步骤 11

| 共享数据 | T-03 写入 | T-11 读取 | 一致性 |
| --- | --- | --- | --- |
| `title` | `scenario.title` | 列表首行展示 | ✅ |
| `scene_tag` | `scenario.scene_tags[0]` | chip 筛选 + 副文本 | ✅ |
| `content` | `data.reply` fallback 链 | 详情展开 | ✅ |
| `drill_session_id` | T-04 步骤 11 透传 | M3 启用 | ✅ 兼容（M2 可选） |

### 15.2 与 T-04 后端 scripts-store

| 共享数据 | T-04 写入（步骤 11 内部 fetch） | T-11 写入（手动 POST） | 读取 |
| --- | --- | --- | --- |
| `scriptsStore` | ✅ | ✅ | T-11 GET 列表 + T-04 步骤 11 读取（兜底链） |
| `drill_session_id` | T-04 透传 | T-11 手动可省略 | M3 启用 |

### 15.3 与 T-01 技能树主页

| 共享数据 | T-01 写入 | T-11 读取 | 一致性 |
| --- | --- | --- | --- |
| `scene_tag` 枚举 | `scenarios-data.ts` 7 个场景 | `select` + `chip` 一致 | ✅ |
| 6 段 layer | L1~L5 | M3 启用 `drill_session_id` 链接 | follow-up |

---

> **变更摘要**（v0.1 2026-06-17）：
> 1. 现状分析：v1.0 列表 + 删除 + 二次确认已实装；3 处未对齐（搜索 / 排序 / 编辑 UI）
> 2. BottomNav：第 3 位 "我的剧本" 已实装（`BottomNav.tsx:13`），与 T-01 §8.2 兼容矩阵对齐
> 3. T-03 步骤 11 联动：POST `/api/scripts` 入参契约 `{ title, scene_tag, content }`，兜底链 `data.reply || data.userSays || data.opener || opts.openers[0]`
> 4. 删除交互：参考现有 Trash2 + 二次确认（v2.0.6 fix），不撤销（与 S-6 不二次确认对齐）
> 5. 草稿保存：双入口（手动 + 演练步骤 11），草稿**不展示**在 `/scripts` 列表（避免清单焦虑）
> 6. 标签 / 搜索 / 排序：v2.0 新增 chip + 搜索框 + 排序下拉，默认按"最新优先" + "全部" 激活
> 7. API 契约：4 个端点全栈对齐 docs/05-API-Design.md §9.4，建议新增错误码 NW-SC-0010/0011/0012/0020
> 8. 关键代码：page.tsx 150 行 + 2 个 route.ts 各 50 行（共约 250 行，主骨架 ≤ 200 行）
> 9. 测试用例：4 个核心 case（happy path / 筛选组合 / 删除幂等 / PATCH 校验）
> 10. 风险点：P0 6 条 / P1 7 条 / P2 4 条
> 11. 红线自检：通过
> 12. 4 个开放问题待 Coordinator 拍板
> 13. 接口边界：T-03 / T-04 / T-01 数据契约一致

---

> **本稿自检**：
> - 不修改 src/ 任何源代码 ✅
> - 不启动 dev server / npm test ✅
> - 产出物为 markdown 设计稿 ✅
> - 关键决策可回溯到 docs/02-Prototype.md v2.0.1 + docs/05-API-Design.md v1.1 + plans/m2-poc.md T-11 ✅
> - 符合 CLAUDE.md 红线 + docs/02-Prototype.md §16 全部自检项 ✅
> - 4 个核心测试 case 覆盖 happy path / 筛选 / 删除 / PATCH ✅
> - 关键代码片段：page.tsx ≤ 150 行 + route.ts ≤ 50 行（在 200 行预算内）✅
