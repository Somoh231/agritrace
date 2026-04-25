-- Lightweight analytics (optional). Run after schema.sql.
-- Inserts are done via API (service role). No client insert policy.

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references profiles(id),
  event text not null,
  path text,
  module text,
  payload jsonb
);

create index if not exists analytics_events_created_at_idx on analytics_events (created_at desc);
create index if not exists analytics_events_event_idx on analytics_events (event);

alter table analytics_events enable row level security;

drop policy if exists analytics_events_super_select on analytics_events;
create policy analytics_events_super_select on analytics_events
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

