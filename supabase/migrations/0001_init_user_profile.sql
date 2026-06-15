-- 0001_init_user_profile.sql
-- 用户域：匿名档案、偏好
-- 来自 docs/04-Database-Design.md §4.1

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 用户匿名档案
create table nw_user_profile (
  id uuid primary key default uuid_generate_v4(),
  device_hash text not null unique,
  user_token_hash text,
  display_alias text,
  preferred_tone text check (preferred_tone in ('calm_warm','calm_brief','gentle_firm')),
  preferred_scenario text[] default '{}',
  reduced_motion boolean default false,
  progress_disabled boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_nw_user_profile_user_token on nw_user_profile(user_token_hash) where user_token_hash is not null;
create index idx_nw_user_profile_active on nw_user_profile(id) where deleted_at is null;

-- 用户偏好
create table nw_user_preference (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references nw_user_profile(id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

create index idx_nw_user_preference_user on nw_user_preference(user_id);

-- updated_at 触发器
create or replace function nw_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_nw_user_profile_touch
  before update on nw_user_profile
  for each row execute function nw_touch_updated_at();

create trigger trg_nw_user_preference_touch
  before update on nw_user_preference
  for each row execute function nw_touch_updated_at();
