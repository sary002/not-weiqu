# books · 书库

> **Owner**：Knowledge Engineer（KE）
> **版本**：v1.0
> **关联**：`knowledge/00-Overview.md`、`knowledge/chunks/`、`knowledge/tags/`

---

## 1. 使命
为「不委屈」陪练 AI 提供**有源、有据、有节**的图书资产。所有书籍必须通过来源审核与版本化登记。

## 2. 分类与书单

> 全部 32 本核心书 + 候选书；与 PRD §1 价值观对齐。

| 分类 | 数量 | 主要场景 |
| --- | --- | --- |
| 边界感 | 7 | 全部 |
| 沟通表达 | 6 | 职场 / 家庭 / 关系 |
| 自我价值 | 5 | 全部 |
| 情绪管理 | 4 | 全部 |
| 认知成长 | 6 | 全部 |
| 原生家庭 | 3 | 家庭 / 关系 |
| 女性成长 | 4 | 家庭 / 关系 / 婚姻 |
| 关系与亲密关系 | 3 | 关系 / 婚姻 |
| **合计** | **38（含候选）** | |

> 详见 `boundary.md` / `communication.md` / `self-worth.md` / `emotion.md` / `cognitive.md` / `family.md` / `women.md` / `relationship.md` 八份分类清单。

## 3. 书籍登记模板

每本书必须在 `books/<category>.md` 中以如下模板登记：

```markdown
## <书名>
- book_id：kb-book-<category>-<NNN>
- 作者：xxx
- ISBN：xxx
- 出版社 / 年份：xxx
- 译者（如有）：xxx
- 来源审核：✅ 白名单 / ⚠️ 待审 / ❌ 拒
- 审校人：KE-<initials>
- 审校日期：YYYY-MM-DD
- 适用边界五层：L1~L5 选若干
- 适用人群：通用 / 职场 / 家庭 / 关系 ...
- 主要标签：[boundary/*, peoplepleasing/*, ...]
- 不适用场景：<列出>
- 风险提示：<列出>
- 切片数量：<N>（详见 chunks/）
- 引用案例：<哪些 case 引用>
- 推荐 Prompt 注入位：reply.try_this / reply.name_it / reply.need
- 推荐阅读阶段：觉察 / 命名 / 表达 / 巩固
- 阅读难度：1~5
- 版本：v1
- 状态：published / draft / deprecated
- 备注：<引用注意>
```

## 4. 来源白名单

### 4.1 一级白名单（默认通过）
- 学术：APA、WHO、NIMH、CCMHC 公开版
- 主流心理学教科书（《津巴多》《伯恩斯新情绪疗法》等）
- 临床指南公开版
- 知名作者署名作品（《非暴力沟通》马歇尔·卢森堡、《被讨厌的勇气》岸见一郎、古贺史健 等）

### 4.2 二级白名单（同行 2 审）
- 国内心理学知名译者 / 学者作品
- 临床心理咨询师公开作品
- 大学公开课材料

### 4.3 拒绝清单
- ❌ 自媒体 / 公众号
- ❌ 玄学 / 星座 / 塔罗
- ❌ PUA / 反 PUA 极端话语
- ❌ 未经授权的「专家」头衔 / 机构背书
- ❌ 伪科学疗法（前世催眠 / 能量疗愈 等）

## 5. 审校工作流

```
收集候选书 → KE 初审（来源 / 立场）→ 一审
   → 同行 1 审（KE 其他成员）→ 二审
   → 切片提取（chunk-extract prompt）→ 切片审校
   → Q 红线用例演练 → 通过
   → PM 业务签字 → PE 语气校准
   → 发布
```

## 6. 季度复核

- 12 个月内未复核的书籍标「待审」
- 复核人：原作者 + 1 位非原作者
- 复核结果：保持 / 更新 / 弃用
- 复核记录写入 `books/audit/YYYY-Q.md`

## 7. 弃用规则

- 安全事件 → 1h 内下架
- 引用错误 → 24h 内下架
- 内容过时 → 季度评审时弃用
- 弃用走 `deprecation_reason` 字段，禁止直接删除

## 8. 关联文档

| 关联 | 路径 |
| --- | --- |
| 架构总览 | `knowledge/00-Overview.md` |
| 切片 | `knowledge/chunks/README.md` |
| 标签 | `knowledge/tags/README.md` |
| 案例 | `knowledge/cases/README.md` |
| KB 提示词 | `knowledge/prompts/` |
| 安全 | `rules/safety.md` |
