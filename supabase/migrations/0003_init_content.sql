-- 0003_init_content.sql
-- 内容域：场景、剧本、进度、里程碑
-- 来自 docs/04-Database-Design.md §4.3

-- 场景
create table nw_scenario (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  title text not null,
  one_liner text not null,
  layer text not null check (layer in ('L1','L2','L3','L4','L5')),
  scene_tags text[] not null default '{}',
  difficulty int not null check (difficulty between 1 and 5),
  status text not null check (status in ('draft','published','archived')) default 'draft',
  owner_agent text not null default 'KE',
  reviewed_at timestamptz,
  reviewed_by text,
  version int not null default 1,
  created_at timestamptz not null default now()
);

create index idx_nw_scenario_status
  on nw_scenario(status) where status = 'published';

create index idx_nw_scenario_tags
  on nw_scenario using gin (scene_tags);

-- 剧本
create table nw_script (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references nw_user_profile(id) on delete cascade,
  title text not null,
  scene_tag text not null,
  content_enc bytea not null,
  source text not null check (source in ('ai','user_edit','community_pick')) default 'ai',
  ai_drill_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_nw_script_user
  on nw_script(user_id, created_at desc);

create index idx_nw_script_tag
  on nw_script(user_id, scene_tag);

create trigger trg_nw_script_touch
  before update on nw_script
  for each row execute function nw_touch_updated_at();

-- 进度
create table nw_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references nw_user_profile(id) on delete cascade,
  bucket text not null,
  count int not null default 0,
  last_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, bucket)
);

create index idx_nw_progress_user
  on nw_progress(user_id, last_at desc);

-- 里程碑
create table nw_milestone (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references nw_user_profile(id) on delete cascade,
  title text not null,
  happened_at date not null,
  created_at timestamptz not null default now()
);

create index idx_nw_milestone_user
  on nw_milestone(user_id, happened_at desc);

-- 演练草稿
create table nw_drill_draft (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references nw_user_profile(id) on delete cascade,
  scenario_id uuid references nw_scenario(id) on delete set null,
  conversation_id uuid references nw_conversation(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  paused_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index idx_nw_drill_draft_user
  on nw_drill_draft(user_id, paused_at desc);

create index idx_nw_drill_draft_expires
  on nw_drill_draft(expires_at);
