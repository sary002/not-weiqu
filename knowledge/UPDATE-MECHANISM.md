# 知识库更新机制（Update Mechanism）

> **Owner**：Knowledge Engineer（KE）
> **Reviewer**：PM、Q、PE、C
> **版本**：v1.0
> **关联**：`knowledge/00-Overview.md` §5.6、`knowledge/prompts/kb-audit.md`

---

## 1. 入库流程

```
素材收集
   ↓
切分（chunk-extract）
   ↓
抽取案例（case-extract）
   ↓
标签分类（tag-classify）
   ↓
KE 编写
   ↓
Q 红线用例自检
   ↓
PE 语气校准
   ↓
同行评审（KE + PM + Q）
   ↓
发布
```

## 2. 更新触发

| 触发 | 流程 |
| --- | --- |
| 新增书 | 入库流程 |
| 新增切片 | 入库流程（轻量） |
| 新增案例 | 入库流程（标准） |
| 新增标签 | 标签版本流程 |
| 修正 | 修改 → 新版本 + 旧版本 deprecate |
| 紧急下架 | 1h 内下架 + 审计 |

## 3. 季度复核

| 频率 | 范围 | 负责人 |
| --- | --- | --- |
| 每 12 月 | 全部 KB 资产 | 原作者 + 1 位非原作者 |
| 每 3 月 | 抽样 10% | KE 内部 |
| 每月 | 危机路径相关 | Q |

### 3.1 复核结果
- 保持（published）
- 更新（needs-update → 新版本）
- 弃用（deprecate）

### 3.2 复核记录
- `knowledge/audit/YYYY-Q.md`
- 字段：日期、复核人、资产 ID、结论、备注

## 4. 紧急下架流程

```
发现风险（用户反馈 / Q 报告 / 引用错误）
   ↓
1h 内下架（status = deprecated + deprecation_reason）
   ↓
Audit 留痕
   ↓
KE 评估：是否需修订 / 永久弃用
   ↓
PM / Q 联合签字
   ↓
回灌评测集
```

## 5. 灰度发布

| 阶段 | 比例 | 观察窗口 |
| --- | --- | --- |
| 内部 | 0% | 1 周 |
| 1% | 1% | 24h |
| 20% | 20% | 24h |
| 100% | 100% | — |

灰度观察指标：
- reply 采纳率
- 红线触发率
- 用户反馈（有用 / 没用）

## 6. 关联文档

| 关联 | 路径 |
| --- | --- |
| 架构 | `knowledge/00-Overview.md` §5.6 |
| 复核 prompt | `knowledge/prompts/kb-audit.md` |
| 版本管理 | `knowledge/VERSION-MANAGEMENT.md` |
| 安全 | `rules/safety.md` |
