-- AgriTrace Liberia — Supabase schema (MVP)
-- Run in Supabase SQL editor.

create extension if not exists "pgcrypto";

-- ENUMS
do $$ begin
  create type user_role as enum (
    'super_admin',
    'government_officer',
    'county_officer',
    'exporter',
    'cooperative_manager',
    'field_agent',
    'call_center_agent',
    'auditor'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type org_type as enum ('cooperative', 'exporter', 'government', 'ngo', 'certifier');
exception when duplicate_object then null; end $$;

do $$ begin
  create type location_type as enum (
    'collection_point',
    'warehouse',
    'processing_facility',
    'export_port',
    'farm_gate'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type commodity_type as enum ('cocoa', 'rice', 'rubber', 'palm_oil', 'coffee');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lot_status as enum ('created', 'in_transit', 'at_warehouse', 'processed', 'exported', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type movement_status as enum ('dispatched', 'in_transit', 'received', 'disputed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type compliance_status as enum ('unchecked', 'compliant', 'non_compliant', 'pending_verification');
exception when duplicate_object then null; end $$;

do $$ begin
  create type deforestation_status as enum ('pending', 'clear', 'flagged');
exception when duplicate_object then null; end $$;

-- TABLES
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type org_type not null,
  country text not null default 'Liberia',
  county text,
  contact_name text,
  contact_phone text,
  license_number text,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null,
  organization_id uuid references organizations(id),
  county text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type location_type not null,
  organization_id uuid references organizations(id),
  county text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists farmers (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  full_name text not null,
  national_id text,
  phone text,
  gender text,
  organization_id uuid references organizations(id),
  county text not null,
  district text,
  village text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  registration_date date not null default current_date,
  registered_by uuid references profiles(id),
  notes text,
  created_at timestamptz not null default now()
);

alter table farmers add column if not exists client_id uuid unique;
create unique index if not exists farmers_client_id_unique on farmers(client_id) where client_id is not null;

create table if not exists plots (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  farmer_id uuid not null references farmers(id) on delete cascade,
  commodity commodity_type not null,
  area_hectares numeric(8, 4),
  polygon_geojson jsonb,
  center_latitude numeric(10, 8),
  center_longitude numeric(11, 8),
  land_tenure text,
  water_source text,
  years_farming_plot integer,
  participated_programmes boolean,
  planting_year integer,
  deforestation_check_status deforestation_status not null default 'pending',
  deforestation_check_date date,
  deforestation_check_notes text,
  county text,
  district text,
  village text,
  created_at timestamptz not null default now(),
  registered_by uuid references profiles(id)
);

alter table plots add column if not exists client_id uuid unique;
create unique index if not exists plots_client_id_unique on plots(client_id) where client_id is not null;
alter table plots add column if not exists water_source text;
alter table plots add column if not exists years_farming_plot integer;
alter table plots add column if not exists participated_programmes boolean;

create table if not exists lots (
  id uuid primary key default gen_random_uuid(),
  lot_code text not null unique,
  commodity commodity_type not null,
  origin_location_id uuid references locations(id),
  organization_id uuid references organizations(id),
  weight_kg_in numeric(10, 2) not null,
  weight_kg_current numeric(10, 2) not null,
  moisture_content numeric(5, 2),
  quality_grade text,
  status lot_status not null default 'created',
  season text,
  farmer_group_ids uuid[],
  compliance_status compliance_status not null default 'unchecked',
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists movements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  lot_id uuid not null references lots(id) on delete cascade,
  from_location_id uuid references locations(id),
  to_location_id uuid references locations(id),
  weight_kg_dispatched numeric(10, 2) not null,
  weight_kg_received numeric(10, 2),
  weight_variance_kg numeric(10, 2) generated always as (weight_kg_received - weight_kg_dispatched) stored,
  dispatched_at timestamptz,
  received_at timestamptz,
  transport_mode text,
  vehicle_id text,
  driver_name text,
  dispatched_by uuid references profiles(id),
  received_by uuid references profiles(id),
  status movement_status not null default 'dispatched',
  notes text,
  created_at timestamptz not null default now()
);

alter table movements add column if not exists client_id uuid unique;
create unique index if not exists movements_client_id_unique on movements(client_id) where client_id is not null;

create table if not exists rice_production_records (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  farmer_id uuid not null references farmers(id) on delete cascade,
  plot_id uuid references plots(id),
  season text not null,
  planting_date date,
  expected_yield_kg numeric(10, 2),
  actual_yield_kg numeric(10, 2),
  post_harvest_loss_kg numeric(10, 2),
  post_harvest_loss_cause text,
  storage_location_id uuid references locations(id),
  market_destination text,
  farm_gate_price_usd numeric(8, 2),
  county text,
  district text,
  water_source text,
  years_farming_plot integer,
  recorded_by uuid references profiles(id),
  recorded_at timestamptz not null default now(),
  notes text
);

alter table rice_production_records add column if not exists client_id uuid unique;
create unique index if not exists rice_records_client_id_unique on rice_production_records(client_id) where client_id is not null;
alter table rice_production_records add column if not exists water_source text;
alter table rice_production_records add column if not exists years_farming_plot integer;

create table if not exists compliance_records (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references lots(id) on delete cascade,
  standard text not null,
  status text,
  verification_method text,
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  expiry_date date,
  certificate_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  action text not null,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  report_code text not null unique,
  title text not null,
  period_label text,
  generated_at timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft','final')),
  pdf_url text
);

-- INDEXES
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_org on profiles(organization_id);
create index if not exists idx_locations_org on locations(organization_id);
create index if not exists idx_farmers_county on farmers(county);
create index if not exists idx_plots_farmer on plots(farmer_id);
create index if not exists idx_lots_org on lots(organization_id);
create index if not exists idx_lots_status on lots(status);
create index if not exists idx_lots_compliance on lots(compliance_status);
create index if not exists idx_movements_lot on movements(lot_id);
create index if not exists idx_rice_records_season on rice_production_records(season);
create index if not exists idx_audit_created on audit_log(created_at desc);
create index if not exists idx_reports_generated on reports(generated_at desc);

-- RLS
alter table profiles enable row level security;
alter table organizations enable row level security;
alter table locations enable row level security;
alter table farmers enable row level security;
alter table plots enable row level security;
alter table lots enable row level security;
alter table movements enable row level security;
alter table rice_production_records enable row level security;
alter table compliance_records enable row level security;
alter table audit_log enable row level security;
alter table reports enable row level security;

-- POLICIES
-- Profiles: user can read their own profile; super_admin can read all.
drop policy if exists profiles_self_select on profiles;
create policy profiles_self_select on profiles
for select
using (id = auth.uid() or (select role from profiles where id = auth.uid()) = 'super_admin');

drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles
for update
using (id = auth.uid());

-- Organizations: users can read their own org; super_admin can read all.
drop policy if exists org_read on organizations;
create policy org_read on organizations
for select
using (
  id = (select organization_id from profiles where id = auth.uid())
  or (select role from profiles where id = auth.uid()) = 'super_admin'
);

-- Locations: org-scoped; plus super_admin.
drop policy if exists locations_org on locations;
create policy locations_org on locations
for all
using (
  organization_id = (select organization_id from profiles where id = auth.uid())
  or (select role from profiles where id = auth.uid()) = 'super_admin'
)
with check (
  organization_id = (select organization_id from profiles where id = auth.uid())
  or (select role from profiles where id = auth.uid()) = 'super_admin'
);

-- Farmers: field/call center agents see their county; org managers/exporters see their org.
drop policy if exists farmers_access on farmers;
create policy farmers_access on farmers
for select
using (
  (select role from profiles where id = auth.uid()) = 'super_admin'
  or organization_id = (select organization_id from profiles where id = auth.uid())
  or (
    county = (select county from profiles where id = auth.uid())
    and (select role from profiles where id = auth.uid()) in ('field_agent', 'call_center_agent')
  )
);

drop policy if exists farmers_write_org on farmers;
create policy farmers_write_org on farmers
for insert
with check (
  (select role from profiles where id = auth.uid()) in ('super_admin', 'field_agent', 'call_center_agent', 'cooperative_manager')
);

-- Lots: org-scoped; super_admin.
drop policy if exists lots_org on lots;
create policy lots_org on lots
for all
using (
  organization_id = (select organization_id from profiles where id = auth.uid())
  or (select role from profiles where id = auth.uid()) = 'super_admin'
)
with check (
  organization_id = (select organization_id from profiles where id = auth.uid())
  or (select role from profiles where id = auth.uid()) = 'super_admin'
);

-- Movements: visible to lot owner org; super_admin.
drop policy if exists movements_org on movements;
create policy movements_org on movements
for all
using (
  lot_id in (
    select id from lots where organization_id = (select organization_id from profiles where id = auth.uid())
  )
  or (select role from profiles where id = auth.uid()) = 'super_admin'
)
with check (
  lot_id in (
    select id from lots where organization_id = (select organization_id from profiles where id = auth.uid())
  )
  or (select role from profiles where id = auth.uid()) = 'super_admin'
);

-- Rice production records: government roles read all; super_admin all. (Writes limited for now.)
drop policy if exists rice_read_gov on rice_production_records;
create policy rice_read_gov on rice_production_records
for select
using (
  (select role from profiles where id = auth.uid()) in ('government_officer','county_officer','super_admin')
);

drop policy if exists rice_write_agents on rice_production_records;
create policy rice_write_agents on rice_production_records
for insert
with check (
  (select role from profiles where id = auth.uid()) in ('super_admin','field_agent','call_center_agent')
);

-- Compliance records: org-scoped; super_admin.
drop policy if exists compliance_org on compliance_records;
create policy compliance_org on compliance_records
for all
using (
  lot_id in (
    select id from lots where organization_id = (select organization_id from profiles where id = auth.uid())
  )
  or (select role from profiles where id = auth.uid()) = 'super_admin'
)
with check (
  lot_id in (
    select id from lots where organization_id = (select organization_id from profiles where id = auth.uid())
  )
  or (select role from profiles where id = auth.uid()) = 'super_admin'
);

-- Audit log: insert by anyone authenticated; read by super_admin only.
drop policy if exists audit_insert on audit_log;
create policy audit_insert on audit_log
for insert
with check (auth.uid() is not null);

drop policy if exists audit_read on audit_log;
create policy audit_read on audit_log
for select
using ((select role from profiles where id = auth.uid()) = 'super_admin');

-- Reports: government & super_admin can read; super_admin can write.
drop policy if exists reports_read_gov on reports;
create policy reports_read_gov on reports
for select
using ((select role from profiles where id = auth.uid()) in ('government_officer','county_officer','super_admin'));

drop policy if exists reports_write_admin on reports;
create policy reports_write_admin on reports
for all
using ((select role from profiles where id = auth.uid()) = 'super_admin');

drop policy if exists reports_insert_gov on reports;
create policy reports_insert_gov on reports
for insert
with check ((select role from profiles where id = auth.uid()) in ('government_officer','county_officer','super_admin'));

