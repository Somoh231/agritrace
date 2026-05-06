-- Pilot geography, cooperatives, inventory, field intelligence, supplementary farmer tables

-- Geography (reference)
create table if not exists counties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text,
  is_pilot_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists districts (
  id uuid primary key default gen_random_uuid(),
  county_id uuid not null references counties(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (county_id, name)
);

create index if not exists idx_districts_county on districts(county_id);

create table if not exists cooperatives (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  county text not null,
  organization_id uuid references organizations(id),
  contact_phone text,
  created_at timestamptz not null default now()
);

alter table farmers
  drop constraint if exists farmers_cooperative_id_fkey;
alter table farmers
  add constraint farmers_cooperative_id_fkey
  foreign key (cooperative_id) references cooperatives(id);

-- Inventory domain
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category text not null check (category in ('rice_seed', 'fertilizer', 'pesticide', 'tool', 'other')),
  unit text not null default 'kg',
  created_at timestamptz not null default now()
);

create table if not exists warehouses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  county text not null,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  manager_profile_id uuid references profiles(id),
  low_stock_threshold numeric(14, 4),
  created_at timestamptz not null default now()
);

create index if not exists idx_warehouses_county on warehouses(county);
create index if not exists idx_warehouses_manager on warehouses(manager_profile_id);

create table if not exists warehouse_stock (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references warehouses(id) on delete cascade,
  item_id uuid not null references inventory_items(id) on delete cascade,
  quantity_numeric numeric(14, 4) not null default 0,
  donor_tagged boolean not null default false,
  expiry_date date,
  updated_at timestamptz not null default now(),
  unique (warehouse_id, item_id)
);

create index if not exists idx_warehouse_stock_wh on warehouse_stock(warehouse_id);

create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  from_warehouse_id uuid references warehouses(id),
  to_warehouse_id uuid references warehouses(id),
  item_id uuid not null references inventory_items(id),
  quantity_numeric numeric(14, 4) not null,
  status text not null default 'completed' check (status in ('scheduled', 'in_transit', 'completed', 'cancelled')),
  notes text,
  occurred_at timestamptz not null default now(),
  recorded_by uuid references profiles(id)
);

create index if not exists idx_inv_mov_from on inventory_movements(from_warehouse_id);
create index if not exists idx_inv_mov_to on inventory_movements(to_warehouse_id);

create table if not exists input_allocations (
  id uuid primary key default gen_random_uuid(),
  county text not null,
  season text not null,
  item_id uuid not null references inventory_items(id),
  quantity_allocated numeric(14, 4) not null default 0,
  quantity_distributed numeric(14, 4) not null default 0,
  updated_at timestamptz not null default now(),
  unique (county, season, item_id)
);

create table if not exists distribution_logs (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid references farmers(id),
  warehouse_id uuid references warehouses(id),
  item_id uuid not null references inventory_items(id),
  quantity_numeric numeric(14, 4) not null,
  distributed_at timestamptz not null default now(),
  recorded_by uuid references profiles(id),
  channel text default 'field'
);

create index if not exists idx_distribution_farmer on distribution_logs(farmer_id);

create table if not exists supplier_records (
  id uuid primary key default gen_random_uuid(),
  supplier_name text not null,
  item_id uuid references inventory_items(id),
  contract_ref text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists donor_shipments (
  id uuid primary key default gen_random_uuid(),
  donor_name text not null,
  programme text,
  item_id uuid not null references inventory_items(id),
  warehouse_id uuid not null references warehouses(id),
  quantity_numeric numeric(14, 4) not null,
  received_at timestamptz not null default now()
);

create index if not exists idx_donor_ship_wh on donor_shipments(warehouse_id);

create table if not exists expiry_tracking (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references warehouses(id),
  item_id uuid not null references inventory_items(id),
  alert_level text not null default 'watch' check (alert_level in ('healthy', 'watch', 'critical')),
  flag_type text,
  notes text,
  updated_at timestamptz not null default now(),
  unique (warehouse_id, item_id)
);

-- Farmer extensions
create table if not exists farmer_visits (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references farmers(id) on delete cascade,
  visited_at timestamptz not null default now(),
  visited_by uuid references profiles(id),
  channel text default 'field',
  notes text,
  gps_ok boolean default false
);

create index if not exists idx_farmer_visits_farmer on farmer_visits(farmer_id);

create table if not exists farmer_subsidies (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references farmers(id) on delete cascade,
  programme text not null,
  amount_usd numeric(12, 2),
  period_label text,
  status text not null default 'eligible' check (status in ('eligible', 'paid', 'revoked')),
  created_at timestamptz not null default now()
);

create table if not exists geo_locations (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid references farmers(id) on delete cascade,
  label text,
  latitude numeric(10, 8) not null,
  longitude numeric(11, 8) not null,
  accuracy_m numeric(8, 2),
  captured_at timestamptz not null default now(),
  source text default 'mobile'
);

create index if not exists idx_geo_farmer on geo_locations(farmer_id);

-- Optional aggregate production (non-rice or summary); rice detail remains in rice_production_records
create table if not exists farmer_production (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references farmers(id) on delete cascade,
  season text not null,
  commodity commodity_type not null,
  expected_yield_kg numeric(14, 4),
  actual_yield_kg numeric(14, 4),
  notes text,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_farmer_production_farmer on farmer_production(farmer_id);

-- Field intelligence
create table if not exists field_reports (
  id uuid primary key default gen_random_uuid(),
  county text not null,
  district text,
  summary text not null,
  channel text not null default 'offline' check (channel in ('offline', 'online', 'call_center')),
  officer_label text,
  submitted_at timestamptz not null default now(),
  submitted_by uuid references profiles(id)
);

create index if not exists idx_field_reports_county on field_reports(county);

create table if not exists food_security_indicators (
  id uuid primary key default gen_random_uuid(),
  indicator_key text not null,
  indicator_value numeric(20, 4),
  indicator_unit text,
  period_label text not null,
  county text,
  notes text,
  updated_at timestamptz not null default now(),
  unique (indicator_key, period_label, county)
);
