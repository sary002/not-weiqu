-- 0004_init_kb.sql
-- 知识域：知识块（向量化用 pgvector）
-- 来自 docs/04-Database-Design.md §4.4

create extension if not exists vector;

-- 知识块
create table nw_kb_block (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  one_liner text not null,
  layer text not null check (layer in ('L1','L2','L3','L4','L5')),
  scene_tags text[] not null default '{}',
  difficulty int not null check (difficulty between 1 and 5),
  applicable text not null,
  not_applicable text not null,
  source_name text not null,
  source_url text not null,
  source_version text not null,
  risk_notes text not null,
  body text not null,
  embedding vector(1024),
  tags text[] not null default '{}',
  reviewed_at timestamptz,
  reviewed_by text,
  status text not null check (status in ('draft','published','deprecated')) default 'draft',
  version int not null default 1,
  created_at timestamptz not null default now()
);

create index idx_nw_kb_block_status
  on nw_kb_block(status) where status = 'published';

create index idx_nw_kb_block_tags
  on nw_kb_block using gin (tags);

create index idx_nw_kb_block_scene_tags
  on nw_kb_block using gin (scene_tags);

create index idx_nw_kb_block_layer
  on nw_kb_block using gin (layer);

create index idx_nw_kb_block_embedding
  on nw_kb_block using hnsw (embedding vector_cosine_ops);

-- 知识块审计
create table nw_kb_audit (
  id uuid primary key default uuid_generate_v4(),
  kb_id uuid not null references nw_kb_block(id) on delete cascade,
  action text not null check (action in ('create','update','publish','deprecate')),
  operator text not null,
  diff jsonb not null,
  created_at timestamptz not null default now()
);

create index idx_nw_kb_audit_kb
  on nw_kb_audit(kb_id, created_at desc);
