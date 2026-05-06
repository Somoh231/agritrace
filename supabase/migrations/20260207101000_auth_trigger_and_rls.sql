-- Auth profile bootstrap + row level security (runs after core tables).

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup (SECURITY DEFINER — bypasses RLS).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r user_role;
begin
  r := case lower(trim(coalesce(new.raw_user_meta_data->>'role', '')))
    when 'super_admin' then 'super_admin'::user_role
    when 'admin' then 'admin'::user_role
    when 'ministry_officer' then 'ministry_officer'::user_role
    when 'government_officer' then 'government_officer'::user_role
    when 'county_officer' then 'county_officer'::user_role
    when 'district_officer' then 'district_officer'::user_role
    when 'cooperative_manager' then 'cooperative_manager'::user_role
    when 'field_agent' then 'field_agent'::user_role
    when 'warehouse_manager' then 'warehouse_manager'::user_role
    when 'donor_partner' then 'donor_partner'::user_role
    when 'exporter' then 'exporter'::user_role
    when 'call_center_agent' then 'call_center_agent'::user_role
    when 'auditor' then 'auditor'::user_role
    else 'field_agent'::user_role
  end;

  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(coalesce(new.email, ''), '@', 1),
      'User'
    ),
    r,
    true
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Policy helpers
-- ---------------------------------------------------------------------------
create or replace function public.profile_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.profile_county()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select county from public.profiles where id = auth.uid();
$$;

create or replace function public.profile_district()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select district from public.profiles where id = auth.uid();
$$;

create or replace function public.is_ministry_wide()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and coalesce(p.is_active, true)
      and p.role in ('super_admin','admin','ministry_officer','government_officer')
  );
$$;

-- ---------------------------------------------------------------------------
-- ENABLE RLS
-- ---------------------------------------------------------------------------
alter table counties enable row level security;
alter table districts enable row level security;
alter table profiles enable row level security;
alter table organizations enable row level security;
alter table warehouses enable row level security;
alter table warehouse_assignments enable row level security;
alter table warehouse_stock enable row level security;
alter table inventory_items enable row level security;
alter table inventory_movements enable row level security;
alter table input_allocations enable row level security;
alter table distribution_logs enable row level security;
alter table supplier_records enable row level security;
alter table donor_shipments enable row level security;
alter table expiry_tracking enable row level security;
alter table field_reports enable row level security;
alter table food_security_indicators enable row level security;
alter table locations enable row level security;
alter table farmers enable row level security;
alter table farmer_visits enable row level security;
alter table farmer_subsidies enable row level security;
alter table geo_locations enable row level security;
alter table plots enable row level security;
alter table lots enable row level security;
alter table movements enable row level security;
alter table rice_production_records enable row level security;
alter table compliance_records enable row level security;
alter table audit_log enable row level security;
alter table reports enable row level security;

-- ---------------------------------------------------------------------------
-- COUNTIES / DISTRICTS — readable by authenticated users with profile
-- ---------------------------------------------------------------------------
drop policy if exists counties_read_auth on counties;
create policy counties_read_auth on counties for select using (auth.uid() is not null);

drop policy if exists districts_read_auth on districts;
create policy districts_read_auth on districts for select using (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------
drop policy if exists profiles_self_select on profiles;
create policy profiles_self_select on profiles for select
using (
  id = auth.uid()
  or public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
);

drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles for update
using (id = auth.uid());

drop policy if exists profiles_ministry_update on profiles;
create policy profiles_ministry_update on profiles for update
using (public.is_ministry_wide() or public.profile_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- ORGANIZATIONS
-- ---------------------------------------------------------------------------
drop policy if exists org_read on organizations;
create policy org_read on organizations for select using (
  id = (select organization_id from profiles where id = auth.uid())
  or public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
);

drop policy if exists org_write_ministry on organizations;
create policy org_write_ministry on organizations for all
using (public.is_ministry_wide() or public.profile_role() = 'super_admin')
with check (public.is_ministry_wide() or public.profile_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- WAREHOUSES & STOCK
-- ---------------------------------------------------------------------------
drop policy if exists warehouses_read on warehouses;
create policy warehouses_read on warehouses for select using (
  public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
  or exists (
    select 1 from warehouse_assignments wa
    where wa.profile_id = auth.uid() and wa.warehouse_id = warehouses.id
  )
  or (
    public.profile_role() = 'county_officer'
    and county = public.profile_county()
  )
  or public.profile_role() = 'warehouse_manager'
);

drop policy if exists warehouses_write_ministry on warehouses;
create policy warehouses_write_ministry on warehouses for insert with check (
  public.is_ministry_wide() or public.profile_role() = 'super_admin'
);

drop policy if exists warehouses_update_wm on warehouses;
create policy warehouses_update_wm on warehouses for update using (
  public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
  or exists (
    select 1 from warehouse_assignments wa
    where wa.profile_id = auth.uid() and wa.warehouse_id = warehouses.id
  )
);

drop policy if exists warehouse_assignments_read on warehouse_assignments;
create policy warehouse_assignments_read on warehouse_assignments for select using (
  public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
  or profile_id = auth.uid()
);

drop policy if exists warehouse_assignments_write on warehouse_assignments;
create policy warehouse_assignments_write on warehouse_assignments for all
using (public.is_ministry_wide() or public.profile_role() = 'super_admin')
with check (public.is_ministry_wide() or public.profile_role() = 'super_admin');

drop policy if exists wh_stock_read on warehouse_stock;
create policy wh_stock_read on warehouse_stock for select using (
  public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
  or exists (
    select 1 from warehouse_assignments wa
    where wa.profile_id = auth.uid() and wa.warehouse_id = warehouse_stock.warehouse_id
  )
  or (
    public.profile_role() = 'county_officer'
    and exists (
      select 1 from warehouses w
      where w.id = warehouse_stock.warehouse_id and w.county = public.profile_county()
    )
  )
);

drop policy if exists wh_stock_write_wm on warehouse_stock;
create policy wh_stock_write_wm on warehouse_stock for all
using (
  public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
  or exists (
    select 1 from warehouse_assignments wa
    where wa.profile_id = auth.uid() and wa.warehouse_id = warehouse_stock.warehouse_id
  )
)
with check (
  public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
  or exists (
    select 1 from warehouse_assignments wa
    where wa.profile_id = auth.uid() and wa.warehouse_id = warehouse_stock.warehouse_id
  )
);

drop policy if exists inventory_items_read on inventory_items;
create policy inventory_items_read on inventory_items for select using (auth.uid() is not null);

drop policy if exists inventory_items_write on inventory_items;
create policy inventory_items_write on inventory_items for all
using (public.is_ministry_wide() or public.profile_role() = 'super_admin')
with check (public.is_ministry_wide() or public.profile_role() = 'super_admin');

drop policy if exists inv_mov_read on inventory_movements;
create policy inv_mov_read on inventory_movements for select using (
  public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
  or public.profile_role() = 'warehouse_manager'
);

drop policy if exists inv_mov_write on inventory_movements;
create policy inv_mov_write on inventory_movements for insert with check (
  public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
  or public.profile_role() = 'warehouse_manager'
);

drop policy if exists input_alloc_read on input_allocations;
create policy input_alloc_read on input_allocations for select using (
  public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
  or (
    public.profile_role() = 'county_officer'
    and county = public.profile_county()
  )
);

drop policy if exists input_alloc_write on input_allocations;
create policy input_alloc_write on input_allocations for all
using (public.is_ministry_wide() or public.profile_role() = 'super_admin')
with check (public.is_ministry_wide() or public.profile_role() = 'super_admin');

drop policy if exists dist_log_read on distribution_logs;
create policy dist_log_read on distribution_logs for select using (
  public.is_ministry_wide()
  or public.profile_role() in ('super_admin','county_officer','cooperative_manager','donor_partner')
);

drop policy if exists dist_log_write on distribution_logs;
create policy dist_log_write on distribution_logs for insert with check (
  public.profile_role() in ('super_admin','field_agent','warehouse_manager','cooperative_manager')
  or public.is_ministry_wide()
);

drop policy if exists supplier_read on supplier_records;
create policy supplier_read on supplier_records for select using (auth.uid() is not null);

drop policy if exists supplier_write on supplier_records;
create policy supplier_write on supplier_records for all
using (public.is_ministry_wide() or public.profile_role() = 'super_admin')
with check (public.is_ministry_wide() or public.profile_role() = 'super_admin');

drop policy if exists donor_ship_read on donor_shipments;
create policy donor_ship_read on donor_shipments for select using (
  public.is_ministry_wide()
  or public.profile_role() in ('super_admin','donor_partner','auditor')
);

drop policy if exists donor_ship_write on donor_shipments;
create policy donor_ship_write on donor_shipments for all
using (public.is_ministry_wide() or public.profile_role() = 'super_admin')
with check (public.is_ministry_wide() or public.profile_role() = 'super_admin');

drop policy if exists expiry_read on expiry_tracking;
create policy expiry_read on expiry_tracking for select using (
  public.is_ministry_wide()
  or public.profile_role() in ('super_admin','warehouse_manager')
);

drop policy if exists expiry_write on expiry_tracking;
create policy expiry_write on expiry_tracking for all
using (public.is_ministry_wide() or public.profile_role() in ('super_admin','warehouse_manager'))
with check (public.is_ministry_wide() or public.profile_role() in ('super_admin','warehouse_manager'));

-- ---------------------------------------------------------------------------
-- FIELD REPORTS & FOOD SECURITY
-- ---------------------------------------------------------------------------
drop policy if exists field_reports_read on field_reports;
create policy field_reports_read on field_reports for select using (
  public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
  or (
    public.profile_role() = 'county_officer'
    and county = public.profile_county()
  )
  or public.profile_role() in ('field_agent','call_center_agent','auditor')
);

drop policy if exists field_reports_write on field_reports;
create policy field_reports_write on field_reports for insert with check (
  public.profile_role() in ('super_admin','field_agent','call_center_agent','ministry_officer','government_officer')
  or public.is_ministry_wide()
);

drop policy if exists fs_read on food_security_indicators;
create policy fs_read on food_security_indicators for select using (
  public.is_ministry_wide()
  or public.profile_role() in ('super_admin','county_officer','auditor','donor_partner')
);

drop policy if exists fs_write on food_security_indicators;
create policy fs_write on food_security_indicators for all
using (public.is_ministry_wide() or public.profile_role() = 'super_admin')
with check (public.is_ministry_wide() or public.profile_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- LOCATIONS (org scoped + ministry)
-- ---------------------------------------------------------------------------
drop policy if exists locations_org on locations;
create policy locations_org on locations for all using (
  organization_id = (select organization_id from profiles where id = auth.uid())
  or public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
)
with check (
  organization_id = (select organization_id from profiles where id = auth.uid())
  or public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
);

-- ---------------------------------------------------------------------------
-- FARMERS & RELATED
-- ---------------------------------------------------------------------------
drop policy if exists farmers_access on farmers;
create policy farmers_access on farmers for select using (
  public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
  or public.profile_role() = 'auditor'
  or organization_id = (select organization_id from profiles where id = auth.uid())
  or (
    county = public.profile_county()
    and public.profile_role() in ('field_agent','call_center_agent','county_officer')
  )
  or (
    public.profile_role() = 'district_officer'
    and county = public.profile_county()
    and district is not distinct from public.profile_district()
  )
);

drop policy if exists farmers_write on farmers;
create policy farmers_write on farmers for insert with check (
  public.profile_role() in ('super_admin','field_agent','call_center_agent','cooperative_manager','county_officer','district_officer')
  or public.is_ministry_wide()
);

drop policy if exists farmers_update on farmers;
create policy farmers_update on farmers for update using (
  public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
  or public.profile_role() in ('field_agent','call_center_agent','cooperative_manager','county_officer','district_officer')
);

drop policy if exists farmer_visits_all on farmer_visits;
create policy farmer_visits_all on farmer_visits for all using (
  public.is_ministry_wide()
  or public.profile_role() in ('super_admin','field_agent','call_center_agent','county_officer','district_officer')
)
with check (
  public.profile_role() in ('super_admin','field_agent','call_center_agent','county_officer','district_officer')
  or public.is_ministry_wide()
);

drop policy if exists farmer_sub_read on farmer_subsidies;
create policy farmer_sub_read on farmer_subsidies for select using (
  public.is_ministry_wide()
  or public.profile_role() in ('super_admin','county_officer','auditor','donor_partner','cooperative_manager')
);

drop policy if exists farmer_sub_write on farmer_subsidies;
create policy farmer_sub_write on farmer_subsidies for all
using (public.is_ministry_wide() or public.profile_role() = 'super_admin')
with check (public.is_ministry_wide() or public.profile_role() = 'super_admin');

drop policy if exists geo_read on geo_locations;
create policy geo_read on geo_locations for select using (
  public.is_ministry_wide()
  or public.profile_role() in ('super_admin','county_officer','field_agent','auditor')
);

drop policy if exists geo_write on geo_locations;
create policy geo_write on geo_locations for insert with check (
  public.profile_role() in ('super_admin','field_agent','call_center_agent')
  or public.is_ministry_wide()
);

-- ---------------------------------------------------------------------------
-- PLOTS
-- ---------------------------------------------------------------------------
drop policy if exists plots_access on plots;
create policy plots_access on plots for select using (
  public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
  or exists (
    select 1 from farmers f
    where f.id = plots.farmer_id
      and (
        public.is_ministry_wide()
        or f.organization_id = (select organization_id from profiles where id = auth.uid())
        or (
          f.county = public.profile_county()
          and public.profile_role() in ('field_agent','call_center_agent','county_officer','district_officer')
        )
      )
  )
);

drop policy if exists plots_write on plots;
create policy plots_write on plots for insert with check (
  public.profile_role() in ('super_admin','field_agent','call_center_agent','cooperative_manager','county_officer','district_officer')
  or public.is_ministry_wide()
);

drop policy if exists plots_update on plots;
create policy plots_update on plots for update using (
  public.is_ministry_wide()
  or public.profile_role() in ('super_admin','field_agent','call_center_agent','cooperative_manager','county_officer','district_officer')
);

-- ---------------------------------------------------------------------------
-- LOTS / MOVEMENTS / COMPLIANCE (org scoped + ministry)
-- ---------------------------------------------------------------------------
drop policy if exists lots_org on lots;
create policy lots_org on lots for all using (
  organization_id = (select organization_id from profiles where id = auth.uid())
  or public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
)
with check (
  organization_id = (select organization_id from profiles where id = auth.uid())
  or public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
);

drop policy if exists movements_org on movements;
create policy movements_org on movements for all using (
  lot_id in (
    select id from lots where organization_id = (select organization_id from profiles where id = auth.uid())
  )
  or public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
)
with check (
  lot_id in (
    select id from lots where organization_id = (select organization_id from profiles where id = auth.uid())
  )
  or public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
);

drop policy if exists compliance_org on compliance_records;
create policy compliance_org on compliance_records for all using (
  lot_id in (
    select id from lots where organization_id = (select organization_id from profiles where id = auth.uid())
  )
  or public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
)
with check (
  lot_id in (
    select id from lots where organization_id = (select organization_id from profiles where id = auth.uid())
  )
  or public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
);

-- ---------------------------------------------------------------------------
-- RICE PRODUCTION
-- ---------------------------------------------------------------------------
drop policy if exists rice_read_gov on rice_production_records;
create policy rice_read_gov on rice_production_records for select using (
  public.is_ministry_wide()
  or public.profile_role() in ('super_admin','county_officer','district_officer','auditor')
);

drop policy if exists rice_write_agents on rice_production_records;
create policy rice_write_agents on rice_production_records for insert with check (
  public.profile_role() in ('super_admin','field_agent','call_center_agent','county_officer','district_officer')
  or public.is_ministry_wide()
);

drop policy if exists rice_update_agents on rice_production_records;
create policy rice_update_agents on rice_production_records for update using (
  public.is_ministry_wide()
  or public.profile_role() in ('super_admin','field_agent','call_center_agent','county_officer','district_officer')
);

-- ---------------------------------------------------------------------------
-- AUDIT & REPORTS
-- ---------------------------------------------------------------------------
drop policy if exists audit_insert on audit_log;
create policy audit_insert on audit_log for insert with check (auth.uid() is not null);

drop policy if exists audit_read on audit_log;
create policy audit_read on audit_log for select using (
  public.profile_role() in ('super_admin','auditor','ministry_officer','government_officer')
  or public.is_ministry_wide()
);

drop policy if exists reports_read_gov on reports;
create policy reports_read_gov on reports for select using (
  public.profile_role() in ('super_admin','county_officer','district_officer','ministry_officer','government_officer','auditor','donor_partner')
  or public.is_ministry_wide()
);

drop policy if exists reports_write_admin on reports;
create policy reports_write_admin on reports for all
using (public.profile_role() = 'super_admin' or public.is_ministry_wide())
with check (public.profile_role() = 'super_admin' or public.is_ministry_wide());

drop policy if exists reports_insert_gov on reports;
create policy reports_insert_gov on reports for insert with check (
  public.profile_role() in ('super_admin','county_officer','district_officer','ministry_officer','government_officer')
  or public.is_ministry_wide()
);
