-- Ministry-grade canonical pilot structures (Agrivault farmer registry sample alignment).
-- Farmers / warehouses extended codes; operational DAO, events, county intelligence tables.

alter table farmers add column if not exists registry_public_id text;
create unique index if not exists farmers_registry_public_id_key on farmers(registry_public_id) where registry_public_id is not null;

alter table farmers add column if not exists dao_officer_code text;
alter table farmers add column if not exists primary_warehouse_code text;
alter table farmers add column if not exists cooperative_name text;

alter table warehouses add column if not exists ministry_code text;
create unique index if not exists warehouses_ministry_code_key on warehouses(ministry_code) where ministry_code is not null;

alter table warehouses add column if not exists capacity_mt numeric(14, 2);
alter table warehouses add column if not exists current_stock_mt numeric(14, 2);
alter table warehouses add column if not exists utilization_pct numeric(5, 2);
alter table warehouses add column if not exists manager_name text;
alter table warehouses add column if not exists operational_status text default 'Operational';
alter table warehouses add column if not exists donor_resupply_flag boolean default false;

create table if not exists pilot_dao_officers (
  id uuid primary key default gen_random_uuid(),
  dao_code text not null unique,
  full_name text not null,
  county text not null,
  district text,
  reports_submitted integer not null default 0,
  overdue_reports integer not null default 0,
  farm_visits integer not null default 0,
  last_activity date,
  compliance_score integer,
  status text not null default 'Active',
  created_at timestamptz not null default now()
);

create table if not exists pilot_operational_events (
  id uuid primary key default gen_random_uuid(),
  event_code text unique,
  occurred_at timestamptz not null,
  severity text not null,
  county text,
  district text,
  event_type text not null,
  message text not null,
  status text not null default 'Open',
  created_at timestamptz not null default now()
);

create table if not exists pilot_county_metrics (
  county text primary key,
  production_index integer not null default 0,
  food_risk text not null default 'Low',
  dao_compliance integer not null default 0,
  intelligence_lng numeric(11, 8),
  intelligence_lat numeric(10, 8),
  updated_at timestamptz not null default now()
);

alter table pilot_dao_officers enable row level security;
alter table pilot_operational_events enable row level security;
alter table pilot_county_metrics enable row level security;

drop policy if exists pilot_dao_select on pilot_dao_officers;
create policy pilot_dao_select on pilot_dao_officers for select to authenticated using (true);

drop policy if exists pilot_events_select on pilot_operational_events;
create policy pilot_events_select on pilot_operational_events for select to authenticated using (true);

drop policy if exists pilot_county_metrics_select on pilot_county_metrics;
create policy pilot_county_metrics_select on pilot_county_metrics for select to authenticated using (true);
