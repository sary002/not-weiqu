# CHANGELOG · 不委屈（Not委屈）

> **Owner**：Coordinator（C）
> **更新规则**：每日工作结束后追加一段（**不修改**历史条目；修正请加新条目说明）
> **格式参考**：[Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)
> **补充文档**：`plans/daily/YYYY-MM-DD.md`（每日 standup 笔记）

本文件记录项目的**重要变更**：新功能、架构调整、关键 bug 修复、安全事件。
微小的日常编辑请直接 commit message，不进 changelog。

---

## [Unreleased]

### Changed
- AI 架构：2 次 LLM 串行 → 1 次合并调用（详见 `docs/v2.0.7-llm-architecture.md`）
- 演练页：自由文本 → Duolingo 风格全选择题（`docs/02-Prototype.md` §18）
- 自由对话：fix fallback 重复"我在听"（按 turn + 用户原话切换）
- 底部 Tab：加键盘 focus-visible 态
- 进度页自报：Link GET API → client-side POST + 乐观更新

### Added
- **v2.0 形态**（`docs/02-Prototype.md` v2.0.1）：4 Tab / 技能树 / 12 步 / 旅程地图 / LPM 开关
- **v2.0 demo**（`docs/demo-v2.md`）：5 分钟端到端路径可用
- **Router 缓存**（`src/lib/ai/cache.ts`）：5 分钟 TTL，crisis/drill 不缓存
- **token 统计埋点**：orchestrator 返回 `tokens.in/out` + `routing.calls_used`
- **scripts 共享 store**（`src/lib/scripts-store.ts`）：POST/GET/PATCH/DELETE 共享 globalThis Map
- **§1 觉察 L1 场景**：`l1-body-awareness` / `l1-emotion-naming` / `l1-pattern-spotting`
- **4 个 L1 节点 6 态** + `SkillNode` 组件

### Fixed
- `drill` 页 `<Link>` 未 import 导致 React ReferenceError
- `/scripts` 不能删除剧本（加 Trash 按钮 + 二次确认 + 可展开）
- `/settings` 刷新设置丢失（localStorage 持久化）
- `free_dialogue` fallback 重复"我在听"（v2.0.3 fix：按 turn 切换 + 引用用户原话）
- `progress` "刚刚做到了" 是 GET 跳 API（改为 POST + 反馈）
- 边缘错误码：空消息/超长 → NW-CO-0010/0011
- `PATCH /api/scripts/[id]` 500（v2.0.7 后稳定）
- `/api/profiles/me` 404（补建 me 子路径）
- step 5 双选 bug（选一题就跳走）→ onChange 不前进

### Security
- 拒绝清单 grep：heart / gem / leaderboard / 打卡 / 失去 / 🔥 红字 = 0 破窗
- 推送默认关 / LPM 默认 ON
- 危机路径 100% 触发 + 0 LLM 调用
- 12 步演练开场白 PE+KE 签字（不能 AI 自由生成）

### Metrics
- 单次请求：~6000 → **~419 tokens**（**-93%**）
- LLM 调用：2 → 0.7（含 cache，-65%）
- 单次延迟：50s+ → 8s（cache hit 0s，-84%）
- 1000 DAU/天：~$20+ → ~$2.8（**-86%**）
- 测试：11 → 22（+100%）

---

## 模板（下次添加时复制）

```markdown
## [YYYY-MM-DD] · vX.Y.Z

### Added
- 新功能 A

### Changed
- 旧功能 B → 新功能 C

### Fixed
- bug 描述

### Security
- 安全相关变更

### Metrics
- 关键数字变化
```
