-- Notification system v2. Run after schema.sql.

do $$ begin
  create type notification_tone as enum ('info', 'warning', 'danger');
exception
  when duplicate_object then null;
end $$;

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- null = broadcast to all authenticated users
  user_id uuid references profiles(id),
  title text not null,
  detail text,
  href text,
  tone notification_tone not null default 'info',
  pinned boolean not null default false,
  important boolean not null default false
);

create index if not exists notifications_created_at_idx on notifications (created_at desc);
create index if not exists notifications_user_id_idx on notifications (user_id);
create index if not exists notifications_pinned_idx on notifications (pinned);

create table if not exists notification_reads (
  notification_id uuid not null references notifications(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

create index if not exists notification_reads_user_idx on notification_reads (user_id, read_at desc);

alter table notifications enable row level security;
alter table notification_reads enable row level security;

-- Users can read their own notifications + broadcasts
drop policy if exists notifications_read on notifications;
create policy notifications_read on notifications
  for select using (
    auth.uid() is not null and (user_id is null or user_id = auth.uid())
  );

-- Only super_admin can create/update notifications (broadcasts and targeted)
drop policy if exists notifications_super_write on notifications;
create policy notifications_super_write on notifications
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

-- Users can mark read for themselves
drop policy if exists notification_reads_self on notification_reads;
create policy notification_reads_self on notification_reads
  for all using (auth.uid() = user_id);

