# plans/ — 项目计划目录

> 一个 feature 一个文件；阶段流转在这里留痕。

## 命名
- 主计划：`plans/<feature-slug>.md`
- 子计划：`plans/<feature-slug>/<stage>.md`
- 设计稿：`plans/<feature-slug>/design/<role>.md`

## 主计划模板

```markdown
# Plan: <feature-slug>

- 阶段：计划中 / 设计中 / 实施中 / 验收中 / 已完成
- 负责人：PM（主） + C（统筹）
- 关联 PRD：docs/product/prd-<feature>.md
- 关联假设：H-NNN

## 目标
<一句话>

## 范围
- 做：
- 不做：
- 暂缓：

## 任务清单
| ID | 任务 | 负责人 | 阶段 | 状态 |
| --- | --- | --- | --- | --- |
| 001 |  |  |  |  |
| 002 |  |  |  |  |

## 依赖
- 上游：
- 下游：

## 风险
- 

## 验收结果
（由 Q 在收尾时填写）

## 假设验证情况
- 验证 / 部分验证 / 证伪
- 失败回退动作
```

## 当前活跃计划
- `m2-poc.md` — v2.0 形态 M2 PoC（1 微技能 + 12 步演练 + 温和连击 + 低压力 + 危机）

## 已完成计划
- （暂无）

## 每日工作日志
- `daily/README.md` — 每日 standup 规则
- `daily/2026-06-17.md` — 今日（v2.0.7 token 审计 + bug 修复收尾）

## 重要变更（changelog）
- 根目录 `CHANGELOG.md` — 按 Keep a Changelog 格式记录
