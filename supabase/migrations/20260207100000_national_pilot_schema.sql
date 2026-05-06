-- AgriVault national agriculture pilot — baseline schema (empty database).
-- Apply via Supabase CLI: supabase db push   OR SQL Editor paste.
-- Project layout supports Liberia rice pilot + inventory + registry extensions.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum (
    'super_admin',
    'admin',
    'ministry_officer',
    'government_officer',
    'county_officer',
    'district_officer',
    'cooperative_manager',
    'field_agent',
    'warehouse_manager',
    'donor_partner',
    'exporter',
    'call_center_agent',
    'auditor'
  );
exception when duplicate_object then null; end $$;

do $$ begin create type org_type as enum ('cooperative', 'exporter', 'government', 'ngo', 'certifier');
exception when duplicate_object then null; end $$;

do $$ begin
  create type location_type as enum (
    'collection_point','warehouse','processing_facility','export_port','farm_gate'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type commodity_type as enum ('cocoa','rice','rubber','palm_oil','coffee');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lot_status as enum ('created','in_transit','at_warehouse','processed','exported','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type movement_status as enum ('dispatched','in_transit','received','disputed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type compliance_status as enum ('unchecked','compliant','non_compliant','pending_verification');
exception when duplicate_object then null; end $$;

do $$ begin
  create type deforestation_status as enum ('pending','clear','flagged');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- REFERENCE & CORE
-- ---------------------------------------------------------------------------
create table if not exists counties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_pilot boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists districts (
  id uuid primary key default gen_random_uuid(),
  county_id uuid not null references counties(id) on delete cascade,
  name text not null,
  unique (county_id, name)
);

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

create table if not exists warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  county text not null,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  low_stock_threshold_pct numeric(5, 2) default 15,
  created_at timestamptz not null default now()
);

create table if not exists warehouse_assignments (
  profile_id uuid not null references profiles(id) on delete cascade,
  warehouse_id uuid not null references warehouses(id) on delete cascade,
  primary key (profile_id, warehouse_id)
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
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','flagged')),
  subsidy_eligible boolean not null default false,
  main_crop text not null default 'rice',
  acreage_hectares numeric(12, 4),
  created_at timestamptz not null default now()
);

create unique index if not exists farmers_client_id_unique on farmers(client_id) where client_id is not null;

create table if not exists farmer_visits (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references farmers(id) on delete cascade,
  visited_by uuid references profiles(id),
  visited_at timestamptz not null default now(),
  notes text,
  gps_latitude numeric(10, 8),
  gps_longitude numeric(11, 8),
  verification_status text check (verification_status in ('pending','verified','flagged'))
);

create table if not exists farmer_subsidies (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references farmers(id) on delete cascade,
  programme text not null,
  amount_usd numeric(14, 2),
  period_label text,
  created_at timestamptz not null default now()
);

create table if not exists geo_locations (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid references farmers(id) on delete cascade,
  latitude numeric(10, 8) not null,
  longitude numeric(11, 8) not null,
  accuracy_m numeric(10, 2),
  captured_at timestamptz not null default now()
);

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

create unique index if not exists movements_client_id_unique on movements(client_id) where client_id is not null;

create table if not exists rice_production_records (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  farmer_id uuid not null references farmers(id) on delete cascade,
  plot_id uuid references plots(id),
  season text not null,
  planting_date date,
  expected_yield_kg numeric(12, 2),
  actual_yield_kg numeric(12, 2),
  post_harvest_loss_kg numeric(12, 2),
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

create unique index if not exists rice_records_client_id_unique on rice_production_records(client_id) where client_id is not null;

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

-- ---------------------------------------------------------------------------
-- INVENTORY & INPUTS
-- ---------------------------------------------------------------------------
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category text not null check (category in ('rice_seed','fertilizer','pesticide','tool','other')),
  unit text not null default 'kg',
  created_at timestamptz not null default now()
);

create table if not exists warehouse_stock (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references warehouses(id) on delete cascade,
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  quantity numeric(14, 2) not null default 0,
  batch_code text,
  expiry_date date,
  donor_tagged boolean not null default false,
  loss_flag boolean not null default false,
  theft_flag boolean not null default false
);

create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references inventory_items(id),
  warehouse_from uuid references warehouses(id),
  warehouse_to uuid references warehouses(id),
  quantity numeric(14, 2) not null,
  movement_type text not null check (movement_type in ('receipt','transfer','distribution','adjustment','loss')),
  reference text,
  county_allocation text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists input_allocations (
  id uuid primary key default gen_random_uuid(),
  county text not null,
  inventory_item_id uuid not null references inventory_items(id),
  season text not null,
  quantity_allocated numeric(14, 2) not null,
  quantity_distributed numeric(14, 2) not null default 0,
  unique (county, inventory_item_id, season)
);

create table if not exists distribution_logs (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid references farmers(id),
  warehouse_id uuid references warehouses(id),
  inventory_item_id uuid not null references inventory_items(id),
  quantity numeric(14, 2) not null,
  distributed_at timestamptz not null default now(),
  channel text,
  created_by uuid references profiles(id)
);

create table if not exists supplier_records (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null default 'Liberia',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists donor_shipments (
  id uuid primary key default gen_random_uuid(),
  donor_name text not null,
  inventory_item_id uuid not null references inventory_items(id),
  quantity numeric(14, 2) not null,
  warehouse_id uuid references warehouses(id),
  received_at date not null,
  programme_code text,
  created_at timestamptz not null default now()
);

create table if not exists expiry_tracking (
  id uuid primary key default gen_random_uuid(),
  warehouse_stock_id uuid not null references warehouse_stock(id) on delete cascade,
  alert_level text not null check (alert_level in ('watch','critical')),
  checked_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- FIELD & FOOD SECURITY
-- ---------------------------------------------------------------------------
create table if not exists field_reports (
  id uuid primary key default gen_random_uuid(),
  county text not null,
  officer_profile_id uuid references profiles(id),
  summary text not null,
  channel text not null check (channel in ('offline','online','call_center','sms')),
  submitted_at timestamptz not null default now(),
  payload jsonb
);

create table if not exists food_security_indicators (
  id uuid primary key default gen_random_uuid(),
  period_label text not null unique,
  rice_demand_mt numeric(14, 2),
  domestic_production_mt numeric(14, 2),
  import_dependency_pct numeric(6, 2),
  national_risk_score integer,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_org on profiles(organization_id);
create index if not exists idx_profiles_county on profiles(county);
create index if not exists idx_farmers_county on farmers(county);
create index if not exists idx_farmers_verify on farmers(verification_status);
create index if not exists idx_warehouses_county on warehouses(county);
create index if not exists idx_wh_stock_wh on warehouse_stock(warehouse_id);
create index if not exists idx_inv_mov_item on inventory_movements(inventory_item_id);
create index if not exists idx_rice_records_season on rice_production_records(season);
create index if not exists idx_field_reports_county on field_reports(county);
create index if not exists idx_audit_created on audit_log(created_at desc);
