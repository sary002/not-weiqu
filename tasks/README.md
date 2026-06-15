# tasks/ — 任务池与执行追踪

> 短小、单一、可被一个 Agent 完整接走。

## 命名
- 任务目录：`tasks/<NNN>-<slug>/`
  - `NNN`：3 位数序号，从 001 起
  - `slug`：动名词短语
- 单文件可选：
  - `brief.md`：任务简报
  - `blocker.md`：阻塞项
  - `handoff-<from>-to-<to>.md`：交接卡
  - `review-<round>.md`：评审记录
  - `acceptance.md`：验收报告
  - `regression.md`：回归报告
  - `risk-register.md`：风险登记

## 状态机
```
pending → in_progress → blocked → in_progress → review → accepted
                                                  ↘ rework（回到 in_progress）
```

## brief.md 模板

```markdown
# Task <NNN>: <slug>

- 状态：pending
- 负责人：<Agent>
- 评审：<Agent>
- 阶段：<需求/方案/设计/计划/验收>
- 父计划：plans/<feature>.md
- 父 PRD：docs/product/prd-<feature>.md

## 目标
<一句话>

## 输入
- 
## 产出
- 
## 验收
- [ ] 
- [ ] 
## 风险
- 
## 依赖
- 上游：
- 下游：
```

## 编号登记（运行中维护）
| ID | 标题 | 状态 | 负责人 | 父计划 |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

（产品设计阶段暂无业务任务；此文件用于后续登记）
