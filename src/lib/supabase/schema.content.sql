create table if not exists public.public_content_blocks (
  key text not null,
  locale text not null default 'en',
  value jsonb not null default '{}'::jsonb,
  updated_by uuid null references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (key, locale)
);

alter table public.public_content_blocks enable row level security;

drop policy if exists "public_content_blocks_read_anon" on public.public_content_blocks;
create policy "public_content_blocks_read_anon"
on public.public_content_blocks
for select
to anon, authenticated
using (true);

