-- AgriVault — core schema (greenfield Supabase project)
-- Safe to run once on an empty database. For upgrades from older schema.sql, use ALTER TYPE additions manually.

create extension if not exists "pgcrypto";

-- ENUMS
do $$ begin
  create type user_role as enum (
    'super_admin',
    'admin',
    'ministry_officer',
    'county_officer',
    'district_officer',
    'cooperative_manager',
    'field_agent',
    'warehouse_manager',
    'donor_partner',
    'exporter',
    'call_center_agent',
    'auditor',
    'government_officer'
  );
exception when duplicate_object then null;
end $$;

do $$ begin create type org_type as enum ('cooperative', 'exporter', 'government', 'ngo', 'certifier');
exception when duplicate_object then null; end $$;

do $$ begin
  create type location_type as enum (
    'collection_point', 'warehouse', 'processing_facility', 'export_port', 'farm_gate'
  );
exception when duplicate_object then null; end $$;

do $$ begin create type commodity_type as enum ('cocoa', 'rice', 'rubber', 'palm_oil', 'coffee');
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

do $$ begin create type deforestation_status as enum ('pending', 'clear', 'flagged');
exception when duplicate_object then null; end $$;

-- CORE TABLES
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
  email text,
  full_name text not null,
  role user_role not null default 'field_agent',
  organization_id uuid references organizations(id),
  county text,
  district text,
  phone text,
  is_active boolean not null default true,
  deactivated_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_org on profiles(organization_id);
create index if not exists idx_profiles_county on profiles(county);
create index if not exists idx_profiles_email on profiles(email);

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
  cooperative_id uuid,
  county text not null,
  district text,
  village text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  verification_status text not null default 'pending'
    check (verification_status in ('verified', 'pending', 'flagged')),
  acreage_hectares numeric(12, 4),
  main_crop text default 'rice',
  subsidy_eligible boolean not null default false,
  registration_date date not null default current_date,
  registered_by uuid references profiles(id),
  notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists farmers_client_id_unique on farmers(client_id) where client_id is not null;
create index if not exists idx_farmers_county on farmers(county);
create index if not exists idx_farmers_cooperative on farmers(cooperative_id);

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

create unique index if not exists plots_client_id_unique on plots(client_id) where client_id is not null;
create index if not exists idx_plots_farmer on plots(farmer_id);

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

create index if not exists idx_lots_org on lots(organization_id);

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

create unique index if not exists rice_records_client_id_unique on rice_production_records(client_id)
  where client_id is not null;
create index if not exists idx_rice_records_season on rice_production_records(season);
create index if not exists idx_rice_records_county on rice_production_records(county);

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

create index if not exists idx_audit_created on audit_log(created_at desc);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  report_code text not null unique,
  title text not null,
  period_label text,
  generated_at timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft', 'final')),
  pdf_url text
);

-- Auth → profiles sync (SECURITY DEFINER bypasses RLS on insert)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text := coalesce(new.raw_user_meta_data->>'role', '');
  chosen user_role := 'field_agent'::user_role;
begin
  if meta_role in (
    'super_admin', 'admin', 'ministry_officer', 'county_officer', 'district_officer',
    'cooperative_manager', 'field_agent', 'warehouse_manager', 'donor_partner', 'exporter',
    'call_center_agent', 'auditor', 'government_officer'
  ) then
    chosen := meta_role::user_role;
  end if;

  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(coalesce(new.email, 'user'), '@', 1), 'User'),
    chosen,
    true
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
