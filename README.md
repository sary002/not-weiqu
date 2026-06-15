# 不委屈（Not委屈）

> 帮善良的人学会有锋芒 — AI 驱动的边界成长陪伴平台

## 技术栈

- **Framework**：Next.js 15（App Router）
- **Language**：TypeScript（strict）
- **UI**：TailwindCSS + Shadcn UI
- **Backend / DB**：Supabase（PostgreSQL + Auth + RLS）
- **AI**：LLM 抽象层（主备路由，本地 mock 用于开发）

## 设计文档

- 产品 PRD：`docs/01-PRD.md`
- 系统架构：`docs/03-System-Architecture.md`
- 数据库：`docs/04-Database-Design.md`
- API：`docs/05-API-Design.md`
- 安全规则：`rules/safety.md`

## 治理与开发计划

- 8 Agent 角色：`agents/`
- 4 大规则：`rules/`
- 9 份设计文档：`docs/0*.md`
- 4 大 Epic 任务树：`tasks/epic-*.md`
- 4 份主 Prompt：`prompts/*.md`
- 53 份知识库资产：`knowledge/`
- 进度跟踪：`plans/progress.md`

## 启动

```bash
cp .env.example .env
# 填入 Supabase 凭据
npm install
supabase start
supabase db reset
npm run dev
```

## 目录

```
src/
├── app/                    # Next.js App Router
│   ├── (onboarding)/       # Onboarding 流程
│   ├── (app)/              # 主应用
│   └── api/                # Route Handlers（API）
├── components/
│   ├── ui/                 # Shadcn UI 组件
│   ├── layout/             # 全局布局
│   ├── conversation/       # 对话相关
│   ├── drill/              # 演练相关
│   └── progress/           # 复盘相关
├── lib/
│   ├── supabase/           # Supabase 客户端 + 类型
│   ├── ai/                 # LLM 编排
│   ├── safety/             # 危机检测
│   ├── kb/                 # 知识库
│   └── utils/              # 工具
└── hooks/                  # React Hooks
```
