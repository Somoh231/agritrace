-- RC1 controlled-pilot RLS hardening.
-- Prepared from static policy review; DO NOT apply without database-owner approval
-- and normal-user validation in a disposable/staging project.

create or replace function public.can_read_warehouse_transfer(
  source_warehouse uuid,
  destination_warehouse uuid,
  requester uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active is true
      and (
        p.role in (
          'super_admin',
          'admin',
          'ministry_admin',
          'ministry_officer',
          'government_officer'
        )
        or (
          p.role in (
            'county_agriculture_coordinator',
            'county_officer',
            'dao_officer',
            'district_officer'
          )
          and p.county is not null
          and exists (
            select 1
            from public.warehouses w
            where (w.id = source_warehouse or w.id = destination_warehouse)
              and lower(w.county) = lower(p.county)
          )
        )
        or (
          p.role = 'warehouse_manager'
          and exists (
            select 1
            from public.warehouse_assignments wa
            where wa.profile_id = p.id
              and (wa.warehouse_id = source_warehouse or wa.warehouse_id = destination_warehouse)
          )
        )
        or (
          p.role in ('cooperative_manager', 'exporter')
          and requester = p.id
        )
      )
  );
$$;

create or replace function public.can_manage_warehouse_transfer(
  source_warehouse uuid,
  destination_warehouse uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active is true
      and (
        p.role in (
          'super_admin',
          'admin',
          'ministry_admin',
          'ministry_officer',
          'government_officer'
        )
        or (
          p.role in (
            'county_agriculture_coordinator',
            'county_officer',
            'dao_officer',
            'district_officer'
          )
          and p.county is not null
          and exists (
            select 1
            from public.warehouses w
            where (w.id = source_warehouse or w.id = destination_warehouse)
              and lower(w.county) = lower(p.county)
          )
        )
        or (
          p.role = 'warehouse_manager'
          and exists (
            select 1
            from public.warehouse_assignments wa
            where wa.profile_id = p.id
              and (wa.warehouse_id = source_warehouse or wa.warehouse_id = destination_warehouse)
          )
        )
      )
  );
$$;

revoke all on function public.can_read_warehouse_transfer(uuid, uuid, uuid) from public, anon;
revoke all on function public.can_manage_warehouse_transfer(uuid, uuid) from public, anon;
grant execute on function public.can_read_warehouse_transfer(uuid, uuid, uuid) to authenticated;
grant execute on function public.can_manage_warehouse_transfer(uuid, uuid) to authenticated;

drop policy if exists warehouse_transfer_orders_select on public.warehouse_transfer_orders;
drop policy if exists warehouse_transfer_orders_write on public.warehouse_transfer_orders;
drop policy if exists warehouse_transfer_orders_insert on public.warehouse_transfer_orders;
drop policy if exists warehouse_transfer_orders_update on public.warehouse_transfer_orders;
drop policy if exists warehouse_transfer_orders_delete on public.warehouse_transfer_orders;

create policy warehouse_transfer_orders_select
on public.warehouse_transfer_orders
for select
to authenticated
using (
  public.can_read_warehouse_transfer(warehouse_from, warehouse_to, requested_by)
);

create policy warehouse_transfer_orders_insert
on public.warehouse_transfer_orders
for insert
to authenticated
with check (
  public.can_manage_warehouse_transfer(warehouse_from, warehouse_to)
  and (
    public.is_ministry_wide()
    or requested_by = auth.uid()
  )
);

create policy warehouse_transfer_orders_update
on public.warehouse_transfer_orders
for update
to authenticated
using (
  public.can_manage_warehouse_transfer(warehouse_from, warehouse_to)
)
with check (
  public.can_manage_warehouse_transfer(warehouse_from, warehouse_to)
);

create policy warehouse_transfer_orders_delete
on public.warehouse_transfer_orders
for delete
to authenticated
using (
  public.is_ministry_wide()
);

create or replace function public.can_read_field_report(
  report_county text,
  report_officer uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active is true
      and (
        p.role in (
          'super_admin',
          'admin',
          'ministry_admin',
          'ministry_officer',
          'government_officer',
          'auditor'
        )
        or (
          p.role in ('county_agriculture_coordinator', 'county_officer')
          and report_county is not null
          and lower(report_county) = lower(p.county)
        )
        or (
          p.role in ('dao_officer', 'district_officer')
          and report_county is not null
          and p.district is not null
          and lower(report_county) = lower(p.county)
          and exists (
            select 1
            from public.profiles officer
            where officer.id = report_officer
              and officer.district is not null
              and lower(officer.district) = lower(p.district)
          )
        )
        or (
          p.role in ('clan_technician', 'field_agent', 'call_center_agent')
          and report_officer = p.id
        )
      )
  );
$$;

create or replace function public.can_write_field_report(
  report_county text,
  report_officer uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active is true
      and (
        p.role in (
          'super_admin',
          'admin',
          'ministry_admin',
          'ministry_officer',
          'government_officer'
        )
        or (
          p.role in (
            'clan_technician',
            'field_agent',
            'call_center_agent',
            'dao_officer',
            'district_officer'
          )
          and report_officer = p.id
          and report_county is not null
          and lower(report_county) = lower(p.county)
        )
      )
  );
$$;

revoke all on function public.can_read_field_report(text, uuid) from public, anon;
revoke all on function public.can_write_field_report(text, uuid) from public, anon;
grant execute on function public.can_read_field_report(text, uuid) to authenticated;
grant execute on function public.can_write_field_report(text, uuid) to authenticated;

drop policy if exists field_reports_read on public.field_reports;
drop policy if exists field_reports_write on public.field_reports;

create policy field_reports_read
on public.field_reports
for select
to authenticated
using (
  public.can_read_field_report(county, officer_profile_id)
);

create policy field_reports_write
on public.field_reports
for insert
to authenticated
with check (
  public.can_write_field_report(county, officer_profile_id)
);

create or replace function public.can_read_geo_location(target_farmer uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active is true
      and (
        p.role in (
          'super_admin',
          'admin',
          'ministry_admin',
          'ministry_officer',
          'government_officer',
          'auditor'
        )
        or exists (
          select 1
          from public.farmers f
          where f.id = target_farmer
            and (
              (
                p.role in ('county_agriculture_coordinator', 'county_officer')
                and lower(f.county) = lower(p.county)
              )
              or (
                p.role in ('dao_officer', 'district_officer')
                and p.district is not null
                and f.district is not null
                and lower(f.county) = lower(p.county)
                and lower(f.district) = lower(p.district)
              )
              or (
                p.role in ('clan_technician', 'field_agent', 'call_center_agent')
                and f.registered_by = p.id
              )
              or (
                p.role in ('cooperative_manager', 'exporter')
                and p.organization_id is not null
                and f.organization_id = p.organization_id
              )
            )
        )
      )
  );
$$;

create or replace function public.can_write_geo_location(target_farmer uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active is true
      and (
        p.role in (
          'super_admin',
          'admin',
          'ministry_admin',
          'ministry_officer',
          'government_officer'
        )
        or exists (
          select 1
          from public.farmers f
          where f.id = target_farmer
            and (
              (
                p.role in ('dao_officer', 'district_officer')
                and p.district is not null
                and f.district is not null
                and lower(f.county) = lower(p.county)
                and lower(f.district) = lower(p.district)
              )
              or (
                p.role in ('clan_technician', 'field_agent', 'call_center_agent')
                and f.registered_by = p.id
              )
            )
        )
      )
  );
$$;

revoke all on function public.can_read_geo_location(uuid) from public, anon;
revoke all on function public.can_write_geo_location(uuid) from public, anon;
grant execute on function public.can_read_geo_location(uuid) to authenticated;
grant execute on function public.can_write_geo_location(uuid) to authenticated;

drop policy if exists geo_read on public.geo_locations;
drop policy if exists geo_write on public.geo_locations;

create policy geo_read
on public.geo_locations
for select
to authenticated
using (
  public.can_read_geo_location(farmer_id)
);

create policy geo_write
on public.geo_locations
for insert
to authenticated
with check (
  public.can_write_geo_location(farmer_id)
);
