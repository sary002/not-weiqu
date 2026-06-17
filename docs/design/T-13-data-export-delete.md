# T-13 · 数据导出 / 删除 设计稿

> **任务**：T-13（plans/m2-poc.md §任务清单）
> **Owner**：BE
> **Reviewer**：A、PM、Q、PE
> **阶段**：调研 + 设计（**未实施，不修改 src/**）
> **关联**：`docs/05-API-Design.md` §9.11、`rules/safety.md` S-3 隐私最小化、`docs/04-Database-Design.md`（占位）

---

## 1. 现状分析

### 1.1 已有实现（v1.0 保留）

仓库已存在两个路由文件：

| 文件 | 方法 | 行为 | 缺口 |
| --- | --- | --- | --- |
| `src/app/api/data-requests/route.ts` | `POST` | 生成 UUID + `pending` 状态 + 24h SLA，限流 2/天，返回 `202` | 无入库、无 Worker、无错误码字典（仅 `NW-ST-0001`）、无入参校验 |
| `src/app/api/data-requests/[id]/route.ts` | `GET` | 返回一个**临时拼装**的 pending 对象（不查库） | 不存在的 ID 也返回 200；状态永远是 `pending`；没有 `delete` 完成态处理 |

### 1.2 与 API 契约差距

对照 `docs/05-API-Design.md` §9.11 / §7.2 错误码：

- 缺 `NW-DA-0001`（受理）字典项 → 当前错误体仅 500
- 缺 `NW-DA-0002`（SLA 超时）触发路径
- 缺数据导出 JSON 结构定义（§9.11 未给 schema）
- 缺删除 SLA 24h 的真正 Worker（M1 内存态只够 mock）
- 缺隐私最小化合规检查（`rules/safety.md` S-3）

### 1.3 本稿目标

在不修改 `src/` 的前提下，把 §2 / §3 / §4 / §5 / §6 / §7 用 markdown 落地，作为 M2 实施 + Q 验收的契约。

---

## 2. API 契约

> 路径：`/api/v1/data-requests`（跟随 `docs/05-API-Design.md` §3.1 的 `/v1` 前缀策略；当前 `src/app/api/data-requests/` 是无版本占位，**实施时迁回 `/api/v1/`**）。

### 2.1 `POST /api/v1/data-requests` — 创建导出/删除请求

**鉴权**：设备 token（匿名）**或** 已登录 access_token
**限流**：2 req / day / device（沿用 §8.1）
**幂等**：`X-Idempotency-Key` 必填，命中同 key 24h 内返回首次结果

请求：

```json
{
  "data": { "type": "export" | "delete" },
  "meta": { "client_msg_id": "uuid" }
}
```

响应（`202 Accepted`，参考 §5.2 / §9.11）：

```json
{
  "data": {
    "id": "uuid",
    "type": "export",
    "status": "pending",
    "requested_at": "2026-06-17T03:11:00Z",
    "sla_due_at": "2026-06-18T03:11:00Z"
  },
  "meta": { "trace_id": "...", "server_time": "2026-06-17T03:11:00Z" }
}
```

**业务规则**：

1. `type` 仅接受 `export` / `delete`，其它值 → `400 NW-DA-0010`
2. 当天已存在同 `type` 的 `pending`/`processing` 请求 → `409 NW-DA-0011`（防误删二次确认）
3. `delete` 类型必须在 body 加 `"confirm": true`，缺省 → `400 NW-DA-0010`（红线：删除二次确认）

### 2.2 `GET /api/v1/data-requests/[id]` — 查询状态

**鉴权**：必须是请求创建者（同 device_token / user_id）
**限流**：60 req / min / device（沿用 §8.1）
**响应（200）**：

```json
{
  "data": {
    "id": "uuid",
    "type": "delete",
    "status": "pending|processing|completed|failed",
    "requested_at": "...",
    "sla_due_at": "...",
    "completed_at": null,
    "download_url": null,
    "expires_at": null
  },
  "meta": { "trace_id": "...", "server_time": "..." }
}
```

| 字段 | 何时出现 |
| --- | --- |
| `download_url` | 仅 `type=export` 且 `status=completed`；签名 URL，**24h 过期** |
| `expires_at` | 同上，与 `download_url` 同步 |
| `failure_reason` | 仅 `status=failed`；返回 `NW-DA-0002` |

---

## 3. 错误码定义（增量）

> 错误体结构遵循 `docs/05-API-Design.md` §7.1；字典扩展 `src/lib/utils/error.ts` 的 `ApiErrorCode` 与 `ERROR_CATALOG`。

| Code | HTTP | user_message | action_hint | 含义 |
| --- | --- | --- | --- | --- |
| `NW-DA-0001` | 202 | 已收到，我们会处理。 | `none` | 数据请求已受理（保留 v1 字典） |
| `NW-DA-0002` | 500 | 处理超时，请联系我们。 | `contact_support` | SLA 超时（保留 v1 字典） |
| **`NW-DA-0010`** | 400 | 请求格式不对，再检查一下。 | `none` | **新增**：参数校验失败（type 非法 / 缺 confirm / 缺幂等键） |
| **`NW-DA-0011`** | 409 | 上一次请求还在处理中，先看看它怎么样了。 | `none` | **新增**：同 type 已有进行中请求（防误删/重复导出） |

> 字典示例（待 `src/lib/utils/error.ts` 增量更新）：
> ```ts
> 'NW-DA-0010': { http: 400, user_message: '请求格式不对，再检查一下。' },
> 'NW-DA-0011': { http: 409, user_message: '上一次请求还在处理中，先看看它怎么样了。' },
> ```

---

## 4. 数据导出 JSON 结构（无 PII）

> **强约束**：遵循 `rules/safety.md` S-3 隐私最小化。**任何 PII 不进 JSON**：姓名 / 手机 / 身份证 / 通讯录 / 精确地理位置 / 第三方可识别关系。

### 4.1 导出包顶层

```json
{
  "schema_version": "1.0.0",
  "exported_at": "2026-06-17T03:11:00Z",
  "user_hash": "sha256(device_token+salt)[:16]",
  "app_version": "2.0.7",
  "data": {
    "profile":   { ... },
    "scripts":   [ ... ],
    "conversations": [ ... ],
    "drills":    [ ... ],
    "progress":  { ... }
  }
}
```

### 4.2 各 section 字段白名单

| section | 字段 | 备注 |
| --- | --- | --- |
| `profile` | `low_pressure_mode`, `rest_days_remaining`, `gentle_streak.current_days`, `scene_tags[]`, `created_at` | **不含** 设备指纹原文、IP |
| `scripts` | `id`, `title`, `scene_tag`, `content`, `created_at`, `updated_at` | 内容已是用户文本，不二次清洗 |
| `conversations` | `id`, `type`, `started_at`, `ended_at`, `messages[]: { role, content, created_at }` | 仅元数据 + 用户原文；不含 AI 思考过程 |
| `drills` | `id`, `skill_id`, `steps[]: { step_no, user_input, ai_opener_id, counter_id }` | 仅用户输入与所选项 |
| `progress` | `buckets: { ... }`, `gentle_streak_history[]: { date, practiced }` | 不含时段 / 时长分布 |

### 4.3 排除清单（CI grep 自检）

```bash
grep -rE "name|phone|email|id_card|身份证|geolocation|lat|lng|ip" \
  src/app/api/data-requests/export.ts  # 实施时
```

任何命中 → CI 失败（参考 §5 红线）。

---

## 5. 数据删除 SLA 24h 实现思路

> 当前 `route.ts` 仅返回 `pending`；真正的删除是异步 Worker 责任。本节是**接口预留 + 注释契约**，不写实现。

### 5.1 Worker 接口预留（注释形态）

```ts
// src/workers/data-request-worker.ts  (预留，本稿不实现)
//
// 触发：Redis Stream 'data.requested' (docs/05-API-Design.md §13.1)
// 责任：
//   1. export → 拼装 §4 JSON → 上传到对象存储 → 签发 24h URL → 写 download_url
//   2. delete → 跨表软删（conversations/scripts/drills/profile/progress/gstreak）
//              → 写 audit_log
//   3. SLA 监控：sla_due_at < now() && status ∈ {pending, processing} → 标记 failed
//                 并发出告警（P0），返回 NW-DA-0002 给客户端
// 幂等：以 (id) 为唯一键，状态机翻转不可回退
//   pending → processing → completed | failed
// 隐私：Worker 内禁止任何 println 原文；日志仅 trace_id 与 id
```

### 5.2 状态机

```
   POST 命中
     │
     ▼
  pending  ───Worker 拉起───▶  processing  ───成功───▶  completed
     │                              │
     │                              └──失败/超时───▶  failed (NW-DA-0002)
     │
     └──SLA 24h 到期未处理───▶  failed (NW-DA-0002)
```

### 5.3 审计日志

每次状态翻转写 `audit_log`（不进导出 JSON）：

| 字段 | 说明 |
| --- | --- |
| `event` | `data.requested` / `data.started` / `data.completed` / `data.failed` |
| `data_request_id` | UUID |
| `actor` | `system` / `worker:<id>` |
| `trace_id` | 与 API 链路一致 |
| `at` | ISO 8601 |

---

## 6. 关键代码片段：`route.ts` 核心 handler（≤ 100 行）

> 仅展示**接口契约层**的最小实现骨架，**正式实施时**还要接 Supabase / Worker。当前文件结构与下方 1:1 对齐后可平滑替换。

```ts
// src/app/api/data-requests/route.ts  —— 设计稿示意，非最终代码
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { uuid } from '@/lib/utils/id';
import { jsonError } from '@/lib/utils/error';
import { withTrace, withRateLimit, withIdempotency } from '@/lib/api/middleware';

const Body = z.discriminatedUnion('type', [
  z.object({ type: z.literal('export') }),
  z.object({ type: z.literal('delete'), confirm: z.literal(true) }),
]);

export async function POST(req: NextRequest) {
  const { trace_id } = withTrace(req);

  // 1) 限流：2 req / day / device（API §8.1）
  const rl = withRateLimit('data:request', 2, 24 * 3600 * 1000);
  if (!rl.ok) return rl.response;

  // 2) 幂等
  const idem = withIdempotency(req);
  if (!idem.ok) return idem.response;

  // 3) 入参校验
  let body: z.infer<typeof Body>;
  try {
    const raw = await req.json();
    body = Body.parse(raw); // 失败抛 ZodError
  } catch {
    return jsonError('NW-DA-0010', trace_id); // 400
  }

  // 4) 防重复（pending/processing 同 type 仅一份）
  //    实际查 DB；此处仅示意
  // const exists = await db.dataRequests.findActive(type);
  // if (exists) return jsonError('NW-DA-0011', trace_id);

  // 5) 入库 + 投递给 Worker
  const id = uuid();
  const item = {
    id,
    type: body.type,
    status: 'pending' as const,
    requested_at: new Date().toISOString(),
    sla_due_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  };
  // await db.dataRequests.create(item);
  // await stream.publish('data.requested', { id, type: body.type, trace_id });

  return NextResponse.json(
    { data: item, meta: { trace_id, server_time: new Date().toISOString() } },
    { status: 202 },
  );
}
```

`GET /api/v1/data-requests/[id]/route.ts` 升级要点：

1. 鉴权：`device_token` 必须等于创建者持有的 token，否则 `403 NW-AU-0002`
2. 不存在的 ID → `404 NW-DA-0010`（不复用 400，避免泄漏存在性 —— 选 404 是折中）
3. `download_url` 仅 `type=export` 且 `completed` 时返回，签名 24h 过期
4. 错误体**绝不返回**请求原文（避免日志/响应层 PII 泄漏）

---

## 7. 测试用例设计（3 个核心 case）

> 详细测试集由 Q 在 T-16 红线用例中扩展，本节只覆盖核心契约点。

### 7.1 Case A：创建导出请求（happy path）

| 步骤 | 期望 |
| --- | --- |
| POST `/v1/data-requests` body=`{"data":{"type":"export"}}`，头含 `X-Idempotency-Key: K1` | `202` + `data.id` 存在 + `status=pending` + `sla_due_at` = requested_at + 24h |
| 同 key 再发一次 | `202` + **同一 `id`**（幂等命中） |
| 不带 `X-Idempotency-Key` | `400 NW-DA-0010` |

### 7.2 Case B：删除请求的二次确认

| 步骤 | 期望 |
| --- | --- |
| POST body=`{"data":{"type":"delete"}}`（缺 `confirm`） | `400 NW-DA-0010`（Zod 校验失败） |
| POST body=`{"data":{"type":"delete","confirm":true}}` | `202` + `pending` |
| 同 device 当天再发一条 delete | `409 NW-DA-0011`（防误删） |

### 7.3 Case C：查询不存在 / 鉴权失败

| 步骤 | 期望 |
| --- | --- |
| GET `/v1/data-requests/<不存在的 uuid>` | `404 NW-DA-0010`（不复用 400，避免 ID 探测） |
| GET `/v1/data-requests/<他人 id>` 用本设备 token | `403 NW-AU-0002` |
| GET 触发限流（>60/min） | `429` + 标准限流错误体 |
| 24h 后查 `status=pending` 的 export 请求 | `data.status=failed` + `failure_reason` 指向 `NW-DA-0002` |

### 7.4 待 Q 扩展

- `export` JSON 结构反序列化：字段白名单与 §4.3 一致（grep 自检）
- Worker 失败注入：模拟对象存储 5xx → 状态机进入 `failed`
- 审计日志：状态翻转次数 = `requested → started → completed` 三条

---

## 8. 红线合规自检

| 红线（`CLAUDE.md` §5） | 本稿符合度 |
| --- | --- |
| ❌ 收集/展示用户真实身份信息 | ✅ §4 导出结构不含姓名/手机/身份证/IP；user_hash 仅 sha256 截断 |
| ❌ 在 `docs/` 没对齐前生成业务代码 | ✅ 本稿仅 markdown；§6 代码片段标注「设计稿示意，非最终代码」 |
| ❌ 单一 Agent 独自拍板 L2/L3 决策 | ✅ 标注 Reviewer = A/PM/Q/PE，待升档评审 |

`rules/safety.md` S-3 隐私最小化：

- ✅ 默认匿名（device_token）；user_hash 不含可逆原文
- ✅ §4.2 字段白名单 + §4.3 排除清单 + CI grep 自检
- ✅ 删除二次确认（confirm=true）写入契约

---

## 9. Follow-up

1. **`/api/v1/` 路径迁移**：当前 `src/app/api/data-requests/` 是无版本占位；实施时与 §3.1 对齐
2. **`src/lib/utils/error.ts` 增量更新**：新增 `NW-DA-0010` / `NW-DA-0011` 两个字典项
3. **Worker 触发通道**：选 Redis Stream（MVP）还是 BullMQ？需要 A 拍板 ADR
4. **对象存储选型**：导出 JSON 落到 S3 / R2 / Supabase Storage？SLA 24h 与下载 24h 签名 URL 的双窗口需明确
5. **审计日志保留期**：建议 ≥ 180 天以满足合规回溯；待 PM/法务定
6. **跨设备同步**：M2 暂缓；若用户多设备，每个 device_token 各自持有一份独立请求，避免串扰
7. **Q 红线用例**：3 个核心 case 之外，T-16 应加入「导出 JSON 中 PII 0 命中」与「删除后 30 天内可恢复（软删）」的安全用例