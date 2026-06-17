# ADR-002: 紧急联系人存储分阶段策略（M2 localStorage / M3 Supabase）

- **状态**：Proposed
- **日期**：2026-06-17
- **决策者**：A（主）+ PM（联合）+ KE（联合）
- **影响模块**：危机兜底 / 用户偏好 / 隐私合规
- **触发**：T-09 设计稿 §3.4 紧急联系人设计意图需 A 拍板存储形态

---

## 背景

### 问题

危机兜底页（T-09 设计稿 §3.3 线框）需要一个"紧急联系人"模块——让用户在危机时能一键联系预设的信任的人（家人 / 朋友 / 同事）。这涉及一个 L2 决策：

**用户的紧急联系人数据应该存在哪里？**

### 现状

| 项 | 值 |
| --- | --- |
| 紧急联系人 | **未实装**（T-09 设计稿 §3.2 当前 CrisisBanner gap） |
| 用户档案 | 仅 dev `demo-user`，无真实 auth |
| 数据库 | Supabase 占位（`src/lib/supabase/`），未接入生产 |
| 隐私约束 | `rules/safety.md` S-3 隐私最小化 + CLAUDE.md §5 红线 4 |
| M2 阶段 | 5 人封闭试用，无真实用户数据 |

### 关键约束

- **M2 PoC 周期 ≤ 8 周**，工期 50 人日；不允许为单个功能引入新基础设施
- **隐私最小化**（S-3）：只存必要字段，不追问关系标签
- **设备丢失风险可接受**：M2 是 5 人封闭试用，单机使用为主；M3+ 真实用户场景下需跨设备同步
- **危机路径独立**（S-3）：紧急联系人不应依赖任何 LLM / runtime，纯前端读取即可
- **Supabase schema 已锁定 M2 末追加**：M2 阶段不改 schema，M3 末一次性补 `profiles.emergency_contacts`

### 来自 T-09 设计稿的明确建议

> 数据存储：M2 PoC 阶段在 `localStorage`（避免引入 Supabase schema 改动）；M3 接入 Supabase 后迁移到 `profiles.emergency_contacts` 字段（A 需先写 ADR，PM 评估必要性，符合 S-3 隐私最小化）。

---

## 备选

### 选项 A：M2 localStorage + M3 Supabase（分阶段迁移）

- **M2 阶段**：
  - 数据存在浏览器 localStorage（key: `nw-emergency-contacts-v1`）
  - 不上传服务器，零隐私风险
  - 不需要新增 Supabase schema / 迁移 / RPC
  - 设备丢失 = 联系人丢失（M2 接受）
- **M3 阶段**：
  - 接入 Supabase `profiles.emergency_contacts JSONB` 字段
  - 跨设备同步
  - 写入前需 user 二次确认（含"我已知晓数据将上传到服务器"）
- **优点**：
  - M2 零成本（前端 1~2 人日实装）
  - 隐私风险最低（数据不上传）
  - M3 schema 变更集中管理（与 M3 末其他 profiles 字段一起）
- **缺点**：
  - M2 设备丢失 = 数据丢失
  - M2 跨设备不同步（封闭试用无此需求）
  - M3 需写迁移脚本（localStorage → Supabase）

### 选项 B：M2 直接上 Supabase（一次性到位）

- **M2 阶段**：
  - 立即新增 `profiles.emergency_contacts JSONB` 字段
  - 跑 migration
  - 接入 Supabase Auth + RLS
- **优点**：
  - M3 无需迁移
  - 真实用户场景一步到位
- **缺点**：
  - M2 阶段就要做 auth + RLS + 加密决策，工期 ≥ 5 人日
  - 5 人封闭试用阶段过早引入 auth 复杂度
  - 隐私风险更高（数据落库 = 数据泄露面增加）
  - 与 M2 整体节奏冲突（M2 是 PoC，不是生产）

### 选项 C：完全不做紧急联系人功能

- **优点**：0 成本
- **缺点**：
  - T-09 设计稿 §3.4 明确缺失
  - 危机兜底页少一个关键功能
  - 用户体验低于 prototype §6.8 期望

### 选项 D：本地加密存储 + 上传加密 blob（M2 中间态）

- **优点**：兼顾隐私 + 跨设备
- **缺点**：
  - 引入 Web Crypto API + 密钥派生（PBKDF2 / Argon2）成本 ≥ 3 人日
  - 用户每次新设备登录要重新输入密码派生密钥
  - 忘记密码 = 数据丢失
  - 与 M2 PoC 节奏严重不符

---

## 决策

我们选择 **选项 A：M2 localStorage + M3 Supabase（分阶段迁移）**，理由（按重要性排序）：

1. **匹配 M2 PoC 节奏**：1~2 人日实装（前端 only），不引入 schema 改动 / auth / RLS。
2. **隐私风险最低**：数据完全不上传服务器，符合 S-3 隐私最小化最强形态。
3. **危机路径独立**：兜底页 + 紧急联系人**完全不依赖任何 backend / runtime**——即使后端全挂，危机页 + 联系人仍可达。
4. **M3 集中迁移**：profiles 表所有扩展字段（emergency_contacts / today3_done_log / gentle_streak 等）一次性补 schema，比单字段零散加更稳。
5. **明确的迁移触发条件**：见下文「回滚条件 + 迁移触发」，避免悬而未决。

### 不选 B 的原因

- M2 PoC 阶段引入 auth + RLS 是杀鸡用牛刀，工期 +5 人日超出预算。
- 5 人封闭试用无真实隐私顾虑（参与者已知情同意）。

### 不选 C 的原因

- T-09 设计稿明确要求，缺失即设计稿 gap。
- 危机兜底页的核心价值之一就是"一键联系信任的人"，缺这个功能等于缺一条腿。

### 不选 D 的原因

- Web Crypto + 密钥派生是 M3+ 的复杂特性，不该出现在 M2 PoC。
- 用户体验差（每设备重新输密码派生）。

---

## 后果

### 得到

- ✅ M2 阶段紧急联系人功能完整可用
- ✅ 数据 100% 本地存储，零后端泄露面
- ✅ M2 危机路径**完全不依赖后端**（前端读 localStorage 即用）
- ✅ M3 schema 变更集中管理（profiles 表多字段一起加）
- ✅ 隐私声明清晰："只存在你设备上，不上传服务器"

### 失去

- ❌ M2 设备丢失 = 联系人丢失（**已记录为 M2 已知风险**）
- ❌ M2 跨设备不同步（封闭试用无此需求）
- ❌ M3 需写迁移脚本（M2 末一次性迁移）

### 风险

| ID | 风险 | 等级 | 缓解 |
| --- | --- | --- | --- |
| R-1 | M2 用户误以为是上传到云端 | P2 | 设置页明示 "只存在你设备上"；M3 迁移时再发通知 |
| R-2 | M3 迁移脚本出错（数据丢失） | P1 | M2 末保留 localStorage 不删；M3 迁移成功后用户二次确认后再清除 |
| R-3 | localStorage 被同源 XSS 读取 | P0 | 不引入第三方脚本；CSP 严格限制；后续评估 Web Crypto 加密（M3+） |
| R-4 | 用户填了真实姓名 / 手机后隐私顾虑 | P1 | 设置页顶部明确"自愿填写，可随时删除"；不追问关系标签 |
| R-5 | 兜底页加载时 localStorage 读取失败 | P1 | try/catch 包裹；失败时仅显示设置入口，不报错 |

### 回滚条件

满足任一即启动回滚评估（写 ADR-003）：

- M2 试用阶段 ≥ 1 个用户报告"设备丢了联系人没了"且影响继续参与意愿
- M3 真实用户接入前发现 localStorage 不可接受（如跨设备是硬需求）
- 安全审计发现 XSS 风险不可控

### M3 迁移触发条件

满足任一即启动 M3 迁移：

- M2 PoC 通过（5 人封闭试用 ≥ 80% 完成率）
- M3 启动（接入真实用户）
- Supabase auth 接入完成

迁移步骤（M3 末执行）：

1. BE 写 migration：`ALTER TABLE profiles ADD COLUMN emergency_contacts JSONB DEFAULT '[]'::jsonb;`
2. BE 写 RPC：`migrate_emergency_contacts(localstorage_data JSONB)` —— 一次性导入 + 返回迁移结果
3. FE 写引导页：M3 首次登录检测 localStorage 有数据 → 弹窗"是否上传到云端？" → 用户确认 → 调 RPC → 成功后清除 localStorage
4. KE 验证数据完整性 + RLS 策略（用户只能读写自己的 emergency_contacts）

---

## 安全与合规自检

- [x] **是否涉及 PII？**
  - **是**：`name` + `phone` 都是 PII
  - **缓解**：
    - M2 阶段数据 100% 本地，不上传
    - 设置页顶部明示"自愿填写，可随时删除"
    - 不追问关系标签 / 关系强度（避免过度收集）
    - 危机页加载时 try/catch 包裹
- [x] **是否影响用户情绪安全？**
  - **是**：紧急联系人是危机路径关键功能
  - **缓解**：
    - 兜底页**不**依赖后端读取（前端读 localStorage 立即可用）
    - 失败时优雅降级（仅显示设置入口）
    - 不在危机路径询问任何隐私问题
- [x] **是否需要 Q 红线用例？**
  - **是**：
    - 用例：localStorage 读取失败兜底（不崩）
    - 用例：填入空字符串 / 非法格式手机号校验
    - 用例：删除二次确认不可绕过
    - 用例：兜底页加载时无联系人（不显示空列表）
    - 用例：XSS 注入尝试（name 字段注入 `<script>`）

---

## 实施 checklist（M2 部署前必做）

| # | 项 | Owner | 阻断 |
| --- | --- | --- | --- |
| 1 | FE 实现 `/settings/emergency` 页面（设置 / 删除 / 二次确认） | FE | ✅ |
| 2 | FE 兜底页加载时读 `localStorage.nw-emergency-contacts-v1` | FE | ✅ |
| 3 | FE 失败降级：读不到 / 解析失败 → 仅显示设置入口 | FE | ✅ |
| 4 | FE 设置页顶部明示"只存在你设备上" | FE + PE | ✅ |
| 5 | Q 写 5 个红线用例（见上文「Q 红线用例」清单） | Q | ✅ |
| 6 | KE 知识库补"紧急联系人使用指引"段落（PE 守则补充） | KE + PE | ⚠️ 非阻断 |
| 7 | CI grep 检查：拒绝将 emergency_contacts 字段硬编码到 API 路由 | BE | ✅ |

---

## 数据契约

### M2 localStorage schema

```typescript
// localStorage key: nw-emergency-contacts-v1
type EmergencyContact = {
  id: string;          // crypto.randomUUID()
  name: string;        // 1~20 字，自由文本
  phone: string;       // E.164 或国内手机号格式（FE 校验）
  created_at: number;  // Date.now()
};

type EmergencyContactsStorage = {
  version: 1;
  contacts: EmergencyContact[];  // 1~3 人
};
```

### M3 Supabase schema（M3 末追加）

```sql
-- profiles.emergency_contacts JSONB
ALTER TABLE profiles
  ADD COLUMN emergency_contacts JSONB DEFAULT '[]'::jsonb
  CHECK (jsonb_array_length(emergency_contacts) <= 3);

-- RLS policy
CREATE POLICY "Users manage own emergency contacts"
  ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

---

## 关联

- **设计稿**：`docs/design/T-09-crisis-fallback.md` §3.4 紧急联系人 + §11 follow-up F-1
- **用户故事**：`plans/m2-poc.md` S-PoC-04 阿瑶在自由对话里说"我今晚不想活了"
- **长期规划**：`docs/04-Database-Design.md` profiles 表（M3 末追加）
- **规则**：`rules/safety.md` S-3 隐私最小化
- **CLAUDE.md**：§5 红线 4 隐私最小化 + 红线 7 不做安全评审不上线情绪功能
- **任务**：`plans/m2-poc.md` T-09（独立验证）+ T-13（数据导出/删除）

---

## 决策追溯

| 决策点 | 来源 |
| --- | --- |
| M2 localStorage | T-09 设计稿 §3.4 + S-3 隐私最小化 |
| M3 Supabase 迁移 | T-09 设计稿 §11 F-1 + `08-Deployment-Plan.md` M3 真实用户接入节点 |
| 不追问关系标签 | T-09 设计稿 §3.4 字段约束 + S-3 隐私最小化 |
| 1~3 人上限 | T-09 设计稿 §3.4 "避免列表焦虑" |
| 删除二次确认 | S-6 设计红线 + T-09 设计稿 §3.4 |
| 设置页明示本地存储 | T-09 设计稿 §3.4 隐私声明 |
| M3 schema 一次性补多字段 | `plans/m2-poc.md` M3 末 schema 集中更新 |

---

> **签收**：本 ADR 由 A（主）+ PM + KE 联合产出，C 在 Q / FE / BE 评审通过后切换状态为 Accepted。
