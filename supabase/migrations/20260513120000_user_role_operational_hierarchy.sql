-- Operational hierarchy roles (MoA Liberia): CLAN → DAO → CAC → Ministry.
-- Adds canonical enum labels alongside legacy values. RLS policies extended in this migration for workflow tables.

do $$ begin
  alter type user_role add value 'clan_technician';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type user_role add value 'dao_officer';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type user_role add value 'county_agriculture_coordinator';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type user_role add value 'ministry_admin';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type user_role add value 'donor_observer';
exception when duplicate_object then null; end $$;

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
      and p.role in (
        'super_admin',
        'admin',
        'ministry_officer',
        'government_officer',
        'ministry_admin'
      )
  );
$$;

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
    when 'ministry_admin' then 'ministry_admin'::user_role
    when 'ministry_officer' then 'ministry_officer'::user_role
    when 'government_officer' then 'government_officer'::user_role
    when 'county_agriculture_coordinator' then 'county_agriculture_coordinator'::user_role
    when 'county_officer' then 'county_officer'::user_role
    when 'dao_officer' then 'dao_officer'::user_role
    when 'district_officer' then 'district_officer'::user_role
    when 'clan_technician' then 'clan_technician'::user_role
    when 'cooperative_manager' then 'cooperative_manager'::user_role
    when 'field_agent' then 'field_agent'::user_role
    when 'warehouse_manager' then 'warehouse_manager'::user_role
    when 'donor_observer' then 'donor_observer'::user_role
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

-- ---------------------------------------------------------------------------
-- Extend workflow RLS to recognise new role enum values (mirrors legacy sets).
-- ---------------------------------------------------------------------------

drop policy if exists field_reports_write on field_reports;
create policy field_reports_write on field_reports for insert with check (
  public.profile_role() in (
    'super_admin',
    'field_agent',
    'clan_technician',
    'district_officer',
    'dao_officer',
    'call_center_agent',
    'ministry_officer',
    'government_officer',
    'ministry_admin'
  )
  or public.is_ministry_wide()
);

drop policy if exists field_reports_read on field_reports;
create policy field_reports_read on field_reports for select using (
  public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
  or (
    public.profile_role() in ('county_officer', 'county_agriculture_coordinator')
    and county = public.profile_county()
  )
  or public.profile_role() in (
    'field_agent',
    'clan_technician',
    'district_officer',
    'dao_officer',
    'call_center_agent',
    'auditor'
  )
);

drop policy if exists geo_write on geo_locations;
create policy geo_write on geo_locations for insert with check (
  public.profile_role() in (
    'super_admin',
    'field_agent',
    'clan_technician',
    'district_officer',
    'dao_officer',
    'call_center_agent'
  )
  or public.is_ministry_wide()
);

drop policy if exists geo_read on geo_locations;
create policy geo_read on geo_locations for select using (
  public.is_ministry_wide()
  or public.profile_role() in (
    'super_admin',
    'county_officer',
    'county_agriculture_coordinator',
    'field_agent',
    'clan_technician',
    'district_officer',
    'dao_officer',
    'auditor'
  )
);

drop policy if exists dist_log_write on distribution_logs;
create policy dist_log_write on distribution_logs for insert with check (
  public.profile_role() in (
    'super_admin',
    'field_agent',
    'clan_technician',
    'district_officer',
    'dao_officer',
    'warehouse_manager',
    'cooperative_manager'
  )
  or public.is_ministry_wide()
);

drop policy if exists pilot_events_insert on pilot_operational_events;

create policy pilot_events_insert on pilot_operational_events for insert to authenticated with check (
  public.is_ministry_wide()
  or public.profile_role() in (
    'super_admin',
    'admin',
    'ministry_officer',
    'government_officer',
    'ministry_admin',
    'warehouse_manager',
    'county_officer',
    'county_agriculture_coordinator',
    'district_officer',
    'dao_officer',
    'field_agent',
    'clan_technician',
    'auditor'
  )
);
