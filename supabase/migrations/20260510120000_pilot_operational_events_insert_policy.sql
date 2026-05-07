-- Allow authenticated ministry/logistics actors to record pilot operational events from workflow APIs.

drop policy if exists pilot_events_insert on pilot_operational_events;

create policy pilot_events_insert on pilot_operational_events for insert to authenticated with check (
  public.is_ministry_wide()
  or public.profile_role() in (
    'super_admin',
    'admin',
    'ministry_officer',
    'government_officer',
    'warehouse_manager',
    'county_officer',
    'district_officer',
    'field_agent',
    'auditor'
  )
);
