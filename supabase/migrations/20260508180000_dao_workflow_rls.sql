-- Extend RLS so District Agriculture Officers (DAO / district_officer) can capture operational workflows.

drop policy if exists field_reports_write on field_reports;
create policy field_reports_write on field_reports for insert with check (
  public.profile_role() in (
    'super_admin',
    'field_agent',
    'district_officer',
    'call_center_agent',
    'ministry_officer',
    'government_officer'
  )
  or public.is_ministry_wide()
);

drop policy if exists field_reports_read on field_reports;
create policy field_reports_read on field_reports for select using (
  public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
  or (
    public.profile_role() = 'county_officer'
    and county = public.profile_county()
  )
  or public.profile_role() in ('field_agent', 'district_officer', 'call_center_agent', 'auditor')
);

drop policy if exists geo_write on geo_locations;
create policy geo_write on geo_locations for insert with check (
  public.profile_role() in ('super_admin', 'field_agent', 'district_officer', 'call_center_agent')
  or public.is_ministry_wide()
);

drop policy if exists geo_read on geo_locations;
create policy geo_read on geo_locations for select using (
  public.is_ministry_wide()
  or public.profile_role() in ('super_admin', 'county_officer', 'field_agent', 'district_officer', 'auditor')
);

drop policy if exists dist_log_write on distribution_logs;
create policy dist_log_write on distribution_logs for insert with check (
  public.profile_role() in (
    'super_admin',
    'field_agent',
    'district_officer',
    'warehouse_manager',
    'cooperative_manager'
  )
  or public.is_ministry_wide()
);
