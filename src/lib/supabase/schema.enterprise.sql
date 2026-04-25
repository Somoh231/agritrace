-- AgriTrace Liberia — Enterprise readiness additions
-- Run AFTER schema.sql in Supabase SQL editor.

-- 1) Deactivate users without deleting them
alter table if exists public.profiles
  add column if not exists is_active boolean not null default true;

alter table if exists public.profiles
  add column if not exists deactivated_at timestamptz;

-- Optional: keep audit queries fast as volume grows
create index if not exists idx_audit_user_created on public.audit_log(user_id, created_at desc);

-- 2) Basic app settings (single-row, pilot-friendly)
create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  app_name text not null default 'AgriTrace',
  country text not null default 'Liberia',
  theme text not null default 'light' check (theme in ('light','dark')),
  logo_url text,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure one settings row exists
insert into public.app_settings (app_name, country)
select 'AgriTrace', 'Liberia'
where not exists (select 1 from public.app_settings);

alter table public.app_settings enable row level security;

drop policy if exists app_settings_read on public.app_settings;
create policy app_settings_read on public.app_settings
for select using (true);

drop policy if exists app_settings_write_admin on public.app_settings;
create policy app_settings_write_admin on public.app_settings
for all using ((select role from public.profiles where id = auth.uid()) = 'super_admin')
with check ((select role from public.profiles where id = auth.uid()) = 'super_admin');


