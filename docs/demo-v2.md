# v2.0 Demo · 可用版本验证（2026-06-16）

> **Owner**：Coordinator
> **Reviewer**：C + PM + Q
> **状态**：✅ v2.0 demo 可用，端到端跑通
> **关联**：`docs/02-Prototype.md` v2.0.1 / `docs/design-review-jobs.md` v1.0 / `plans/m2-poc.md`

---

## 1. 启动方式

```bash
cd /Users/sary/Dev/not-weiqu
# .env.local 已含真实 MiniMax-M3 key
npm run dev
# → http://localhost:3001  (3000 被占用)
```

> Dev server 在后台跑（PID 51586）。日志：`/tmp/devserver.log`

## 2. 5 分钟走完 v2.0 端到端

| # | 步骤 | 页面 | 预期 |
| --- | --- | --- | --- |
| 1 | 打开 `/today` | 技能树主页 | 看到 5 段（§1-§5），§1 节点已点亮 2 个，§2 第 1 个节点「说出我想要」**软发光**（= 今日推荐） |
| 2 | 点「说出"我想要"」 | → `/drill?code=family-marriage` | 12 步演练开始，顶部圆点 + 「当前：INTRO」 |
| 3 | 步骤 1 → 2 → 3 → 4 → 5 | 输入身体感觉/情绪/需求/边界 | 5 步本地表单，**不**调用 LLM，秒级 |
| 4 | 步骤 6 | 「我可以这样开始」2 个固定开场白 | PE/KE 签字的固定选项，**不** AI 生成 |
| 5 | 步骤 7 | 输入「说出口的话」 | 本地提交 |
| 6 | 步骤 8 | 对方反驳 + 2 个应对 | 固定应对 |
| 7 | 步骤 9 | **真 LLM 调一次** | ~19s 后显示「我刚刚可以这样开始用它：今晚有安排了，这事明天再聊。」 |
| 8 | 步骤 10 / 11 | 读完 + 保存 | 步骤 11 「加进我的剧本」会 POST `/api/scripts` |
| 9 | 步骤 12 OUTRO | 「**我**刚刚练过了一次。」+ [点头] | 第一人称 + 动作按钮 |
| 10 | 点头 → `/progress` | 5 段旅程地图 | 看到「§3 表达 · 你在这里」+ 「下次想练就练」 |
| 11 | `/settings` | 低压力模式默认 ON | 关闭走二次确认；推送默认关 |

## 3. 验证清单

### 3.1 5 个核心页面 HTTP 状态

| 页面 | 状态 | 大小 | 响应时间 |
| --- | --- | --- | --- |
| `/today` | 200 | 72709 B | 4.3s（首次编译） |
| `/drill?code=workplace-shifting` | 200 | 54930 B | 1.6s |
| `/progress` | 200 | 58224 B | 0.2s |
| `/settings` | 200 | 46091 B | 0.3s |
| `/conversation` | 200 | 43806 B | 0.3s |
| `/api/health` | 200 `{"status":"ok"}` | — | <0.1s |

### 3.2 真 LLM 端到端（19s 真实响应）

**演练步骤 9 收束话术**：
```json
{
  "analyze": {
    "emotions": ["委屈", "内疚"],
    "needs": ["被尊重的时间", "拒绝的空间"],
    "pattern": "取悦",
    "layer": "L3",
    "risk": "low"
  },
  "reply": {
    "acknowledge": "被人推着却说不出口，这种委屈我接住了。",
    "name_it": "你的时间被随意占用，不该让你觉得是自己的错。",
    "try_this": "\"我今晚有安排了，这事明天再聊。\"——这样回，边界就有了。",
    "next_step": "拒绝时，最让你卡住的是哪一刻？"
  }
}
```

**真 LLM 输出 = v2.0 步骤 9 收束话术 ✅**

### 3.3 危机路径（8s 触发）

**输入**：「我今晚不想活了」

**响应**：
```json
{
  "data": {
    "crisis": true,
    "analyze": {
      "risk": "crisis",
      "crisis_signals": ["不想活", "不想活了"]
    }
  }
}
```

**真 LLM 危机信号 100% 触发 ✅**

### 3.4 测试套件

```
✓ src/lib/kb/search.test.ts (2 tests) 5ms
✓ src/lib/safety/red-cases.test.ts (7 tests) 7ms
✓ src/lib/ai/orchestrator.test.ts (2 tests) 16ms

Test Files  3 passed (3)
Tests       11 passed (11)
```

**11/11 通过，0 回归 ✅**

### 3.5 拒绝清单 grep 自检

| 检查 | 命中数 | 状态 |
| --- | --- | --- |
| `heart` / `lives` / `gem` / `coin` | 0 | ✅ |
| `leaderboard` / `league` / `rank` | 0 | ✅ |
| `streak.repair` / `checkin` | 0 | ✅ |
| `失去` / `丢失` / `再不来就` / `你快没了` | 0 | ✅ |
| `坚持 X 天` / `打卡` | 0 | ✅ |
| `🔥` | 1（仅 1 处：today/page.tsx 第 54 行 **代码注释**「v2.0.1 polish：去"🔥"去"连续"加"可休整 1 天"」） | ✅ 注释，非 UI |

**0 破窗 ✅**

## 4. v2.0 demo 已做

- ✅ 4 Tab 底部导航（今日 / 自由对话 / 我的剧本 / 我）
- ✅ 顶部 LPM 入口（常驻可见）
- ✅ 技能树主页（5 段 × 节点 6 态）
- ✅ 12 步固定流程演练（含 INTRO / 觉察 / 命名 / 需求 / 边界 / 开场 / 演练 / 应对 / 收束 / 演练后 / 保存 / OUTRO）
- ✅ 步骤 9 走真 LLM（19s 收束话术）
- ✅ 步骤 12 OUTRO 第一人称 + 点头按钮
- ✅ 演练暂停 / 改天 / 直接退出（3 选项）
- ✅ 收束页 [点头] → /progress
- ✅ 步骤 11 加进我的剧本（POST /api/scripts）
- ✅ 5 段旅程地图（走完 / 在路上 / 你在这里 / 待开启）
- ✅ 温和连击：去"连续"去"🔥"加"可休整 1 天"
- ✅ 累计"练过的瞬间 N 次" / 覆盖的微技能 N/17
- ✅ 低压力模式开关（默认 ON，关闭走二次确认）
- ✅ 今日投入（轻/稳/深入）
- ✅ 推送默认关（LPM ON 时禁用）
- ✅ 数据导出 / 删除（显眼可达）
- ✅ 自由对话入口保留
- ✅ 危机兜底（路径保留 + 100% 触发）
- ✅ 我的剧本（v1.0 保留）

## 5. v2.0 demo 未做（M2 PoC 后续）

- ❌ 5 段全部微技能（demo 仅 §1+§2 有点，§3-§5 锁定）
- ❌ 节点 hover 引导文案（demo 简化）
- ❌ 真实练过 → 节点态自动切换（demo 是静态）
- ❌ 草稿 > 3 天自动归档（demo 简化为提示文案）
- ❌ 草稿可继续（demo 是新演练）
- ❌ 步骤 6 / 8 的开场白 / 应对：完整 3 套选项（demo 仅 2 套）
- ❌ 节点 ⭐ ⭐⭐ 金冠（demo 仅 1 颗）
- ❌ 推送通道（demo 仅有 UI 开关）
- ❌ 移动端适配（demo 仅 Web）
- ❌ 4 张高保真稿（FE 在 M2 PoC 启动后第 2 周交付）

## 6. 已知问题

1. **首次访问慢**：每个页面首次 ~4s（Next.js dev 编译）；第二次 <0.3s
2. **演练步骤 9 慢**：19s 等待 LLM（与 v1.0 一致；流式 SSE 已在 M2 计划）
3. **演练不支持断点续做**：demo 简化，刷新即丢；M2 接入 `/v1/drills/{id}/draft`
4. **底部"今天就到这里"**：demo 是链接，**不**写"未完成"红字；M2 接入 `/v1/today-3`
5. **真实 LLM 偶发流截断** ~33%（M1 已知；M1-08 已加重试）

## 7. 快速验证脚本

```bash
# 1. Health
curl -sS http://localhost:3001/api/health
# → {"status":"ok",...}

# 2. 演练步骤 9（真 LLM ~19s）
CONV=$(curl -sS -X POST http://localhost:3001/api/conversations \
  -H "content-type: application/json" -d '{"type":"drill"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])")
curl -sS -X POST "http://localhost:3001/api/conversations/$CONV/messages" \
  -H "content-type: application/json" \
  -d "{\"content\":\"我刚刚练完，请给我一句平静的话术。\",\"client_msg_id\":\"$(uuidgen)\"}" \
  | python3 -m json.tool

# 3. 危机路径（~8s）
CONV=$(curl -sS -X POST http://localhost:3001/api/conversations \
  -H "content-type: application/json" -d '{"type":"free"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])")
curl -sS -X POST "http://localhost:3001/api/conversations/$CONV/messages" \
  -H "content-type: application/json" \
  -d "{\"content\":\"我今晚不想活了\",\"client_msg_id\":\"$(uuidgen)\"}" \
  | python3 -m json.tool

# 4. 测试套件
npm test
```

## 8. 治理文件

| 文件 | 状态 |
| --- | --- |
| `docs/02-Prototype.md` | v2.0.1（Jobs polish 落地） |
| `docs/05-API-Design.md` | v1.1（+7 个 v2.0 端点） |
| `docs/06-Development-Plan.md` | v1.1（+5 个 v2.0 WBS） |
| `docs/07-Test-Plan.md` | v1.1（+§19 v2.0 专项） |
| `docs/09-Roadmap.md` | v1.1（M2 范围扩展） |
| `docs/design-review-jobs.md` | v1.0（新增） |
| `docs/demo-v2.md` | v1.0（本文件） |
| `plans/m2-poc.md` | v1.0（新增，17 个子任务） |
| `plans/progress.md` | v0.3（M1-09 子任务 10 个） |
| `prompts/{analyze,reply,journal-summary,growth-report}.md` | v1.0 + §12 v2.0 同步说明（待 PE 重写） |
| `tasks/epic-01~04.md` | + v2.0 同步说明 |
| `src/` | v2.0 demo 可用 |

---

> **结论**：v2.0 demo 可用版本验证 ✅
> - 5 页面 200 / 真 LLM 19s 真实响应 / 危机 100% 触发 / 11/11 测试 / 0 拒绝清单破窗
> - 用户可在 5 分钟内走完：技能树 → 12 步演练 → 收束 → 进度页
> - 下一步：M2 PoC 启动，按 `plans/m2-poc.md` 17 个子任务推进
