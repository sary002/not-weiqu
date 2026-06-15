-- 0006_rls_policies.sql
-- 行级安全：用户只能访问自己的资源
-- 来自 docs/04-Database-Design.md §4.6 / docs/05-API-Design.md §6.3

-- 启用 RLS
alter table nw_user_profile enable row level security;
alter table nw_user_preference enable row level security;
alter table nw_conversation enable row level security;
alter table nw_message enable row level security;
alter table nw_crisis_event enable row level security;
alter table nw_script enable row level security;
alter table nw_progress enable row level security;
alter table nw_milestone enable row level security;
alter table nw_drill_draft enable row level security;
alter table nw_data_request enable row level security;

-- 公共只读表（场景、危机资源）
alter table nw_scenario enable row level security;

-- 用户档案
create policy "own profile read"
  on nw_user_profile for select
  using (auth.uid()::text = id::text);

create policy "own profile update"
  on nw_user_profile for update
  using (auth.uid()::text = id::text);

-- 偏好
create policy "own preference all"
  on nw_user_preference for all
  using (auth.uid()::text = user_id::text);

-- 会话
create policy "own conversation all"
  on nw_conversation for all
  using (auth.uid()::text = user_id::text);

-- 消息
create policy "own message all"
  on nw_message for all
  using (
    exists (
      select 1 from nw_conversation c
      where c.id = nw_message.conversation_id
        and auth.uid()::text = c.user_id::text
    )
  );

-- 危机事件（仅写）
create policy "own crisis event insert"
  on nw_crisis_event for insert
  with check (auth.uid()::text = user_id::text);

create policy "own crisis event read"
  on nw_crisis_event for select
  using (auth.uid()::text = user_id::text);

-- 剧本
create policy "own script all"
  on nw_script for all
  using (auth.uid()::text = user_id::text);

-- 进度
create policy "own progress all"
  on nw_progress for all
  using (auth.uid()::text = user_id::text);

-- 里程碑
create policy "own milestone all"
  on nw_milestone for all
  using (auth.uid()::text = user_id::text);

-- 演练草稿
create policy "own drill draft all"
  on nw_drill_draft for all
  using (auth.uid()::text = user_id::text);

-- 数据请求
create policy "own data request all"
  on nw_data_request for all
  using (auth.uid()::text = user_id::text);

-- 场景：仅 published 可读
create policy "scenario public read"
  on nw_scenario for select
  using (status = 'published');
