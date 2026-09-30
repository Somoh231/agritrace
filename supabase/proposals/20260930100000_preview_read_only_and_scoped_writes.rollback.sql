-- Rollback for 20260930100000_preview_read_only_and_scoped_writes.sql.
-- Restores the pre-proposal policies and guard exactly as they were
-- (20260207101000_auth_trigger_and_rls.sql + 20260926100000 guard).

begin;
set local client_min_messages = warning;

do $$
declare
  t record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  loop
    execute format('drop policy if exists preview_ro_insert on public.%I', t.relname);
    execute format('drop policy if exists preview_ro_update on public.%I', t.relname);
    execute format('drop policy if exists preview_ro_delete on public.%I', t.relname);
  end loop;
end $$;

drop policy if exists farmers_update on public.farmers;
create policy farmers_update on farmers for update using (
  public.is_ministry_wide()
  or public.profile_role() = 'super_admin'
  or public.profile_role() in ('field_agent','call_center_agent','cooperative_manager','county_officer','district_officer')
);

drop policy if exists plots_update on public.plots;
create policy plots_update on plots for update using (
  public.is_ministry_wide()
  or public.profile_role() in ('super_admin','field_agent','call_center_agent','cooperative_manager','county_officer','district_officer')
);

drop policy if exists rice_update_agents on public.rice_production_records;
create policy rice_update_agents on rice_production_records for update using (
  public.is_ministry_wide()
  or public.profile_role() in ('super_admin','field_agent','call_center_agent','county_officer','district_officer')
);

drop function if exists public.record_in_write_scope(text, text, uuid);
drop function if exists public.is_preview_read_only();

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
  ) then
    raise exception 'Role, activation and scope changes require an administrator workflow'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

alter table public.profiles drop column if exists preview_read_only;

commit;
