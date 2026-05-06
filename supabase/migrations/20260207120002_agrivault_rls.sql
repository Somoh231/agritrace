-- Row Level Security — AgriVault pilot
-- Uses helper accessors to avoid repetitive subqueries.

create or replace function public.auth_role()
returns user_role
language sql
stable
security invoker
set search_path = public
as $$
  select p.role from profiles p where p.id = auth.uid();
$$;

create or replace function public.auth_county()
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select p.county from profiles p where p.id = auth.uid();
$$;

create or replace function public.auth_district()
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select p.district from profiles p where p.id = auth.uid();
$$;

create or replace function public.is_ministry_wide()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select auth_role() in (
    'super_admin', 'admin', 'ministry_officer', 'government_officer'
  );
$$;

-- CORE TABLES RLS
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

alter table counties enable row level security;
alter table districts enable row level security;
alter table cooperatives enable row level security;
alter table inventory_items enable row level security;
alter table warehouses enable row level security;
alter table warehouse_stock enable row level security;
alter table inventory_movements enable row level security;
alter table input_allocations enable row level security;
alter table distribution_logs enable row level security;
alter table supplier_records enable row level security;
alter table donor_shipments enable row level security;
alter table expiry_tracking enable row level security;
alter table farmer_visits enable row level security;
alter table farmer_subsidies enable row level security;
alter table geo_locations enable row level security;
alter table farmer_production enable row level security;
alter table field_reports enable row level security;
alter table food_security_indicators enable row level security;

-- PROFILES
drop policy if exists profiles_self_select on profiles;
create policy profiles_self_select on profiles
for select using (
  id = auth.uid()
  or auth_role() in ('super_admin', 'admin')
  or auth_role() in ('ministry_officer', 'government_officer')
);

drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles
for update using (
  id = auth.uid()
  or auth_role() in ('super_admin', 'admin')
);

-- ORGANIZATIONS
drop policy if exists org_read on organizations;
create policy org_read on organizations
for select using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer', 'donor_partner')
  or id = (select organization_id from profiles where id = auth.uid())
);

-- LOCATIONS (org scoped + ministry)
drop policy if exists locations_org on locations;
create policy locations_org on locations
for all using (
  auth_role() in ('super_admin', 'admin')
  or auth_role() in ('ministry_officer', 'government_officer')
  or organization_id = (select organization_id from profiles where id = auth.uid())
)
with check (
  auth_role() in ('super_admin', 'admin')
  or auth_role() in ('ministry_officer', 'government_officer')
  or organization_id = (select organization_id from profiles where id = auth.uid())
);

-- FARMERS
drop policy if exists farmers_access on farmers;
drop policy if exists farmers_select_pilot on farmers;
create policy farmers_select_pilot on farmers
for select using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer')
  or (
    auth_role() = 'county_officer'
    and county = auth_county()
  )
  or (
    auth_role() = 'district_officer'
    and county = auth_county()
    and (
      auth_district() is null
      or district = auth_district()
      or district is null
    )
  )
  or (
    auth_role() in ('field_agent', 'call_center_agent')
    and county = auth_county()
  )
  or organization_id = (select organization_id from profiles where id = auth.uid())
  or (
    auth_role() = 'warehouse_manager'
    and county in (select w.county from warehouses w where w.manager_profile_id = auth.uid())
  )
);

drop policy if exists farmers_write_org on farmers;
drop policy if exists farmers_insert_pilot on farmers;
create policy farmers_insert_pilot on farmers
for insert with check (
  auth_role() in ('super_admin', 'admin', 'field_agent', 'call_center_agent', 'cooperative_manager')
);

drop policy if exists farmers_update_pilot on farmers;
create policy farmers_update_pilot on farmers
for update using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer')
  or (
    auth_role() in ('field_agent', 'call_center_agent', 'cooperative_manager')
    and (
      county = auth_county()
      or organization_id = (select organization_id from profiles where id = auth.uid())
    )
  )
);

-- LOTS / MOVEMENTS / COMPLIANCE (org scoped)
drop policy if exists lots_org on lots;
create policy lots_org on lots
for all using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer')
  or organization_id = (select organization_id from profiles where id = auth.uid())
)
with check (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer')
  or organization_id = (select organization_id from profiles where id = auth.uid())
);

drop policy if exists movements_org on movements;
create policy movements_org on movements
for all using (
  auth_role() in ('super_admin', 'admin')
  or lot_id in (
    select id from lots where organization_id = (select organization_id from profiles where id = auth.uid())
  )
)
with check (
  auth_role() in ('super_admin', 'admin')
  or lot_id in (
    select id from lots where organization_id = (select organization_id from profiles where id = auth.uid())
  )
);

drop policy if exists compliance_org on compliance_records;
create policy compliance_org on compliance_records
for all using (
  auth_role() in ('super_admin', 'admin')
  or lot_id in (
    select id from lots where organization_id = (select organization_id from profiles where id = auth.uid())
  )
)
with check (
  auth_role() in ('super_admin', 'admin')
  or lot_id in (
    select id from lots where organization_id = (select organization_id from profiles where id = auth.uid())
  )
);

-- RICE
drop policy if exists rice_read_gov on rice_production_records;
create policy rice_read_gov on rice_production_records
for select using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer')
  or (
    auth_role() = 'county_officer'
    and coalesce(county, '') = coalesce(auth_county(), '')
  )
  or (
    auth_role() = 'district_officer'
    and coalesce(county, '') = coalesce(auth_county(), '')
    and (
      auth_district() is null
      or coalesce(district, '') = coalesce(auth_district(), '')
      or district is null
    )
  )
  or (
    auth_role() in ('field_agent', 'call_center_agent')
    and coalesce(county, '') = coalesce(auth_county(), '')
  )
);

drop policy if exists rice_write_agents on rice_production_records;
create policy rice_write_agents on rice_production_records
for insert with check (
  auth_role() in ('super_admin', 'admin', 'field_agent', 'call_center_agent')
);

drop policy if exists rice_update_pilot on rice_production_records;
create policy rice_update_pilot on rice_production_records
for update using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer', 'field_agent', 'call_center_agent')
);

-- AUDIT / REPORTS
drop policy if exists audit_insert on audit_log;
create policy audit_insert on audit_log
for insert with check (auth.uid() is not null);

drop policy if exists audit_read on audit_log;
create policy audit_read on audit_log
for select using (
  auth_role() in ('super_admin', 'admin', 'auditor')
);

drop policy if exists reports_read_gov on reports;
create policy reports_read_gov on reports
for select using (
  auth_role() in (
    'super_admin', 'admin', 'ministry_officer', 'government_officer',
    'county_officer', 'district_officer', 'donor_partner'
  )
);

drop policy if exists reports_write_admin on reports;
create policy reports_write_admin on reports
for all using (auth_role() in ('super_admin', 'admin'));

drop policy if exists reports_insert_gov on reports;
create policy reports_insert_gov on reports
for insert with check (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer', 'county_officer', 'district_officer')
);

-- REFERENCE GEOGRAPHY — readable by authenticated pilot roles
drop policy if exists counties_read on counties;
create policy counties_read on counties for select using (auth.uid() is not null);

drop policy if exists districts_read on districts;
create policy districts_read on districts for select using (auth.uid() is not null);

drop policy if exists cooperatives_read on cooperatives;
create policy cooperatives_read on cooperatives for select using (auth.uid() is not null);

drop policy if exists cooperatives_write on cooperatives;
create policy cooperatives_write on cooperatives
for all using (auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer', 'county_officer'))
with check (auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer', 'county_officer'));

-- INVENTORY (items: catalogue readable by ops roles)
drop policy if exists inventory_items_read on inventory_items;
create policy inventory_items_read on inventory_items for select using (
  auth.uid() is not null and auth_role() <> 'donor_partner'::user_role
);

drop policy if exists inventory_items_write on inventory_items;
create policy inventory_items_write on inventory_items
for all using (auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer', 'warehouse_manager'))
with check (auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer', 'warehouse_manager'));

-- Warehouses
drop policy if exists warehouses_read on warehouses;
create policy warehouses_read on warehouses for select using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer')
  or county = auth_county()
  or manager_profile_id = auth.uid()
);

drop policy if exists warehouses_write on warehouses;
create policy warehouses_write on warehouses
for all using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer')
  or manager_profile_id = auth.uid()
)
with check (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer')
);

-- warehouse_stock
drop policy if exists warehouse_stock_read on warehouse_stock;
create policy warehouse_stock_read on warehouse_stock for select using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer')
  or exists (
    select 1 from warehouses w
    where w.id = warehouse_stock.warehouse_id
    and (
      w.county = auth_county()
      or w.manager_profile_id = auth.uid()
    )
  )
);

drop policy if exists warehouse_stock_write on warehouse_stock;
create policy warehouse_stock_write on warehouse_stock
for all using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer')
  or exists (
    select 1 from warehouses w
    where w.id = warehouse_stock.warehouse_id
    and w.manager_profile_id = auth.uid()
  )
);

-- Movements / allocations / distribution
drop policy if exists inventory_movements_rw on inventory_movements;
create policy inventory_movements_rw on inventory_movements
for select using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer')
  or recorded_by = auth.uid()
);

drop policy if exists inventory_movements_ins on inventory_movements;
create policy inventory_movements_ins on inventory_movements
for insert with check (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'warehouse_manager')
);

drop policy if exists input_allocations_rw on input_allocations;
create policy input_allocations_rw on input_allocations
for select using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer', 'county_officer', 'district_officer')
);

drop policy if exists input_allocations_write on input_allocations;
create policy input_allocations_write on input_allocations
for all using (auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer'))
with check (auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer'));

drop policy if exists distribution_logs_rw on distribution_logs;
create policy distribution_logs_rw on distribution_logs
for select using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer', 'county_officer', 'district_officer')
);

drop policy if exists distribution_logs_ins on distribution_logs;
create policy distribution_logs_ins on distribution_logs
for insert with check (
  auth_role() in ('super_admin', 'admin', 'field_agent', 'call_center_agent', 'warehouse_manager')
);

drop policy if exists supplier_read on supplier_records;
create policy supplier_read on supplier_records for select using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer')
);

drop policy if exists supplier_write on supplier_records;
create policy supplier_write on supplier_records
for all using (auth_role() in ('super_admin', 'admin', 'ministry_officer'));

drop policy if exists donor_ship_read on donor_shipments;
create policy donor_ship_read on donor_shipments for select using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer', 'donor_partner')
);

drop policy if exists donor_ship_write on donor_shipments;
create policy donor_ship_write on donor_shipments
for all using (auth_role() in ('super_admin', 'admin', 'ministry_officer'));

drop policy if exists expiry_read on expiry_tracking;
create policy expiry_read on expiry_tracking for select using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer', 'warehouse_manager')
);

drop policy if exists expiry_write on expiry_tracking;
create policy expiry_write on expiry_tracking
for all using (auth_role() in ('super_admin', 'admin', 'ministry_officer', 'warehouse_manager'));

-- Farmer satellites
drop policy if exists farmer_visits_rw on farmer_visits;
create policy farmer_visits_rw on farmer_visits
for select using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer', 'county_officer', 'district_officer')
  or visited_by = auth.uid()
);

drop policy if exists farmer_visits_ins on farmer_visits;
create policy farmer_visits_ins on farmer_visits
for insert with check (
  auth_role() in ('super_admin', 'admin', 'field_agent', 'call_center_agent')
);

drop policy if exists farmer_subsidies_rw on farmer_subsidies;
create policy farmer_subsidies_rw on farmer_subsidies
for select using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer', 'donor_partner')
);

drop policy if exists farmer_subsidies_write on farmer_subsidies;
create policy farmer_subsidies_write on farmer_subsidies
for all using (auth_role() in ('super_admin', 'admin', 'ministry_officer'));

drop policy if exists geo_rw on geo_locations;
create policy geo_rw on geo_locations
for select using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer', 'county_officer', 'district_officer')
);

drop policy if exists geo_ins on geo_locations;
create policy geo_ins on geo_locations
for insert with check (
  auth_role() in ('super_admin', 'admin', 'field_agent', 'call_center_agent')
);

drop policy if exists farmer_production_rw on farmer_production;
create policy farmer_production_rw on farmer_production
for select using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer', 'county_officer', 'district_officer')
);

drop policy if exists farmer_production_write on farmer_production;
create policy farmer_production_write on farmer_production
for all using (auth_role() in ('super_admin', 'admin', 'field_agent', 'call_center_agent'));

-- Field intelligence
drop policy if exists field_reports_rw on field_reports;
create policy field_reports_rw on field_reports
for select using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer', 'county_officer', 'district_officer')
);

drop policy if exists field_reports_ins on field_reports;
create policy field_reports_ins on field_reports
for insert with check (
  auth_role() in ('super_admin', 'admin', 'field_agent', 'call_center_agent')
);

drop policy if exists food_sec_rw on food_security_indicators;
create policy food_sec_rw on food_security_indicators
for select using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer', 'donor_partner')
);

drop policy if exists food_sec_write on food_security_indicators;
create policy food_sec_write on food_security_indicators
for all using (auth_role() in ('super_admin', 'admin', 'ministry_officer'));

-- PLOTS — align with farmers access
drop policy if exists plots_access on plots;
create policy plots_access on plots
for select using (
  auth_role() in ('super_admin', 'admin', 'ministry_officer', 'government_officer')
  or exists (
    select 1 from farmers f
    where f.id = plots.farmer_id
    and (
      auth_role() in ('field_agent', 'call_center_agent', 'cooperative_manager')
      or (
        auth_role() = 'county_officer'
        and f.county = auth_county()
      )
    )
  )
);

drop policy if exists plots_write on plots;
create policy plots_write on plots
for insert with check (
  auth_role() in ('super_admin', 'admin', 'field_agent', 'call_center_agent', 'cooperative_manager')
);
