-- Run only after 20260729220000_rc1_geography_rls_hardening.sql has been
-- applied to an approved disposable project:
-- psql "$DISPOSABLE_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rc1_rls_policy_contract.sql

do $$
declare
  transfer_select_qual text;
begin
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'warehouse_transfer_orders'
      and c.relrowsecurity
  ) then
    raise exception 'warehouse_transfer_orders must have RLS enabled';
  end if;

  select qual
    into transfer_select_qual
  from pg_policies
  where schemaname = 'public'
    and tablename = 'warehouse_transfer_orders'
    and policyname = 'warehouse_transfer_orders_select';

  if transfer_select_qual is null then
    raise exception 'warehouse_transfer_orders_select is missing';
  end if;

  if lower(regexp_replace(transfer_select_qual, '[()[:space:]]', '', 'g')) = 'true' then
    raise exception 'warehouse_transfer_orders_select must not use USING (true)';
  end if;

  if position('can_read_warehouse_transfer' in transfer_select_qual) = 0 then
    raise exception 'warehouse transfer SELECT policy must use scoped helper';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'warehouse_transfer_orders'
      and cmd = 'ALL'
  ) then
    raise exception 'warehouse transfer policies must not use permissive FOR ALL';
  end if;

  if (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'warehouse_transfer_orders'
      and policyname in (
        'warehouse_transfer_orders_select',
        'warehouse_transfer_orders_insert',
        'warehouse_transfer_orders_update',
        'warehouse_transfer_orders_delete'
      )
  ) <> 4 then
    raise exception 'warehouse transfer policies must be split by command';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'field_reports'
      and policyname = 'field_reports_read'
      and position('can_read_field_report' in qual) > 0
  ) then
    raise exception 'field report reads must use scoped helper';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'geo_locations'
      and policyname = 'geo_read'
      and position('can_read_geo_location' in qual) > 0
  ) then
    raise exception 'geo reads must use farmer/geography-scoped helper';
  end if;
end
$$;

