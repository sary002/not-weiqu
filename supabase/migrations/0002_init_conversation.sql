-- 0002_init_conversation.sql
-- 对话域：会话、消息、危机事件
-- 来自 docs/04-Database-Design.md §4.2

-- 会话
create table nw_conversation (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references nw_user_profile(id) on delete cascade,
  scenario_id uuid,
  type text not null check (type in ('free','drill','crisis')),
  status text not null check (status in ('active','ending','closed')) default 'active',
  started_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  closed_at timestamptz,
  summary text,
  key_facts jsonb default '{}'::jsonb,
  crisis_flag boolean default false,
  created_at timestamptz not null default now()
);

create index idx_nw_conversation_user_active
  on nw_conversation(user_id, last_active_at desc)
  where deleted_at is null;

create index idx_nw_conversation_crisis
  on nw_conversation(user_id) where crisis_flag = true;

-- 软删除
alter table nw_conversation add column deleted_at timestamptz;
create index idx_nw_conversation_active
  on nw_conversation(id) where deleted_at is null;

-- 消息（加密存储）
create table nw_message (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references nw_conversation(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content_enc bytea not null,
  content_hash text not null,
  token_in int,
  token_out int,
  model text,
  prompt_id text,
  prompt_version text,
  trace_id text not null,
  redacted boolean default false,
  crisis_hit boolean default false,
  created_at timestamptz not null default now()
);

create index idx_nw_message_conversation
  on nw_message(conversation_id, created_at);

create index idx_nw_message_hash
  on nw_message(content_hash);

create index idx_nw_message_trace
  on nw_message(trace_id);

-- 危机事件
create table nw_crisis_event (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references nw_user_profile(id) on delete cascade,
  conversation_id uuid references nw_conversation(id) on delete set null,
  message_id uuid references nw_message(id) on delete set null,
  type text not null check (type in ('self_harm','harm_others','acute_distress','violence','minor','perinatal')),
  severity text not null check (severity in ('low','med','high')),
  detected_by text not null check (detected_by in ('rule','model','hybrid')),
  follow_up text,
  created_at timestamptz not null default now()
);

create index idx_nw_crisis_event_user
  on nw_crisis_event(user_id, created_at desc);
