# CI 集成指南 · 不委屈红线用例回归

> 本指南说明如何把 `run-redline.py` 接入 CI 系统(GitHub Actions / GitLab CI / Jenkins)。

---

## 1. GitHub Actions

### 1.1 快速集成

复制 `.github-workflow-example.yml` 到 `.github/workflows/redline.yml`,设置以下 secrets:

- `NOT_WEI_QU_API_URL`:不委屈 API 地址(如 `https://api.not-wei-qu.dev`)
- `NOT_WEI_QU_API_KEY`:API key(BE 提供)

### 1.2 触发条件

```yaml
on:
  pull_request:        # PR 触发
  schedule:            # 每日定时
  workflow_dispatch:   # 手动触发
```

### 1.3 退出码

- `0`:CI 通过
- `1`:危机用例未 100%(analyze)/ reply mock 未 100%(reply)
- `2`:通过率 < 阈值
- `3`:配置错误

CI 默认在 exit code != 0 时失败。

---

## 2. GitLab CI

```yaml
# .gitlab-ci.yml
redline:analyze:
  stage: test
  image: python:3.11
  script:
    - python3 agents/tester/run-redline.py --mode live
        --api-url "$NOT_WEI_QU_API_URL"
        --api-key "$NOT_WEI_QU_API_KEY"
        --report analyze-report.md
  artifacts:
    paths:
      - analyze-report.md
    expire_in: 30 days
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_PIPELINE_SOURCE == "schedule"

redline:reply:
  stage: test
  image: python:3.11
  script:
    - python3 agents/tester/run-redline.py --mode reply-live
        --api-url "$NOT_WEI_QU_API_URL"
        --api-key "$NOT_WEI_QU_API_KEY"
        --report reply-report.md
  artifacts:
    paths:
      - reply-report.md
    expire_in: 30 days
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_PEIQU_SOURCE == "schedule"
```

---

## 3. 本地开发(推荐)

```bash
# 1. 修改 prompt 后,先 mock 验证判分逻辑
python3 agents/tester/run-redline.py --mode mock --report local-analyze.md
python3 agents/tester/run-redline.py --mode reply-mock --report local-reply.md

# 2. 跑真实 LLM(需要 API key)
export NOT_WEI_QU_API_URL=https://api.not-wei-qu.dev
export NOT_WEI_QU_API_KEY=xxx
python3 agents/tester/run-redline.py --mode live --report local-analyze-live.md
python3 agents/tester/run-redline.py --mode reply-live --report local-reply-live.md

# 3. 只跑 M2 PoC 关键 10 条(L3-001)
python3 agents/tester/run-redline.py \
  --mode mock \
  --filter-kb kb-2026-l3-001-refuse-coworker \
  --report m2-poc.md
```

---

## 4. 阈值与通过条件

| 阶段 | 默认阈值 | 含义 |
|------|---------|------|
| **M2 PoC** | 94.6% | 35/37 通过,可上线 |
| **M3 启动** | 95.0% | 略高于 M2 |
| **M4 GA** | 98.0% | 接近 100% |

修改阈值:`--threshold 0.95`

---

## 5. 报告查看

### 5.1 Markdown 报告

```bash
cat analyze-report.md
```

报告章节:
1. 总览
2. 总体判定
3. 按 type 分布
4. 按 risk 分布
5. 按 layer 分布
6. 按 KB 分布
7. 失败用例(最多 50 条)
8. 结论与下一步

### 5.2 JSON 详细结果

```bash
python3 -c "
import json
data = json.load(open('analyze-results.json'))
print(f'Pass rate: {data[\"summary\"][\"pass_rate\"]:.2%}')
print(f'Failed cases: {len(data[\"summary\"][\"failed_cases\"])}')
for c in data['summary']['failed_cases'][:5]:
    print(f'  - {c[\"id\"]}: {c[\"failures\"]}')
"
```

---

## 6. 故障排查

### 6.1 通过率突降

1. 看 `analyze-report.md §7 失败用例` 找具体失败
2. 检查 prompt 是否改动
3. 检查 KB 是否改动(`agents/knowledge-engineer/kb/`)
4. 检查守则是否改动(`prompts/coach-not-judging.md`)

### 6.2 危机用例漏触发

1. 看失败用例的 `failures` 字段
2. 验证 `prompts/reply.md §6.3` 的 crisis_redirect 路径
3. 检查 `prompts/coach-not-judging.md §8` 危机话术

### 6.3 forbidden 词命中

1. grep 具体用例如 `grep "你好棒" reply-results.json`
2. 检查 prompt 是否引入了评判词
3. 回归 `prompts/coach-not-judging.md §2` J1-J7 清单

### 6.4 API 调用失败

1. 验证 `NOT_WEI_QU_API_URL` 可访问
2. 验证 `NOT_WEI_QU_API_KEY` 有效
3. 跑 mock 模式确认是 API 问题还是 prompt 问题

---

## 7. 关联文档

| 关联 | 路径 |
|------|------|
| 评测集 README | `agents/prompt-engineer/evals/README.md` |
| analyze 评测集 | `agents/prompt-engineer/evals/analyze-kb-scenarios.v1.jsonl` |
| reply 评测集 | `agents/prompt-engineer/evals/reply-kb-scenarios.v1.jsonl` |
| 红线用例 | `agents/tester/red-line-cases/*.jsonl` |
| 覆盖率报告 | `agents/tester/red-line-cases/COVERAGE-REPORT.md` |
| Q checklist | `docs/quality/gamification-safety-checklist.md` |
| M2 PoC | `plans/m2-poc.md` |