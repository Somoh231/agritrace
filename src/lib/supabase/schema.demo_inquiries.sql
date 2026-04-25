-- Demo / contact inquiries (CRM-lite). Run after schema.sql.
-- Inserts are performed via API route using the service role (no public insert policy).

create table if not exists demo_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  organization text,
  phone text,
  message text,
  source text not null default 'request_demo',
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  admin_notes text
);

create index if not exists demo_inquiries_created_at_idx on demo_inquiries (created_at desc);
create index if not exists demo_inquiries_status_idx on demo_inquiries (status);

alter table demo_inquiries enable row level security;

drop policy if exists demo_inquiries_super_select on demo_inquiries;
create policy demo_inquiries_super_select on demo_inquiries
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

drop policy if exists demo_inquiries_super_update on demo_inquiries;
create policy demo_inquiries_super_update on demo_inquiries
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );
