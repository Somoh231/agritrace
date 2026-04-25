-- AgriTrace — Data integrity + pilot workflow hardening
-- Run AFTER schema.sql and schema.enterprise.sql

-- ---------------------------------------------------------------------------
-- 1) Location inventory opening balances (per location + commodity)
-- ---------------------------------------------------------------------------
create table if not exists public.location_inventory_opening (
  location_id uuid not null references public.locations(id) on delete cascade,
  commodity public.commodity_type not null,
  opening_kg numeric(14, 2) not null default 0,
  effective_from date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (location_id, commodity)
);

create index if not exists idx_inv_opening_location on public.location_inventory_opening(location_id);

alter table public.location_inventory_opening enable row level security;

drop policy if exists inv_opening_org on public.location_inventory_opening;
create policy inv_opening_org on public.location_inventory_opening
for all
using (
  location_id in (
    select id from public.locations
    where organization_id = (select organization_id from public.profiles where id = auth.uid())
  )
  or (select role from public.profiles where id = auth.uid()) = 'super_admin'
)
with check (
  location_id in (
    select id from public.locations
    where organization_id = (select organization_id from public.profiles where id = auth.uid())
  )
  or (select role from public.profiles where id = auth.uid()) = 'super_admin'
);

-- ---------------------------------------------------------------------------
-- 2) Discrepancy resolution (weight variance / reconciliation)
-- ---------------------------------------------------------------------------
do $$ begin
  create type discrepancy_status as enum ('open', 'in_progress', 'resolved');
exception when duplicate_object then null; end $$;

create table if not exists public.discrepancy_issues (
  id uuid primary key default gen_random_uuid(),
  movement_id uuid not null references public.movements(id) on delete cascade,
  lot_id uuid references public.lots(id) on delete set null,
  issue_type text not null default 'weight_variance',
  status discrepancy_status not null default 'open',
  assigned_to uuid references public.profiles(id),
  title text,
  notes text,
  resolution_notes text,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

create index if not exists idx_discrepancy_status on public.discrepancy_issues(status);
create index if not exists idx_discrepancy_movement on public.discrepancy_issues(movement_id);

alter table public.discrepancy_issues enable row level security;

drop policy if exists discrepancy_select on public.discrepancy_issues;
create policy discrepancy_select on public.discrepancy_issues
for select
using (
  (select role from public.profiles where id = auth.uid()) = 'super_admin'
  or exists (
    select 1
    from public.movements m
    join public.lots l on l.id = m.lot_id
    where m.id = discrepancy_issues.movement_id
      and l.organization_id = (select organization_id from public.profiles where id = auth.uid())
  )
);

drop policy if exists discrepancy_insert on public.discrepancy_issues;
create policy discrepancy_insert on public.discrepancy_issues
for insert
with check (
  (select role from public.profiles where id = auth.uid()) in (
    'super_admin', 'exporter', 'cooperative_manager', 'field_agent', 'auditor'
  )
  and exists (
    select 1
    from public.movements m
    join public.lots l on l.id = m.lot_id
    where m.id = discrepancy_issues.movement_id
      and (
        l.organization_id = (select organization_id from public.profiles where id = auth.uid())
        or (select role from public.profiles where id = auth.uid()) = 'super_admin'
      )
  )
);

drop policy if exists discrepancy_update on public.discrepancy_issues;
create policy discrepancy_update on public.discrepancy_issues
for update
using (
  (select role from public.profiles where id = auth.uid()) = 'super_admin'
  or exists (
    select 1
    from public.movements m
    join public.lots l on l.id = m.lot_id
    where m.id = discrepancy_issues.movement_id
      and l.organization_id = (select organization_id from public.profiles where id = auth.uid())
  )
);

-- ---------------------------------------------------------------------------
-- 3) Lot export approval (before export-ready / exported)
-- ---------------------------------------------------------------------------
alter table if exists public.lots
  add column if not exists export_approval_status text not null default 'none'
    check (export_approval_status in ('none', 'pending', 'approved', 'rejected'));

alter table if exists public.lots
  add column if not exists export_approved_by uuid references public.profiles(id);

alter table if exists public.lots
  add column if not exists export_approved_at timestamptz;

create index if not exists idx_lots_export_approval on public.lots(export_approval_status);

-- ---------------------------------------------------------------------------
-- 4) Movement receiver confirmation + variance supervisor review
-- ---------------------------------------------------------------------------
alter table if exists public.movements
  add column if not exists receiver_confirmed_at timestamptz;

alter table if exists public.movements
  add column if not exists receiver_confirmed_by uuid references public.profiles(id);

alter table if exists public.movements
  add column if not exists variance_review_status text not null default 'not_required'
    check (variance_review_status in ('not_required', 'pending', 'approved', 'rejected'));

alter table if exists public.movements
  add column if not exists variance_reviewed_by uuid references public.profiles(id);

alter table if exists public.movements
  add column if not exists variance_reviewed_at timestamptz;

create index if not exists idx_movements_variance_review on public.movements(variance_review_status);
