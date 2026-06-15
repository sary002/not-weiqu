# tags · trauma/*

> 创伤类型标签。**注意**：标此类的切片 / 案例必须在 crisis 场景下禁召回。

| 二级 | 含义 | 风险等级 |
| --- | --- | --- |
| `trauma/童年忽视` | 童年情感忽视 | med |
| `trauma/原生家庭` | 原生家庭创伤 | med |
| `trauma/亲密关系暴力` | 亲密关系中的暴力 | high |
| `trauma/性侵` | 性侵犯 / 性骚扰 | high |
| `trauma/家暴` | 家庭暴力 | high |
| `trauma/言语暴力` | 长期言语贬低 | med |

## 硬约束
- ❌ 不在 crisis 场景下注入
- ❌ 不引具体创伤细节
- ✅ 仅用于 L1 觉察与 L4 兜底
- ✅ 必须配 `risk=med` 或 `high`

## 关联
- 标签总览：`knowledge/tags/README.md`
- 安全规则：`rules/safety.md`
