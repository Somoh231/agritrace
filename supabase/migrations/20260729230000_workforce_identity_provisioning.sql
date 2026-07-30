-- Workforce identity authority, lifecycle, provenance, and fail-closed RLS.
--
-- EXACTLY-ONCE MIGRATION. Do not run manually more than once. A populated
-- environment must provide an operator-approved bootstrap manifest through:
--   app.workforce_bootstrap_manifest
-- The manifest is data, not an authorization inference. See
-- docs/audits/BOOTSTRAP_ADMIN_TRANSITION_PLAN.md.

begin;

-- ---------------------------------------------------------------------------
-- Hard preconditions: reject partial/manual application and unapproved legacy
-- role state before any persistent object is changed.
-- ---------------------------------------------------------------------------
do $$
begin
  if pg_catalog.to_regclass('public.profile_role_assignments') is not null
     or pg_catalog.to_regclass('public.workforce_role_catalog') is not null
     or pg_catalog.to_regclass('public.workforce_identity_transitions') is not null
     or exists (
       select 1
       from information_schema.columns c
       where c.table_schema = 'public'
         and c.table_name = 'profiles'
         and c.column_name in (
           'account_status',
           'access_transition_status',
           'authorization_version',
           'employee_or_staff_id'
         )
     )
  then
    raise exception
      'workforce identity migration precondition failed: partial or prior application detected';
  end if;
end;
$$;

create temporary table workforce_bootstrap_manifest (
  profile_id uuid primary key,
  role public.user_role not null,
  decision text not null
    check (decision in ('verified', 'temporary_admin')),
  evidence_ref text not null check (pg_catalog.btrim(evidence_ref) <> ''),
  reviewed_by text not null check (pg_catalog.btrim(reviewed_by) <> ''),
  transition_expires_at timestamptz
) on commit drop;

insert into workforce_bootstrap_manifest (
  profile_id,
  role,
  decision,
  evidence_ref,
  reviewed_by,
  transition_expires_at
)
select
  manifest.profile_id,
  manifest.role::public.user_role,
  manifest.decision,
  manifest.evidence_ref,
  manifest.reviewed_by,
  manifest.transition_expires_at
from pg_catalog.jsonb_to_recordset(
  pg_catalog.coalesce(
    pg_catalog.nullif(
      pg_catalog.current_setting('app.workforce_bootstrap_manifest', true),
      ''
    )::jsonb,
    '[]'::jsonb
  )
) as manifest(
  profile_id uuid,
  role text,
  decision text,
  evidence_ref text,
  reviewed_by text,
  transition_expires_at timestamptz
);

do $$
begin
  if exists (
    select 1
    from public.profiles p
    left join workforce_bootstrap_manifest m on m.profile_id = p.id
    where p.is_active and m.profile_id is null
  ) then
    raise exception
      'bootstrap manifest rejected: every active legacy profile requires explicit approval';
  end if;

  if exists (
    select 1
    from workforce_bootstrap_manifest m
    left join public.profiles p on p.id = m.profile_id
    where p.id is null or not p.is_active or p.role <> m.role
  ) then
    raise exception
      'bootstrap manifest rejected: subject must be active and role must exactly match profiles.role';
  end if;

  if exists (
    select 1
    from public.profiles p
    where p.is_active and p.deactivated_at is not null
  ) then
    raise exception
      'bootstrap manifest rejected: active profile has a deactivated timestamp';
  end if;

  if exists (
    select 1
    from workforce_bootstrap_manifest m
    left join auth.users u on u.id = m.profile_id
    where u.id is null
  ) then
    raise exception
      'bootstrap manifest rejected: approved profile has no matching auth.users identity';
  end if;

  if exists (
    select 1
    from workforce_bootstrap_manifest m
    where m.decision = 'temporary_admin'
      and (
        m.role not in ('super_admin', 'admin', 'ministry_admin')
        or m.transition_expires_at is null
        or m.transition_expires_at <= pg_catalog.statement_timestamp()
        or m.transition_expires_at >
          pg_catalog.statement_timestamp() + interval '7 days'
      )
  ) then
    raise exception
      'bootstrap manifest rejected: temporary admin must be an approved admin role with a deadline within 7 days';
  end if;

  if exists (
    select 1
    from workforce_bootstrap_manifest m
    where m.decision = 'verified'
      and m.transition_expires_at is not null
  ) then
    raise exception
      'bootstrap manifest rejected: verified identities cannot carry a transition deadline';
  end if;

  if exists (
    select 1
    from workforce_bootstrap_manifest m
    join public.profiles p on p.id = m.profile_id
    where
      p.organization_id is null
      or (
        m.role in (
          'county_agriculture_coordinator',
          'county_officer',
          'dao_officer',
          'district_officer',
          'clan_technician',
          'field_agent',
          'warehouse_manager'
        )
        and pg_catalog.nullif(pg_catalog.btrim(p.county), '') is null
      )
      or (
        m.role in ('dao_officer', 'district_officer', 'clan_technician')
        and pg_catalog.nullif(pg_catalog.btrim(p.district), '') is null
      )
      or (
        m.role = 'warehouse_manager'
        and not exists (
          select 1
          from public.warehouse_assignments wa
          where wa.profile_id = p.id
        )
      )
  ) then
    raise exception
      'bootstrap manifest rejected: an approved identity is missing role prerequisites';
  end if;

  if exists (
    select 1
    from workforce_bootstrap_manifest m
    join public.profiles p on p.id = m.profile_id
    where p.county is not null
      and not exists (
        select 1
        from public.counties c
        where pg_catalog.lower(c.name) = pg_catalog.lower(p.county)
      )
  ) then
    raise exception
      'bootstrap manifest rejected: profile county is not canonical';
  end if;

  if exists (
    select 1
    from workforce_bootstrap_manifest m
    join public.profiles p on p.id = m.profile_id
    where p.district is not null
      and not exists (
        select 1
        from public.districts d
        join public.counties c on c.id = d.county_id
        where pg_catalog.lower(d.name) = pg_catalog.lower(p.district)
          and pg_catalog.lower(c.name) = pg_catalog.lower(p.county)
      )
  ) then
    raise exception
      'bootstrap manifest rejected: profile district does not belong to profile county';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profile lifecycle. Existing active rows are not deactivated or re-roled.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column employee_or_staff_id text,
  add column job_title text,
  add column department text,
  add column clan_or_field_area text,
  add column account_status text,
  add column access_transition_status text,
  add column suspended_at timestamptz,
  add column suspension_reason text,
  add column invited_at timestamptz,
  add column activated_at timestamptz,
  add column updated_at timestamptz,
  add column provisioned_by uuid references public.profiles(id) on delete set null,
  add column authorization_version bigint;

update public.profiles p
set
  account_status = case when p.is_active then 'active' else 'inactive' end,
  access_transition_status = case
    when p.is_active and m.decision = 'verified' then 'complete'
    when p.is_active and m.decision = 'temporary_admin'
      then 'legacy_admin_review_required'
    when p.is_active then 'incomplete'
    else 'complete'
  end,
  activated_at = case
    when p.is_active then pg_catalog.coalesce(p.created_at, pg_catalog.now())
    else null
  end,
  updated_at = pg_catalog.coalesce(p.created_at, pg_catalog.now()),
  authorization_version = 1
from workforce_bootstrap_manifest m
where m.profile_id = p.id;

update public.profiles p
set
  account_status = 'inactive',
  access_transition_status = 'complete',
  updated_at = pg_catalog.coalesce(p.created_at, pg_catalog.now()),
  authorization_version = 1
where not p.is_active;

alter table public.profiles
  alter column account_status set default 'incomplete',
  alter column account_status set not null,
  alter column access_transition_status set default 'incomplete',
  alter column access_transition_status set not null,
  alter column updated_at set default pg_catalog.now(),
  alter column updated_at set not null,
  alter column authorization_version set default 1,
  alter column authorization_version set not null;

alter table public.profiles
  add constraint profiles_account_status_check
    check (
      account_status in (
        'incomplete',
        'invited',
        'active',
        'inactive',
        'suspended'
      )
    ),
  add constraint profiles_access_transition_status_check
    check (
      access_transition_status in (
        'complete',
        'legacy_admin_review_required',
        'incomplete'
      )
    ),
  add constraint profiles_lifecycle_consistency_check
    check (
      (is_active and account_status = 'active'
        and deactivated_at is null and suspended_at is null)
      or
      (not is_active and account_status <> 'active')
    ),
  add constraint profiles_suspension_consistency_check
    check (
      (account_status = 'suspended' and suspended_at is not null)
      or
      (account_status <> 'suspended' and suspended_at is null)
    ),
  add constraint profiles_authorization_version_positive_check
    check (authorization_version > 0);

create unique index profiles_employee_or_staff_id_unique
  on public.profiles (pg_catalog.lower(employee_or_staff_id))
  where employee_or_staff_id is not null;

create index profiles_authorization_lookup
  on public.profiles (
    id,
    is_active,
    account_status,
    access_transition_status,
    role
  );

-- ---------------------------------------------------------------------------
-- Supported role contract and provenance-preserving assignment history.
-- ---------------------------------------------------------------------------
create table public.workforce_role_catalog (
  role public.user_role primary key,
  enabled boolean not null default true,
  requires_organization boolean not null,
  requires_county boolean not null,
  requires_district boolean not null,
  requires_clan_or_field_area boolean not null,
  requires_warehouse_assignment boolean not null,
  may_administer_workforce boolean not null default false,
  read_only boolean not null default false,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

insert into public.workforce_role_catalog (
  role,
  requires_organization,
  requires_county,
  requires_district,
  requires_clan_or_field_area,
  requires_warehouse_assignment,
  may_administer_workforce,
  read_only
)
values
  ('super_admin', true, false, false, false, false, true, false),
  ('admin', true, false, false, false, false, true, false),
  ('ministry_admin', true, false, false, false, false, true, false),
  ('ministry_officer', true, false, false, false, false, false, false),
  ('government_officer', true, false, false, false, false, false, false),
  ('county_agriculture_coordinator', true, true, false, false, false, false, false),
  ('county_officer', true, true, false, false, false, false, false),
  ('dao_officer', true, true, true, false, false, false, false),
  ('district_officer', true, true, true, false, false, false, false),
  ('clan_technician', true, true, true, true, false, false, false),
  ('cooperative_manager', true, false, false, false, false, false, false),
  ('field_agent', true, true, false, false, false, false, false),
  ('warehouse_manager', true, true, false, false, true, false, false),
  ('donor_observer', true, false, false, false, false, false, true),
  ('donor_partner', true, false, false, false, false, false, true),
  ('exporter', true, false, false, false, false, false, false),
  ('call_center_agent', true, false, false, false, false, false, false),
  ('auditor', true, false, false, false, false, false, true);

create table public.profile_role_assignments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  is_primary boolean not null default false,
  provenance text not null
    check (
      provenance in (
        'legacy_profile_role_verified',
        'legacy_profile_role_temporary',
        'admin_assigned',
        'invitation_provisioned',
        'system_recovery'
      )
    ),
  evidence_ref text,
  assigned_by uuid references public.profiles(id) on delete set null,
  starts_at timestamptz not null default pg_catalog.now(),
  expires_at timestamptz,
  ended_at timestamptz,
  ended_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default pg_catalog.now(),
  check (expires_at is null or expires_at > starts_at),
  check (ended_at is null or ended_at >= starts_at)
);

create unique index profile_role_assignments_one_current_role
  on public.profile_role_assignments (profile_id, role)
  where ended_at is null;

create unique index profile_role_assignments_one_current_primary
  on public.profile_role_assignments (profile_id)
  where is_primary and ended_at is null;

create index profile_role_assignments_authorization_lookup
  on public.profile_role_assignments (
    profile_id,
    role,
    is_primary,
    starts_at,
    expires_at
  )
  where ended_at is null;

create index profile_role_assignments_history_lookup
  on public.profile_role_assignments (profile_id, created_at desc);

create table public.workforce_identity_transitions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  legacy_role public.user_role not null,
  decision text not null
    check (
      decision in (
        'verified',
        'temporary_admin',
        'inactive_preserved',
        'remediated'
      )
    ),
  status text not null
    check (status in ('complete', 'review_required')),
  evidence_ref text,
  reviewed_by text,
  deadline_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  unique (profile_id, decision, created_at)
);

create index workforce_identity_transitions_status_lookup
  on public.workforce_identity_transitions (profile_id, status, deadline_at);

insert into public.profile_role_assignments (
  profile_id,
  role,
  is_primary,
  provenance,
  evidence_ref,
  assigned_by,
  starts_at,
  expires_at
)
select
  m.profile_id,
  m.role,
  true,
  case
    when m.decision = 'verified' then 'legacy_profile_role_verified'
    else 'legacy_profile_role_temporary'
  end,
  m.evidence_ref,
  null,
  pg_catalog.statement_timestamp(),
  m.transition_expires_at
from workforce_bootstrap_manifest m;

insert into public.workforce_identity_transitions (
  profile_id,
  legacy_role,
  decision,
  status,
  evidence_ref,
  reviewed_by,
  deadline_at,
  completed_at
)
select
  m.profile_id,
  m.role,
  m.decision,
  case when m.decision = 'verified' then 'complete' else 'review_required' end,
  m.evidence_ref,
  m.reviewed_by,
  m.transition_expires_at,
  case
    when m.decision = 'verified' then pg_catalog.statement_timestamp()
    else null
  end
from workforce_bootstrap_manifest m;

insert into public.workforce_identity_transitions (
  profile_id,
  legacy_role,
  decision,
  status,
  evidence_ref,
  reviewed_by,
  completed_at
)
select
  p.id,
  p.role,
  'inactive_preserved',
  'complete',
  'migration:inactive-profile-preserved',
  'system',
  pg_catalog.statement_timestamp()
from public.profiles p
where not p.is_active;

-- ---------------------------------------------------------------------------
-- Canonical access predicates. Internal subject-parameter helpers are not
-- executable by application roles; public wrappers are always auth.uid-bound.
-- ---------------------------------------------------------------------------
create function public.workforce_role_prerequisites_met(
  subject_profile_id uuid,
  subject_role public.user_role
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.profiles p
    join public.workforce_role_catalog c
      on c.role = subject_role and c.enabled
    where p.id = subject_profile_id
      and (not c.requires_organization or p.organization_id is not null)
      and (
        not c.requires_county
        or pg_catalog.nullif(pg_catalog.btrim(p.county), '') is not null
      )
      and (
        not c.requires_district
        or (
          pg_catalog.nullif(pg_catalog.btrim(p.district), '') is not null
          and exists (
            select 1
            from public.districts d
            join public.counties county on county.id = d.county_id
            where pg_catalog.lower(d.name) = pg_catalog.lower(p.district)
              and pg_catalog.lower(county.name) = pg_catalog.lower(p.county)
          )
        )
      )
      and (
        not c.requires_clan_or_field_area
        or pg_catalog.nullif(pg_catalog.btrim(p.clan_or_field_area), '') is not null
      )
      and (
        not c.requires_warehouse_assignment
        or exists (
          select 1
          from public.warehouse_assignments wa
          join public.warehouses w on w.id = wa.warehouse_id
          where wa.profile_id = p.id
            and pg_catalog.lower(w.county) = pg_catalog.lower(p.county)
        )
      )
  );
$$;

create function public.workforce_subject_has_access(subject_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.profiles p
    join public.profile_role_assignments assignment
      on assignment.profile_id = p.id
      and assignment.role = p.role
      and assignment.is_primary
      and assignment.ended_at is null
      and assignment.starts_at <= pg_catalog.statement_timestamp()
      and (
        assignment.expires_at is null
        or assignment.expires_at > pg_catalog.statement_timestamp()
      )
    join public.workforce_role_catalog catalog
      on catalog.role = assignment.role
      and catalog.enabled
    where p.id = subject_profile_id
      and p.is_active
      and p.account_status = 'active'
      and p.access_transition_status = 'complete'
      and p.deactivated_at is null
      and p.suspended_at is null
      and public.workforce_role_prerequisites_met(p.id, assignment.role)
      and (
        select pg_catalog.count(*)
        from public.profile_role_assignments primary_assignment
        where primary_assignment.profile_id = p.id
          and primary_assignment.is_primary
          and primary_assignment.ended_at is null
          and primary_assignment.starts_at <= pg_catalog.statement_timestamp()
          and (
            primary_assignment.expires_at is null
            or primary_assignment.expires_at > pg_catalog.statement_timestamp()
          )
      ) = 1
  );
$$;

create function public.has_active_workforce_access()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select public.workforce_subject_has_access(auth.uid());
$$;

create function public.has_workforce_admin_access()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.profiles p
    join public.profile_role_assignments assignment
      on assignment.profile_id = p.id
      and assignment.role = p.role
      and assignment.is_primary
      and assignment.ended_at is null
      and assignment.starts_at <= pg_catalog.statement_timestamp()
      and (
        assignment.expires_at is null
        or assignment.expires_at > pg_catalog.statement_timestamp()
      )
    join public.workforce_role_catalog catalog
      on catalog.role = assignment.role
      and catalog.enabled
      and catalog.may_administer_workforce
    where p.id = auth.uid()
      and p.is_active
      and p.account_status = 'active'
      and p.deactivated_at is null
      and p.suspended_at is null
      and (
        public.workforce_subject_has_access(p.id)
        or (
          p.access_transition_status = 'legacy_admin_review_required'
          and assignment.provenance = 'legacy_profile_role_temporary'
          and assignment.expires_at > pg_catalog.statement_timestamp()
        )
      )
  );
$$;

create or replace function public.profile_role()
returns public.user_role
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and public.workforce_subject_has_access(p.id);
$$;

create or replace function public.profile_county()
returns text
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select p.county
  from public.profiles p
  where p.id = auth.uid()
    and public.workforce_subject_has_access(p.id);
$$;

create or replace function public.profile_district()
returns text
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select p.district
  from public.profiles p
  where p.id = auth.uid()
    and public.workforce_subject_has_access(p.id);
$$;

create or replace function public.is_ministry_wide()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select public.workforce_subject_has_access(auth.uid())
    and public.profile_role() in (
      'super_admin',
      'admin',
      'ministry_admin',
      'ministry_officer',
      'government_officer'
    );
$$;

create or replace function public.wf_is_ministry()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select public.is_ministry_wide();
$$;

create or replace function public.wf_is_reviewer()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select public.profile_role() in (
    'super_admin',
    'admin',
    'ministry_admin',
    'ministry_officer',
    'government_officer',
    'county_agriculture_coordinator',
    'county_officer',
    'dao_officer',
    'district_officer'
  );
$$;

create or replace function public.wf_can_create()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select public.profile_role() in (
    'super_admin',
    'admin',
    'ministry_admin',
    'ministry_officer',
    'government_officer',
    'county_agriculture_coordinator',
    'county_officer',
    'dao_officer',
    'district_officer',
    'clan_technician',
    'field_agent'
  );
$$;

create or replace function public.wf_county_in_scope(target_county text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select
    public.is_ministry_wide()
    or public.profile_role() in ('super_admin', 'auditor', 'donor_observer', 'donor_partner')
    or (
      target_county is not null
      and pg_catalog.lower(target_county) =
        pg_catalog.lower(pg_catalog.coalesce(public.profile_county(), ''))
    );
$$;

-- Explicit ACL reset. Subject-parameter helpers stay private to the owner.
revoke all on function public.workforce_role_prerequisites_met(uuid, public.user_role)
  from public, anon, authenticated, service_role;
revoke all on function public.workforce_subject_has_access(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.has_active_workforce_access()
  from public, anon, authenticated, service_role;
revoke all on function public.has_workforce_admin_access()
  from public, anon, authenticated, service_role;
revoke all on function public.profile_role()
  from public, anon, authenticated, service_role;
revoke all on function public.profile_county()
  from public, anon, authenticated, service_role;
revoke all on function public.profile_district()
  from public, anon, authenticated, service_role;
revoke all on function public.is_ministry_wide()
  from public, anon, authenticated, service_role;
revoke all on function public.wf_is_ministry()
  from public, anon, authenticated, service_role;
revoke all on function public.wf_is_reviewer()
  from public, anon, authenticated, service_role;
revoke all on function public.wf_can_create()
  from public, anon, authenticated, service_role;
revoke all on function public.wf_county_in_scope(text)
  from public, anon, authenticated, service_role;

grant execute on function public.has_active_workforce_access()
  to authenticated, service_role;
grant execute on function public.has_workforce_admin_access()
  to authenticated, service_role;
grant execute on function public.profile_role()
  to authenticated, service_role;
grant execute on function public.profile_county()
  to authenticated, service_role;
grant execute on function public.profile_district()
  to authenticated, service_role;
grant execute on function public.is_ministry_wide()
  to authenticated, service_role;
grant execute on function public.wf_is_ministry()
  to authenticated, service_role;
grant execute on function public.wf_is_reviewer()
  to authenticated, service_role;
grant execute on function public.wf_can_create()
  to authenticated, service_role;
grant execute on function public.wf_county_in_scope(text)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Profile-write hardening and fail-closed Auth signup.
-- ---------------------------------------------------------------------------
create function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create function public.guard_profile_protected_fields()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if current_user in ('anon', 'authenticated')
     and (
       new.role is distinct from old.role
       or new.organization_id is distinct from old.organization_id
       or new.county is distinct from old.county
       or new.district is distinct from old.district
       or new.clan_or_field_area is distinct from old.clan_or_field_area
       or new.employee_or_staff_id is distinct from old.employee_or_staff_id
       or new.job_title is distinct from old.job_title
       or new.department is distinct from old.department
       or new.is_active is distinct from old.is_active
       or new.account_status is distinct from old.account_status
       or new.access_transition_status is distinct from old.access_transition_status
       or new.suspended_at is distinct from old.suspended_at
       or new.suspension_reason is distinct from old.suspension_reason
       or new.deactivated_at is distinct from old.deactivated_at
       or new.provisioned_by is distinct from old.provisioned_by
       or new.authorization_version is distinct from old.authorization_version
     )
  then
    raise exception 'protected workforce profile fields require an approved administrator function';
  end if;
  return new;
end;
$$;

create function public.guard_last_viable_super_admin()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if old.role = 'super_admin'
     and old.is_active
     and (
       new.role <> 'super_admin'
       or not new.is_active
       or new.account_status <> 'active'
     )
     and not exists (
       select 1
       from public.profiles other_admin
       where other_admin.id <> old.id
         and other_admin.role = 'super_admin'
         and public.workforce_subject_has_access(other_admin.id)
     )
  then
    raise exception 'cannot deactivate or demote the last viable super administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_profile_updated_at();

create trigger profiles_guard_protected_fields
before update on public.profiles
for each row execute function public.guard_profile_protected_fields();

create trigger profiles_guard_last_viable_super_admin
before update on public.profiles
for each row execute function public.guard_last_viable_super_admin();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    is_active,
    account_status,
    access_transition_status,
    authorization_version
  )
  values (
    new.id,
    pg_catalog.lower(new.email),
    pg_catalog.coalesce(
      pg_catalog.nullif(
        pg_catalog.btrim(new.raw_user_meta_data->>'full_name'),
        ''
      ),
      pg_catalog.split_part(pg_catalog.coalesce(new.email, ''), '@', 1),
      'User'
    ),
    'field_agent'::public.user_role,
    false,
    'incomplete',
    'incomplete',
    1
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = pg_catalog.coalesce(
      pg_catalog.nullif(public.profiles.full_name, ''),
      excluded.full_name
    );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Safe active-role selection. It changes no authorization grant; it can only
-- select a current, unexpired, prerequisite-complete explicit assignment.
-- ---------------------------------------------------------------------------
create function public.select_active_workforce_role(
  selected_role public.user_role,
  audit_request_id text default null
)
returns public.user_role
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  caller_version bigint;
begin
  if selected_role is null then
    raise exception 'selected role is required';
  end if;

  select p.authorization_version
  into caller_version
  from public.profiles p
  where p.id = auth.uid()
    and public.workforce_subject_has_access(p.id)
  for update;

  if not found then
    raise exception 'active workforce profile required';
  end if;

  if not exists (
    select 1
    from public.profile_role_assignments assignment
    join public.workforce_role_catalog catalog
      on catalog.role = assignment.role and catalog.enabled
    where assignment.profile_id = auth.uid()
      and assignment.role = selected_role
      and assignment.ended_at is null
      and assignment.starts_at <= pg_catalog.statement_timestamp()
      and (
        assignment.expires_at is null
        or assignment.expires_at > pg_catalog.statement_timestamp()
      )
      and public.workforce_role_prerequisites_met(
        assignment.profile_id,
        assignment.role
      )
  ) then
    raise exception 'current explicit role assignment required';
  end if;

  update public.profile_role_assignments
  set is_primary = false
  where profile_id = auth.uid()
    and ended_at is null
    and is_primary;

  update public.profile_role_assignments
  set is_primary = true
  where profile_id = auth.uid()
    and role = selected_role
    and ended_at is null;

  update public.profiles
  set
    role = selected_role,
    authorization_version = caller_version + 1
  where id = auth.uid();

  insert into public.audit_log (
    user_id,
    action,
    table_name,
    record_id,
    new_values
  )
  values (
    auth.uid(),
    'ACTIVE_ROLE_SELECTED',
    'profiles',
    auth.uid(),
    pg_catalog.jsonb_build_object(
      'role',
      selected_role,
      'request_id',
      audit_request_id,
      'authorization_version',
      caller_version + 1
    )
  );

  return selected_role;
end;
$$;

-- ---------------------------------------------------------------------------
-- Service-role-only role replacement. The actor remains an audited input
-- because service_role has no end-user auth.uid(); the function independently
-- verifies that actor's current canonical administrator access.
-- ---------------------------------------------------------------------------
create function public.replace_workforce_role_assignments(
  target_profile_id uuid,
  assigned_roles public.user_role[],
  selected_primary_role public.user_role,
  actor_profile_id uuid,
  audit_request_id text default null,
  expected_authorization_version bigint default null,
  assigned_warehouse_ids uuid[] default null
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  actor_role public.user_role;
  target_role public.user_role;
  target_version bigint;
  normalized_roles public.user_role[];
  role_value public.user_role;
  warehouse_id uuid;
begin
  if target_profile_id is null or actor_profile_id is null then
    raise exception 'actor and target profile identifiers are required';
  end if;

  if target_profile_id = actor_profile_id then
    raise exception 'self role changes are not permitted';
  end if;

  select p.role
  into actor_role
  from public.profiles p
  join public.workforce_role_catalog catalog
    on catalog.role = p.role and catalog.may_administer_workforce and catalog.enabled
  where p.id = actor_profile_id
    and public.workforce_subject_has_access(p.id)
  for update;

  if not found or actor_role is null then
    raise exception 'active workforce administrator required';
  end if;

  select p.role, p.authorization_version
  into target_role, target_version
  from public.profiles p
  where p.id = target_profile_id
  for update;

  if not found then
    raise exception 'target workforce profile not found';
  end if;

  if expected_authorization_version is not null
     and expected_authorization_version <> target_version
  then
    raise exception 'stale authorization version';
  end if;

  if assigned_roles is null
     or pg_catalog.cardinality(assigned_roles) = 0
     or selected_primary_role is null
     or pg_catalog.array_position(assigned_roles, null) is not null
  then
    raise exception 'a non-empty, null-free role set and primary role are required';
  end if;

  select pg_catalog.array_agg(distinct candidate order by candidate::text)
  into normalized_roles
  from pg_catalog.unnest(assigned_roles) candidate;

  if pg_catalog.cardinality(normalized_roles) <>
     pg_catalog.cardinality(assigned_roles)
  then
    raise exception 'duplicate role assignments are not permitted';
  end if;

  if not selected_primary_role = any(normalized_roles) then
    raise exception 'primary role must be in assigned role set';
  end if;

  if exists (
    select 1
    from pg_catalog.unnest(normalized_roles) requested_role
    left join public.workforce_role_catalog catalog
      on catalog.role = requested_role and catalog.enabled
    where catalog.role is null
  ) then
    raise exception 'unsupported or disabled role assignment';
  end if;

  if (
    'super_admin'::public.user_role = any(normalized_roles)
    or 'admin'::public.user_role = any(normalized_roles)
  ) and actor_role <> 'super_admin'
  then
    raise exception 'system administrator assignment requires super administrator';
  end if;

  if 'ministry_admin'::public.user_role = any(normalized_roles)
     and actor_role not in ('super_admin', 'admin')
  then
    raise exception 'ministry administrator assignment requires system administrator';
  end if;

  if target_role = 'super_admin'
     and not ('super_admin'::public.user_role = any(normalized_roles))
     and not exists (
       select 1
       from public.profiles other_admin
       where other_admin.id <> target_profile_id
         and other_admin.role = 'super_admin'
         and public.workforce_subject_has_access(other_admin.id)
     )
  then
    raise exception 'cannot remove the last viable super administrator';
  end if;

  if assigned_warehouse_ids is not null then
    if pg_catalog.array_position(assigned_warehouse_ids, null) is not null
       or (
         select pg_catalog.count(distinct requested_warehouse)
         from pg_catalog.unnest(assigned_warehouse_ids) requested_warehouse
       ) <> pg_catalog.cardinality(assigned_warehouse_ids)
    then
      raise exception 'warehouse assignment set must be null-free and unique';
    end if;

    if exists (
      select 1
      from pg_catalog.unnest(assigned_warehouse_ids) requested_warehouse
      left join public.warehouses w on w.id = requested_warehouse
      where w.id is null
    ) then
      raise exception 'unknown warehouse assignment';
    end if;

    delete from public.warehouse_assignments
    where profile_id = target_profile_id;

    insert into public.warehouse_assignments (profile_id, warehouse_id)
    select target_profile_id, requested_warehouse
    from pg_catalog.unnest(assigned_warehouse_ids) requested_warehouse;
  end if;

  for role_value in
    select requested_role
    from pg_catalog.unnest(normalized_roles) requested_role
  loop
    if not public.workforce_role_prerequisites_met(
      target_profile_id,
      role_value
    ) then
      raise exception 'target profile is missing prerequisites for role %', role_value;
    end if;
  end loop;

  update public.profile_role_assignments
  set
    is_primary = false,
    ended_at = pg_catalog.statement_timestamp(),
    ended_by = actor_profile_id
  where profile_id = target_profile_id
    and ended_at is null;

  insert into public.profile_role_assignments (
    profile_id,
    role,
    is_primary,
    provenance,
    assigned_by,
    starts_at
  )
  select
    target_profile_id,
    requested_role,
    requested_role = selected_primary_role,
    case
      when (select account_status from public.profiles where id = target_profile_id) = 'invited'
        then 'invitation_provisioned'
      else 'admin_assigned'
    end,
    actor_profile_id,
    pg_catalog.statement_timestamp()
  from pg_catalog.unnest(normalized_roles) requested_role;

  update public.profiles
  set
    role = selected_primary_role,
    access_transition_status = case
      when access_transition_status = 'legacy_admin_review_required' then 'complete'
      when account_status = 'invited' then 'complete'
      else access_transition_status
    end,
    authorization_version = target_version + 1
  where id = target_profile_id;

  insert into public.audit_log (
    user_id,
    action,
    table_name,
    record_id,
    new_values
  )
  values (
    actor_profile_id,
    'ROLE_ASSIGNMENTS_REPLACED',
    'profiles',
    target_profile_id,
    pg_catalog.jsonb_build_object(
      'roles',
      pg_catalog.to_jsonb(normalized_roles),
      'primary_role',
      selected_primary_role,
      'request_id',
      audit_request_id,
      'authorization_version',
      target_version + 1
    )
  );

  if exists (
    select 1
    from public.workforce_identity_transitions transition
    where transition.profile_id = target_profile_id
      and transition.status = 'review_required'
  ) then
    update public.workforce_identity_transitions
    set
      status = 'complete',
      completed_at = pg_catalog.statement_timestamp()
    where profile_id = target_profile_id
      and status = 'review_required';

    insert into public.workforce_identity_transitions (
      profile_id,
      legacy_role,
      decision,
      status,
      evidence_ref,
      reviewed_by,
      completed_at
    )
    values (
      target_profile_id,
      selected_primary_role,
      'remediated',
      'complete',
      pg_catalog.coalesce(audit_request_id, 'administrator-remediation'),
      actor_profile_id::text,
      pg_catalog.statement_timestamp()
    );
  end if;

  return target_version + 1;
end;
$$;

revoke all on function public.set_profile_updated_at()
  from public, anon, authenticated, service_role;
revoke all on function public.guard_profile_protected_fields()
  from public, anon, authenticated, service_role;
revoke all on function public.guard_last_viable_super_admin()
  from public, anon, authenticated, service_role;
revoke all on function public.handle_new_user()
  from public, anon, authenticated, service_role;
revoke all on function public.select_active_workforce_role(public.user_role, text)
  from public, anon, authenticated, service_role;
revoke all on function public.replace_workforce_role_assignments(
  uuid,
  public.user_role[],
  public.user_role,
  uuid,
  text,
  bigint,
  uuid[]
) from public, anon, authenticated, service_role;

grant execute on function public.select_active_workforce_role(public.user_role, text)
  to authenticated, service_role;
grant execute on function public.replace_workforce_role_assignments(
  uuid,
  public.user_role[],
  public.user_role,
  uuid,
  text,
  bigint,
  uuid[]
) to service_role;

-- ---------------------------------------------------------------------------
-- Identity-table RLS and explicit privileges.
-- ---------------------------------------------------------------------------
alter table public.workforce_role_catalog enable row level security;
alter table public.profile_role_assignments enable row level security;
alter table public.workforce_identity_transitions enable row level security;

create policy workforce_role_catalog_read
on public.workforce_role_catalog
for select to authenticated
using (public.has_active_workforce_access());

create policy profile_role_assignments_read
on public.profile_role_assignments
for select to authenticated
using (
  (
    profile_id = auth.uid()
    and ended_at is null
    and public.has_active_workforce_access()
  )
  or public.has_workforce_admin_access()
  or (
    public.has_active_workforce_access()
    and public.profile_role() = 'auditor'
  )
);

create policy workforce_identity_transitions_read
on public.workforce_identity_transitions
for select to authenticated
using (
  (profile_id = auth.uid() and public.has_active_workforce_access())
  or public.has_workforce_admin_access()
  or (
    public.has_active_workforce_access()
    and public.profile_role() = 'auditor'
  )
);

revoke all on table public.workforce_role_catalog
  from public, anon, authenticated, service_role;
revoke all on table public.profile_role_assignments
  from public, anon, authenticated, service_role;
revoke all on table public.workforce_identity_transitions
  from public, anon, authenticated, service_role;

grant select on table public.workforce_role_catalog to authenticated;
grant select on table public.profile_role_assignments to authenticated;
grant select on table public.workforce_identity_transitions to authenticated;
grant all on table public.workforce_role_catalog to service_role;
grant all on table public.profile_role_assignments to service_role;
grant all on table public.workforce_identity_transitions to service_role;

-- Profiles are readable through existing RLS, but no ordinary authenticated
-- caller may insert, update, or delete profile authority fields.
revoke insert, update, delete on table public.profiles from authenticated, anon;
grant select on table public.profiles to authenticated;

drop policy if exists profiles_self_update on public.profiles;
drop policy if exists profiles_ministry_update on public.profiles;

-- ---------------------------------------------------------------------------
-- Replace the remaining operational authenticated USING (true) policies.
-- ---------------------------------------------------------------------------
drop policy if exists pilot_dao_select on public.pilot_dao_officers;
create policy pilot_dao_select
on public.pilot_dao_officers
for select to authenticated
using (
  public.is_ministry_wide()
  or (
    public.profile_role() in (
      'county_agriculture_coordinator',
      'county_officer',
      'dao_officer',
      'district_officer',
      'auditor'
    )
    and pg_catalog.lower(county) =
      pg_catalog.lower(pg_catalog.coalesce(public.profile_county(), ''))
    and (
      public.profile_role() not in ('dao_officer', 'district_officer')
      or district is null
      or pg_catalog.lower(district) =
        pg_catalog.lower(pg_catalog.coalesce(public.profile_district(), ''))
    )
  )
);

drop policy if exists pilot_events_select on public.pilot_operational_events;
create policy pilot_events_select
on public.pilot_operational_events
for select to authenticated
using (
  public.is_ministry_wide()
  or public.profile_role() in ('auditor', 'donor_observer', 'donor_partner')
  or (
    county is not null
    and pg_catalog.lower(county) =
      pg_catalog.lower(pg_catalog.coalesce(public.profile_county(), ''))
    and (
      public.profile_role() not in ('dao_officer', 'district_officer')
      or district is null
      or pg_catalog.lower(district) =
        pg_catalog.lower(pg_catalog.coalesce(public.profile_district(), ''))
    )
  )
);

drop policy if exists pilot_county_metrics_select on public.pilot_county_metrics;
create policy pilot_county_metrics_select
on public.pilot_county_metrics
for select to authenticated
using (
  public.is_ministry_wide()
  or public.profile_role() in ('auditor', 'donor_observer', 'donor_partner')
  or pg_catalog.lower(county) =
    pg_catalog.lower(pg_catalog.coalesce(public.profile_county(), ''))
);

-- A restrictive guard is ANDed with every existing permissive operational
-- policy. This closes direct self/actor predicates for inactive, suspended,
-- missing-profile, assignment-less, expired, or transition-incomplete users.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'counties',
    'districts',
    'organizations',
    'warehouses',
    'warehouse_assignments',
    'warehouse_stock',
    'inventory_items',
    'inventory_movements',
    'input_allocations',
    'distribution_logs',
    'supplier_records',
    'donor_shipments',
    'expiry_tracking',
    'field_reports',
    'food_security_indicators',
    'locations',
    'farmers',
    'farmer_visits',
    'farmer_subsidies',
    'geo_locations',
    'plots',
    'lots',
    'movements',
    'rice_production_records',
    'compliance_records',
    'audit_log',
    'reports',
    'pilot_dao_officers',
    'pilot_operational_events',
    'pilot_county_metrics',
    'warehouse_transfer_orders',
    'operational_submissions',
    'workflow_actions',
    'workflow_comments',
    'workflow_assignments',
    'workflow_notifications',
    'analytics_events',
    'notifications',
    'notification_reads',
    'demo_inquiries',
    'app_settings',
    'location_inventory_opening',
    'discrepancy_issues'
  ]
  loop
    if pg_catalog.to_regclass(pg_catalog.format('public.%I', table_name)) is not null then
      execute pg_catalog.format(
        'drop policy if exists workforce_identity_required on public.%I',
        table_name
      );
      execute pg_catalog.format(
        'create policy workforce_identity_required on public.%I as restrictive for all to authenticated using (public.has_active_workforce_access()) with check (public.has_active_workforce_access())',
        table_name
      );
    end if;
  end loop;
end;
$$;

-- Rollback is forward-only and data-aware:
-- 1. Do not drop assignment or transition history. Disable new app writes first.
-- 2. A compatibility rollback may replace policy/function bodies, but must keep
--    fail-closed signup and the restrictive lifecycle guard.
-- 3. Dropping profile columns requires an exported authorization ledger and a
--    verified application rollback; it is intentionally not automated here.
-- 4. If execution fails before COMMIT, the migration transaction rolls back.
--    A detected partial/manual application requires catalog reconciliation,
--    never a blind rerun.

commit;
