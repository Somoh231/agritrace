-- ===========================================================================
-- Ministry preview readiness — read-only preview accounts and scoped writes
-- ---------------------------------------------------------------------------
-- PROPOSAL. Apply to STAGING first; production only with owner approval.
-- Requires 20260926100000_harden_profile_role_assignment.sql (applied in
-- production 2026-09-26). Rollback: the matching .rollback.sql file.
-- Tested by `npm run test:db:preview` (throwaway local Supabase Postgres).
--
--   A. profiles.preview_read_only: per-account, revocable read-only flag,
--      settable only by the service role / an administrator workflow.
--   B. Fail-closed RESTRICTIVE policies on every RLS table in `public`: a
--      preview account cannot INSERT, UPDATE or DELETE anything through
--      PostgREST, whatever its role's permissive policies allow.
--   C. farmers_update / plots_update / rice_update_agents scoped to the
--      actor's county, district or organisation (they were national), and
--      call_center_agent no longer updates records it did not create.
-- ===========================================================================

begin;
set local client_min_messages = warning;

-- A. Read-only preview flag ---------------------------------------------------
alter table public.profiles
  add column if not exists preview_read_only boolean not null default false;

comment on column public.profiles.preview_read_only is
  'Read-only stakeholder preview account: every write is refused by RLS and the application. Set only by an administrator workflow.';

-- Users cannot set or clear the flag themselves (extends the 2026-09-26 guard).
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') and (
       new.id is distinct from old.id
    or new.role is distinct from old.role
    or new.is_active is distinct from old.is_active
    or new.deactivated_at is distinct from old.deactivated_at
    or new.organization_id is distinct from old.organization_id
    or new.county is distinct from old.county
    or new.district is distinct from old.district
    or new.email is distinct from old.email
    or new.preview_read_only is distinct from old.preview_read_only
  ) then
    raise exception 'Role, activation, scope and preview changes require an administrator workflow'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.is_preview_read_only()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select preview_read_only from public.profiles where id = auth.uid()), false);
$$;

revoke all on function public.is_preview_read_only() from public;
grant execute on function public.is_preview_read_only() to authenticated, anon, service_role;

-- B. Fail-closed write block for preview accounts on every RLS table ----------
do $$
declare
  t record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
  loop
    execute format('drop policy if exists preview_ro_insert on public.%I', t.relname);
    execute format('drop policy if exists preview_ro_update on public.%I', t.relname);
    execute format('drop policy if exists preview_ro_delete on public.%I', t.relname);
    execute format(
      'create policy preview_ro_insert on public.%I as restrictive for insert to authenticated with check (not public.is_preview_read_only())',
      t.relname);
    execute format(
      'create policy preview_ro_update on public.%I as restrictive for update to authenticated using (not public.is_preview_read_only()) with check (not public.is_preview_read_only())',
      t.relname);
    execute format(
      'create policy preview_ro_delete on public.%I as restrictive for delete to authenticated using (not public.is_preview_read_only())',
      t.relname);
  end loop;
end $$;

-- C. Scoped farmer / plot / production updates --------------------------------
-- County roles: own county. District and field roles: own county, and own
-- district when the profile has one. Cooperative managers: own organisation.
create or replace function public.record_in_write_scope(rec_county text, rec_district text, rec_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case public.profile_role()
    when 'county_officer' then rec_county is not null and rec_county = public.profile_county()
    when 'district_officer' then rec_county is not null and rec_county = public.profile_county()
      and (public.profile_district() is null or rec_district = public.profile_district())
    when 'field_agent' then rec_county is not null and rec_county = public.profile_county()
      and (public.profile_district() is null or rec_district = public.profile_district())
    when 'cooperative_manager' then rec_org is not null
      and rec_org = (select organization_id from public.profiles where id = auth.uid() and coalesce(is_active, true))
    else false
  end;
$$;

revoke all on function public.record_in_write_scope(text, text, uuid) from public;
grant execute on function public.record_in_write_scope(text, text, uuid) to authenticated, service_role;

drop policy if exists farmers_update on public.farmers;
create policy farmers_update on public.farmers for update
  using (
    public.is_ministry_wide() or public.profile_role() = 'super_admin'
    or (public.profile_role() in ('field_agent', 'cooperative_manager', 'county_officer', 'district_officer')
        and public.record_in_write_scope(county, district, organization_id))
  )
  with check (
    public.is_ministry_wide() or public.profile_role() = 'super_admin'
    or (public.profile_role() in ('field_agent', 'cooperative_manager', 'county_officer', 'district_officer')
        and public.record_in_write_scope(county, district, organization_id))
  );

drop policy if exists plots_update on public.plots;
create policy plots_update on public.plots for update
  using (
    public.is_ministry_wide() or public.profile_role() = 'super_admin'
    or (public.profile_role() in ('field_agent', 'cooperative_manager', 'county_officer', 'district_officer')
        and exists (select 1 from public.farmers f where f.id = plots.farmer_id
                    and public.record_in_write_scope(f.county, f.district, f.organization_id)))
  )
  with check (
    public.is_ministry_wide() or public.profile_role() = 'super_admin'
    or (public.profile_role() in ('field_agent', 'cooperative_manager', 'county_officer', 'district_officer')
        and exists (select 1 from public.farmers f where f.id = plots.farmer_id
                    and public.record_in_write_scope(f.county, f.district, f.organization_id)))
  );

drop policy if exists rice_update_agents on public.rice_production_records;
create policy rice_update_agents on public.rice_production_records for update
  using (
    public.is_ministry_wide() or public.profile_role() = 'super_admin'
    or (public.profile_role() in ('field_agent', 'county_officer', 'district_officer')
        and exists (select 1 from public.farmers f where f.id = rice_production_records.farmer_id
                    and public.record_in_write_scope(f.county, f.district, f.organization_id)))
  )
  with check (
    public.is_ministry_wide() or public.profile_role() = 'super_admin'
    or (public.profile_role() in ('field_agent', 'county_officer', 'district_officer')
        and exists (select 1 from public.farmers f where f.id = rice_production_records.farmer_id
                    and public.record_in_write_scope(f.county, f.district, f.organization_id)))
  );

commit;
