# Epic 01 · Foundation 基础平台

> **Owner**：Coordinator（C）统筹
> **主要执行 Agent**：A、BE、FE、Q、PE、KE
> **关联文档**：`docs/01-PRD.md`、`docs/02-Prototype.md`、`docs/03-System-Architecture.md`、`docs/04-Database-Design.md`、`docs/05-API-Design.md`、`docs/07-Test-Plan.md`、`docs/08-Deployment-Plan.md`、`rules/safety.md`

---

## 1. Epic 概述

### 1.1 目标
把《不委屈》跑起来的地基打牢：用户能注册、能进站、能退出 / 暂停 / 删除数据、危机路径独立可用、可观测、可部署。

### 1.2 范围
- 匿名档案 + Onboarding
- 设备 / 登录鉴权
- 设置与隐私（含 PII 最小化、动效、通知）
- 数据权利（导出 / 删除）
- 危机路径（独立部署、独立压测）
- 可观测（指标 / 日志 / 追踪）
- 部署流水线

### 1.3 不在范围
- AI 对话 / 演练（Epic 02）
- 日记 / 剧本（Epic 03）
- 成长报告（Epic 04）

### 1.4 关键指标
| 指标 | 目标 |
| --- | --- |
| 可用性 | ≥ 99.5% |
| 数据删除 SLA | ≤ 24h |
| 危机路径 P99 | ≤ 500ms |
| 危机漏召 | 0 |
| 隐私合规自检 | 0 PII 出现在日志 / 第三方 |

### 1.5 总工时估
| Story | 工时（人时） |
| --- | --- |
| 1.1 Profile & Onboarding | 96 |
| 1.2 Auth & Identity | 64 |
| 1.3 Settings & Privacy | 80 |
| 1.4 Data Rights | 88 |
| 1.5 Crisis Path（独立） | 144 |
| 1.6 Observability | 64 |
| 1.7 Deployment | 80 |
| **合计** | **616 人时** |

---

## 2. Story 列表

| ID | Story | Owner Agent | 估时 | 依赖 |
| --- | --- | --- | --- | --- |
| 1.1 | Profile & Onboarding | BE / FE / A | 96 | — |
| 1.2 | Auth & Identity | A / BE | 64 | 1.1 |
| 1.3 | Settings & Privacy | FE / BE / Q | 80 | 1.1, 1.2 |
| 1.4 | Data Rights（Export / Delete） | BE / FE / Q | 88 | 1.1, 1.2 |
| 1.5 | Crisis Path（独立部署） | A / BE / Q / PE | 144 | 1.1, 1.2 |
| 1.6 | Observability | A / BE | 64 | 1.1~1.5 |
| 1.7 | Deployment Pipeline | A / BE | 80 | 1.1~1.5 |

---

## 3. Story 1.1 · Profile & Onboarding

### 3.1 描述
用户首次进入《不委屈》时，能在不输入 PII 的情况下完成档案创建与 5 步内 Onboarding。

### 3.2 验收标准
- [ ] 用户可纯匿名进入，设备 ID 哈希唯一
- [ ] Onboarding ≤ 5 步，每步 1 问
- [ ] 「先跳过」按钮每步常驻
- [ ] 档案可设置：preferred_tone、preferred_scenario、reduced_motion
- [ ] 全部字段走 `nw_user_profile`（详见 `docs/04-Database-Design.md` §4.1）
- [ ] 退出 Onboarding 不丢数据，下次可继续

### 3.3 依赖
- 数据库表 `nw_user_profile` / `nw_user_preference` 落库（M1）
- API 契约 `/v1/profiles/me` 已发布（详见 `docs/05-API-Design.md` §9.1）
- 原型 §5.1 已冻结

### 3.4 Tasks

#### Task 1.1.1 · 数据库 schema 落库（BE）
- **Owner**：BE
- **估时**：8h
- **输入**：`docs/04-Database-Design.md` §4.1
- **输出**：DDL 脚本 + 迁移文件 + dev 库已建
- **依赖**：无
- **验收**：
  - [ ] 表 / 索引 / 约束齐全
  - [ ] 迁移 up / down 双向
  - [ ] 集成测试覆盖
  - [ ] 评审签字 BE + A

#### Task 1.1.2 · API 实现 `GET/PATCH/DELETE /v1/profiles/me`（BE）
- **Owner**：BE
- **估时**：16h
- **输入**：Task 1.1.1 / `docs/05-API-Design.md` §9.1
- **输出**：服务实现 + OpenAPI 实现
- **依赖**：Task 1.1.1
- **验收**：
  - [ ] 三个端点 100% 通过契约测试
  - [ ] 错误码 NW-AU-0001/0002/0003 命中
  - [ ] 限流 60 req/min
  - [ ] 单元测试 ≥ 80%

##### Subtask 1.1.2.1 · 设备 ID 哈希
- **Owner**：BE
- **估时**：4h
- **输出**：device_hash 生成 + salt 隔离
- **验收**：NIST SP 800-63B 兼容

##### Subtask 1.1.2.2 · 字段级脱敏
- **Owner**：BE
- **估时**：4h
- **输出**：PII 字段加密 / 脱敏
- **验收**：Q 渗透测试通过

#### Task 1.1.3 · Onboarding 前端流程（FE）
- **Owner**：FE
- **估时**：24h
- **输入**：`docs/02-Prototype.md` §5.1
- **输出**：5 步 Onboarding 页 + 「先跳过」按钮 + 状态机
- **依赖**：Task 1.1.2
- **验收**：
  - [ ] 5 步流程完整跑通
  - [ ] 每步 1 问
  - [ ] 跳过 / 退出 / 保存 100% 可达
  - [ ] 键盘可达 + 屏幕阅读器友好
  - [ ] P95 首屏 ≤ 1.5s

##### Subtask 1.1.3.1 · 步骤组件
- **Owner**：FE
- **估时**：8h
- **输出**：通用 `<OnboardingStep />` 组件
- **验收**：axe 0 critical

##### Subtask 1.1.3.2 · 跳过 / 退出 / 保存
- **Owner**：FE
- **估时**：4h
- **输出**：3 按钮全可达
- **验收**：自动化测试覆盖

#### Task 1.1.4 · 鉴权最小化（BE / A）
- **Owner**：BE / A
- **估时**：16h
- **输出**：device_token 签发 + refresh 滚动
- **验收**：
  - [ ] Token TTL ≤ 15min
  - [ ] 滚动 refresh 通过
  - [ ] 撤销机制

#### Task 1.1.5 · 集成测试 + 验收（Q）
- **Owner**：Q
- **估时**：16h
- **输出**：验收报告
- **验收**：
  - [ ] 5 步流程 0 阻塞
  - [ ] 跳过 / 退出 / 保存路径全通
  - [ ] 危机路径不阻断

---

## 4. Story 1.2 · Auth & Identity

### 4.1 描述
设备匿名 + 可选登录（手机号 / 第三方）双轨鉴权。

### 4.2 验收标准
- [ ] 匿名可用全部功能
- [ ] 登录后同步进度（脱敏）
- [ ] 手机号收集即脱敏
- [ ] 不强制登录
- [ ] mTLS 服务间认证

### 4.3 依赖
- Story 1.1

### 4.4 Tasks

#### Task 1.2.1 · 设备 Token 签发（BE）
- **Owner**：BE
- **估时**：8h
- **输出**：JWT 签发 + 验证
- **验收**：HS256 / 密钥轮转

#### Task 1.2.2 · 手机号脱敏登录（BE）
- **Owner**：BE
- **估时**：16h
- **输出**：手机号登录端点（可选）
- **验收**：
  - [ ] 中间四位 * 存储
  - [ ] 0 第三方 SDK
  - [ ] Q 渗透通过

#### Task 1.2.3 · 第三方登录预留（BE / A）
- **Owner**：BE / A
- **估时**：16h
- **输出**：OAuth 抽象层
- **验收**：未来切换无需业务改动

#### Task 1.2.4 · mTLS 服务间（BE / A）
- **Owner**：BE / A
- **估时**：16h
- **输出**：服务间 mTLS 配置
- **验收**：服务间 0 明文

#### Task 1.2.5 · 集成测试（Q）
- **Owner**：Q
- **估时**：8h
- **验收**：鉴权矩阵 100% 通过

---

## 5. Story 1.3 · Settings & Privacy

### 5.1 描述
设置页：通知、动效、隐私、关于；用户随时可关闭任意项。

### 5.2 验收标准
- [ ] 默认通知全关
- [ ] 默认不收集可识别 PII
- [ ] 减少动效跟随系统
- [ ] 「关于」含「不替代专业」声明
- [ ] 隐私政策 / 用户协议可查

### 5.3 依赖
- Story 1.1, 1.2

### 5.4 Tasks

#### Task 1.3.1 · 设置页 UI（FE）
- **Owner**：FE
- **估时**：16h
- **输出**：5 个区块（数据 / 通知 / 动效 / 关于 / 退出）
- **依赖**：`docs/02-Prototype.md` §5.8
- **验收**：
  - [ ] 5 区块全通
  - [ ] 默认值正确
  - [ ] 键盘可达

#### Task 1.3.2 · 通知 / 动效 API（BE）
- **Owner**：BE
- **估时**：8h
- **输出**：`PATCH /v1/profiles/me` 字段
- **验收**：契约 100%

#### Task 1.3.3 · 隐私政策 / 用户协议（PM / Q）
- **Owner**：PM + Q
- **估时**：16h
- **输出**：两份文档
- **验收**：合规自检通过

#### Task 1.3.4 · 隐私合规自检（Q）
- **Owner**：Q
- **估时**：16h
- **输出**：自检报告
- **验收**：0 PII 出现在日志 / 第三方

#### Task 1.3.5 · 集成测试（Q）
- **Owner**：Q
- **估时**：8h
- **输出**：验收报告

---

## 6. Story 1.4 · Data Rights（Export / Delete）

### 6.1 描述
用户可一键导出 / 删除全部数据，SLA 24h。

### 6.2 验收标准
- [ ] 一键导出请求 ≤ 24h 完成
- [ ] 一键删除请求 ≤ 24h 物理 / 逻辑删除
- [ ] 用户可查询处理状态
- [ ] 二次确认不可逆操作
- [ ] 审计留痕

### 6.3 依赖
- Story 1.1, 1.2

### 6.4 Tasks

#### Task 1.4.1 · DataRequest 表 + 端点（BE）
- **Owner**：BE
- **估时**：16h
- **输出**：`nw_data_request` 表 + `POST/GET /v1/data-requests`
- **依赖**：`docs/04-Database-Design.md` §4.5
- **验收**：SLA 监控到位

#### Task 1.4.2 · 异步 worker（BE）
- **Owner**：BE
- **估时**：16h
- **输出**：Redis Stream worker
- **验收**：
  - [ ] 单条 ≤ 24h
  - [ ] 失败重试 + 告警

##### Subtask 1.4.2.1 · 导出打包
- **Owner**：BE
- **估时**：8h
- **输出**：JSON / ZIP
- **验收**：含对话 + 剧本 + 进度 + 里程碑

##### Subtask 1.4.2.2 · 删除编排
- **Owner**：BE
- **估时**：8h
- **输出**：跨服务删除
- **验收**：
  - [ ] 全部 P0 服务同步删
  - [ ] 审计留痕（不存内容）

#### Task 1.4.3 · UI：导出 / 删除按钮（FE）
- **Owner**：FE
- **估时**：8h
- **输出**：二次确认对话框
- **验收**：不可误操作

#### Task 1.4.4 · SLA 监控（BE / A）
- **Owner**：BE / A
- **估时**：8h
- **输出**：超时告警
- **验收**：> 24h 即 P1

#### Task 1.4.5 · 集成测试（Q）
- **Owner**：Q
- **估时**：16h
- **输出**：验收报告
- **验收**：真实数据全流程

---

## 7. Story 1.5 · Crisis Path（独立部署）

### 7.1 描述
危机路径独立服务、独立压测、独立兜底；危机话术本地静态存储 + 监控告警。

### 7.2 验收标准
- [ ] 危机信号召回 ≥ 99%
- [ ] 危机漏召 0
- [ ] 危机路径不被上游降级覆盖
- [ ] 上游全挂时本地兜底可用
- [ ] 独立压测通过
- [ ] 月度演练 1 次

### 7.3 依赖
- Story 1.1, 1.2

### 7.4 Tasks

#### Task 1.5.1 · CrisisPath 服务独立部署（BE / A）
- **Owner**：BE / A
- **估时**：24h
- **输出**：独立服务 + 独立 CI/CD
- **依赖**：`docs/08-Deployment-Plan.md` §13
- **验收**：
  - [ ] 独立命名空间
  - [ ] 独立 DB schema
  - [ ] 独立流水线

#### Task 1.5.2 · 危机检测模型接入（PE / BE）
- **Owner**：PE / BE
- **估时**：16h
- **输出**：保守模型（温度 0）+ 规则混合
- **依赖**：`prompts/analyze.md`
- **验收**：
  - [ ] 召回 ≥ 99%
  - [ ] 误触发 ≤ 5%
  - [ ] Q 红线用例 100% 通过

#### Task 1.5.3 · 危机资源库（PE / KE）
- **Owner**：PE / KE
- **估时**：16h
- **输出**：资源库（热线、医院、紧急联系人）
- **验收**：
  - [ ] 中国大陆覆盖
  - [ ] 不依赖网络
  - [ ] 资源更新走版本

#### Task 1.5.4 · 兜底话术本地化（PE / BE）
- **Owner**：PE / BE
- **估时**：8h
- **输出**：本地静态话术
- **验收**：上游全挂时 ≤ 100ms 返回

#### Task 1.5.5 · 危机话术触发规则（PE）
- **Owner**：PE
- **估时**：8h
- **输出**：触发规则文档 + 评测集
- **依赖**：`prompts/analyze.md` §4 危机信号识别
- **验收**：Q 红线 7 类全覆盖

#### Task 1.5.6 · 独立监控 + 告警（BE / A）
- **Owner**：BE / A
- **估时**：16h
- **输出**：危机路径专属监控
- **验收**：
  - [ ] 调用失败 → P0
  - [ ] P99 ≤ 500ms

#### Task 1.5.7 · 独立压测（Q / BE）
- **Owner**：Q / BE
- **估时**：16h
- **输出**：压测报告
- **验收**：并发 ≥ 1 万 QPS

#### Task 1.5.8 · 月度红队演练（Q）
- **Owner**：Q
- **估时**：8h
- **输出**：演练报告
- **验收**：每年 ≥ 12 次

#### Task 1.5.9 · 危机兜底页 UI（FE）
- **Owner**：FE
- **估时**：8h
- **输出**：`docs/02-Prototype.md` §5.5 页面
- **验收**：
  - [ ] 无动效
  - [ ] 不需要网络
  - [ ] 焦点可达

#### Task 1.5.10 · 集成测试（Q）
- **Owner**：Q
- **估时**：24h
- **输出**：验收报告 + 红线用例 100%
- **验收**：危机场景 0 漏

---

## 8. Story 1.6 · Observability

### 8.1 描述
Metrics / Logs / Traces 三大支柱 + 危机路径专属。

### 8.2 验收标准
- [ ] 100% AI 调用可 trace + 回放
- [ ] 0 PII 出现在日志
- [ ] 关键告警 5min 内可达
- [ ] 危机路径调用失败 → P0

### 8.3 依赖
- Story 1.1~1.5

### 8.4 Tasks

#### Task 1.6.1 · Metrics 体系（BE / A）
- **Owner**：BE / A
- **估时**：16h
- **输出**：Prometheus + Grafana
- **依赖**：`docs/03-System-Architecture.md` §12
- **验收**：
  - [ ] 关键指标全
  - [ ] Dashboard 上线

#### Task 1.6.2 · Logs 体系（BE / A）
- **Owner**：BE / A
- **估时**：16h
- **输出**：Loki / ELK
- **验收**：脱敏合规自检 100%

#### Task 1.6.3 · Traces 体系（BE / A）
- **Owner**：BE / A
- **估时**：16h
- **输出**：OpenTelemetry + Jaeger
- **验收**：100% AI 调用有 trace_id

#### Task 1.6.4 · 危机路径专属监控（BE / A）
- **Owner**：BE / A
- **估时**：8h
- **输出**：危机路径监控大盘
- **验收**：调用失败 P0 告警

#### Task 1.6.5 · 告警通知集成（BE / A）
- **Owner**：BE / A
- **估时**：8h
- **输出**：飞书 / 钉钉 / 企微集成
- **验收**：P0 5min 内可达

---

## 9. Story 1.7 · Deployment Pipeline

### 9.1 描述
CI / CD / 灰度 / 回滚完整流水线。

### 9.2 验收标准
- [ ] 任意变更可灰度、可回滚
- [ ] 流水线阻断条件齐全
- [ ] 0 明文密钥在仓库

### 9.3 依赖
- Story 1.1~1.5

### 9.4 Tasks

#### Task 1.7.1 · CI 流水线（BE / A）
- **Owner**：BE / A
- **估时**：16h
- **输出**：Lint + 单测 + 集成 + 镜像 + 漏洞扫描
- **验收**：
  - [ ] 阻断条件齐全
  - [ ] 镜像签名

#### Task 1.7.2 · CD 流水线（BE / A）
- **Owner**：BE / A
- **估时**：16h
- **输出**：staging → canary → prod
- **验收**：
  - [ ] 灰度 1% → 20% → 100%
  - [ ] 一键回滚

#### Task 1.7.3 · Feature Flag（BE / A）
- **Owner**：BE / A
- **估时**：8h
- **输出**：自建 Feature Flag 服务
- **验收**：
  - [ ] 危险开关（关 AI / 关演练 / 关危机）
  - [ ] 按租户灰度

#### Task 1.7.4 · Secrets 管理（BE / A）
- **Owner**：BE / A
- **估时**：8h
- **输出**：KMS 集成
- **验收**：
  - [ ] 0 明文密钥
  - [ ] 90 天轮转

#### Task 1.7.5 · 灾备演练（BE / A / Q）
- **Owner**：BE / A / Q
- **估时**：16h
- **输出**：RPO ≤ 1h / RTO ≤ 30min
- **依赖**：`docs/08-Deployment-Plan.md` §11
- **验收**：演练报告

#### Task 1.7.6 · 上线 Runbook（BE / A）
- **Owner**：BE / A
- **估时**：8h
- **输出**：发布 / 回滚 Runbook
- **验收**：值班 5min 内可操作

#### Task 1.7.7 · 集成测试（Q）
- **Owner**：Q
- **估时**：8h
- **输出**：验收报告

---

## 10. 风险与缓解

| 风险 | 等级 | 缓解 |
| --- | --- | --- |
| 危机话术漏触发 | P0 | 保守模型 + 月度演练 |
| PII 泄露 | P0 | 字段级脱敏 + 0 明文日志 + 渗透测试 |
| 数据删除 SLA 超时 | P1 | SLA 监控 + 告警 |
| 单 Region 故障 | P0 | 多 AZ + 灾备演练 |
| 镜像供应链 | P0 | 签名 + 漏洞扫描 |

## 11. 关联文档

| 关联 | 路径 |
| --- | --- |
| PRD | `docs/01-PRD.md` |
| 原型 | `docs/02-Prototype.md` v2.0 |
| 架构 | `docs/03-System-Architecture.md` |
| 数据库 | `docs/04-Database-Design.md` |
| API | `docs/05-API-Design.md` v1.1 |
| 测试 | `docs/07-Test-Plan.md` v1.1 |
| 部署 | `docs/08-Deployment-Plan.md` |
| 安全 | `rules/safety.md` |
| 治理 | `rules/governance.md` |
| 质量 | `rules/quality.md` |

---

## 12. v2.0 同步说明（2026-06-16）

> 本 epic 主体保留 v1.0 范围（匿名档案 / 鉴权 / 数据权利 / 危机路径 / 可观测 / 部署）。
> v2.0 引入 4 个新模块，需要在 M1-09 同步增补。

### 12.1 新增模块（在 epic 01 内实现的部分）

| ID | 任务 | Owner | 状态 |
| --- | --- | --- | --- |
| F-SKL-001 | 技能树主页（5 段骨架 + 节点 6 态组件） | FE | 待 M1-09 |
| F-LPM-001 | 低压力模式开关 + 全局开关组件 | FE | 待 M1-09 |
| F-LPM-002 | 推送控制（LPM ON 时 0 推送） | BE | 待 M1-09 |
| F-STR-001 | 温和连击 + 休整日 | FE + BE | 待 M1-09 |
| F-STR-002 | 休整日端点（最多 2 个/周） | BE | 待 M1-09 |
| F-TOD-001 | 今日三件小事（1 必做 + 2 选做） | FE + BE | 待 M1-09 |

### 12.2 调整模块

| 原 v1.0 | 调整到 v2.0 |
| --- | --- |
| 7 Tab 导航 | 4 Tab 导航（今日 / 自由对话 / 我的剧本 / 我） |
| 设置独立页 | 收纳进「我」页 |
| 复盘独立页 | 收纳进「我 → 进度」子页 |

### 12.3 拒绝清单自检（CI 必跑）

> 详见 `docs/02-Prototype.md` §16.3 + `docs/07-Test-Plan.md` §19.6

- 无 `/v1/hearts` `/v1/lives` `/v1/gems` `/v1/coins` `/v1/shop` 端点
- 无 `/v1/leaderboard` `/v1/league` `/v1/rank` `/v1/checkin` 端点
- 无 `/v1/streak-repair` `/v1/countdown` `/v1/flash-sale` 端点
- 全代码库无 `Heart` / `Lives` / `Gem` / `Coin` / `Leaderboard` 类
- 全代码库无 "失去" / "丢失" / "再不来就" / "🔥 红字" / "坚持 X 天" / "打卡" 字符串
