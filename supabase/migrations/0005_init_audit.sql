-- 0005_init_audit.sql
-- 审计域：审计事件、数据请求
-- 来自 docs/04-Database-Design.md §4.5

-- 审计事件（不存原文，只存事件）
create table nw_audit_event (
  id uuid primary key default uuid_generate_v4(),
  user_id_hash text,
  trace_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_nw_audit_event_type_time
  on nw_audit_event(event_type, created_at desc);

create index idx_nw_audit_event_trace
  on nw_audit_event(trace_id);

-- 数据请求
create table nw_data_request (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references nw_user_profile(id) on delete cascade,
  type text not null check (type in ('export','delete')),
  status text not null check (status in ('pending','running','done','failed')) default 'pending',
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  sla_due_at timestamptz not null default (now() + interval '24 hours'),
  result_url text,
  error text
);

create index idx_nw_data_request_user
  on nw_data_request(user_id, requested_at desc);

create index idx_nw_data_request_sla
  on nw_data_request(status, sla_due_at) where status in ('pending','running');
