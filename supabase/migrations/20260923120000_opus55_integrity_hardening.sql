-- Opus 5.5 audit remediation: workflow integrity, farmer-registry scope,
-- audit attribution, and donor PII containment.
--
-- DEPENDS ON: 20260729220000 and 20260729230000 (workforce identity).
-- DO NOT apply to a shared/production project without database-owner approval
-- and a passing run of `npm run test:rls:behavior` against a disposable database.
--
-- Findings closed (docs/audits/CLAUDE_OPUS_55_DATA_RLS_AUDIT.md):
--   OPS-DB-03  authors could UPDATE operational_submissions.status directly
--              (self-approval to ministry_approved) and forge workflow_actions.
--   OPS-DB-04  workflow state change + ledger were non-atomic (compensating
--              writes from the API route).
--   OPS-DB-05  farmer_visits_all allowed nationwide read/update/DELETE.
--   OPS-DB-06  audit_log accepted rows attributed to any user_id.
--   OPS-DB-07  canonical pilot roles (clan_technician, dao_officer,
--              county_agriculture_coordinator) were missing from farmer,
--              plot and production policies; legacy roles had no geography
--              check on writes and could self-verify / flag subsidy eligibility.
--   OPS-DB-08  donor roles could read every submission, including farmer PII
--              in metadata.payload_snapshot.
--   OPS-DB-09  ministry officers could rewrite warehouse_assignments (a role
--              prerequisite) outside the audited administrator path.
--   OPS-DB-10  submission county/district/organization were client-controlled.

begin;

-- ---------------------------------------------------------------------------
-- 1. Caller scope, computed once per statement via (select public.my_workforce_scope()).
-- ---------------------------------------------------------------------------
create type public.workforce_scope as (
  profile_id uuid,
  role public.user_role,
  county text,
  district text,
  organization_id uuid
);

create function public.my_workforce_scope()
returns public.workforce_scope
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select row(p.id, p.role, p.county, p.district, p.organization_id)::public.workforce_scope
  from public.profiles p
  where p.id = auth.uid()
    and public.workforce_subject_has_access(p.id);
$$;

-- Pure predicates (no table access): inlinable, cheap per row.
create function public.scope_is_national(s public.workforce_scope)
returns boolean
language sql
immutable
as $$
  select s.profile_id is not null
    and s.role in ('super_admin', 'admin', 'ministry_admin', 'ministry_officer', 'government_officer');
$$;

create function public.scope_same_text(a text, b text)
returns boolean
language sql
immutable
as $$
  select a is not null and b is not null and lower(btrim(a)) = lower(btrim(b));
$$;

create function public.farmer_read_scope(
  s public.workforce_scope,
  f_county text,
  f_district text,
  f_organization_id uuid,
  f_registered_by uuid
)
returns boolean
language sql
immutable
as $$
  select s.profile_id is not null and (
    public.scope_is_national(s)
    or s.role = 'auditor'
    or (f_registered_by is not null and f_registered_by = s.profile_id)
    or (
      s.role in ('county_agriculture_coordinator', 'county_officer', 'field_agent', 'call_center_agent')
      and public.scope_same_text(f_county, s.county)
    )
    or (
      s.role in ('dao_officer', 'district_officer', 'clan_technician')
      and public.scope_same_text(f_county, s.county)
      and public.scope_same_text(f_district, s.district)
    )
    or (
      s.role in ('cooperative_manager', 'exporter')
      and s.organization_id is not null
      and f_organization_id = s.organization_id
    )
  );
$$;

create function public.farmer_register_scope(
  s public.workforce_scope,
  f_county text,
  f_district text,
  f_organization_id uuid
)
returns boolean
language sql
immutable
as $$
  select s.profile_id is not null and (
    public.scope_is_national(s)
    or (
      s.role in ('county_agriculture_coordinator', 'county_officer', 'field_agent', 'call_center_agent')
      and public.scope_same_text(f_county, s.county)
    )
    or (
      s.role in ('dao_officer', 'district_officer', 'clan_technician')
      and public.scope_same_text(f_county, s.county)
      and public.scope_same_text(f_district, s.district)
    )
    or (
      s.role = 'cooperative_manager'
      and s.organization_id is not null
      and f_organization_id = s.organization_id
    )
  );
$$;

-- Verification / subsidy eligibility is a reviewer decision (DAO, CAC, national).
create function public.farmer_review_scope(
  s public.workforce_scope,
  f_county text,
  f_district text
)
returns boolean
language sql
immutable
as $$
  select s.profile_id is not null and (
    public.scope_is_national(s)
    or (
      s.role in ('county_agriculture_coordinator', 'county_officer')
      and public.scope_same_text(f_county, s.county)
    )
    or (
      s.role in ('dao_officer', 'district_officer')
      and public.scope_same_text(f_county, s.county)
      and public.scope_same_text(f_district, s.district)
    )
  );
$$;

revoke all on function public.my_workforce_scope() from public, anon, authenticated, service_role;
grant execute on function public.my_workforce_scope() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Farmer registry (OPS-DB-07).
-- ---------------------------------------------------------------------------
drop policy if exists farmers_access on public.farmers;
drop policy if exists farmers_write on public.farmers;
drop policy if exists farmers_update on public.farmers;

create policy farmers_select on public.farmers
for select to authenticated
using (
  public.farmer_read_scope(
    (select public.my_workforce_scope()), county, district, organization_id, registered_by
  )
);

create policy farmers_insert on public.farmers
for insert to authenticated
with check (
  registered_by = (select auth.uid())
  and public.farmer_register_scope(
    (select public.my_workforce_scope()), county, district, organization_id
  )
);

create policy farmers_update on public.farmers
for update to authenticated
using (
  public.farmer_register_scope((select public.my_workforce_scope()), county, district, organization_id)
  or public.farmer_review_scope((select public.my_workforce_scope()), county, district)
)
with check (
  public.farmer_register_scope((select public.my_workforce_scope()), county, district, organization_id)
  or public.farmer_review_scope((select public.my_workforce_scope()), county, district)
);

create function public.guard_farmer_review_fields()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
declare
  s public.workforce_scope;
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  s := public.my_workforce_scope();

  if tg_op = 'INSERT' then
    if (new.verification_status <> 'pending' or new.subsidy_eligible)
       and not public.farmer_review_scope(s, new.county, new.district) then
      raise exception using
        errcode = '42501',
        message = 'farmer verification and subsidy eligibility require an in-scope reviewer';
    end if;
    return new;
  end if;

  if (new.verification_status is distinct from old.verification_status
      or new.subsidy_eligible is distinct from old.subsidy_eligible)
     and not public.farmer_review_scope(s, new.county, new.district) then
    raise exception using
      errcode = '42501',
      message = 'farmer verification and subsidy eligibility require an in-scope reviewer';
  end if;

  if new.id is distinct from old.id
     or new.registered_by is distinct from old.registered_by
     or new.client_id is distinct from old.client_id
     or new.created_at is distinct from old.created_at
     or new.registration_date is distinct from old.registration_date then
    raise exception using errcode = '42501', message = 'farmer provenance fields are immutable';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_farmer_review_fields() from public, anon, authenticated, service_role;

create trigger farmers_guard_review_fields
before insert or update on public.farmers
for each row execute function public.guard_farmer_review_fields();

-- Plots follow their farmer.
drop policy if exists plots_access on public.plots;
drop policy if exists plots_write on public.plots;
drop policy if exists plots_update on public.plots;

create policy plots_select on public.plots
for select to authenticated
using (
  exists (
    select 1 from public.farmers f
    where f.id = plots.farmer_id
      and public.farmer_read_scope(
        (select public.my_workforce_scope()), f.county, f.district, f.organization_id, f.registered_by
      )
  )
);

create policy plots_insert on public.plots
for insert to authenticated
with check (
  (registered_by is null or registered_by = (select auth.uid()))
  and exists (
    select 1 from public.farmers f
    where f.id = plots.farmer_id
      and (
        public.farmer_register_scope((select public.my_workforce_scope()), f.county, f.district, f.organization_id)
        or public.farmer_review_scope((select public.my_workforce_scope()), f.county, f.district)
      )
  )
);

create policy plots_update on public.plots
for update to authenticated
using (
  exists (
    select 1 from public.farmers f
    where f.id = plots.farmer_id
      and (
        public.farmer_register_scope((select public.my_workforce_scope()), f.county, f.district, f.organization_id)
        or public.farmer_review_scope((select public.my_workforce_scope()), f.county, f.district)
      )
  )
)
with check (
  exists (
    select 1 from public.farmers f
    where f.id = plots.farmer_id
      and (
        public.farmer_register_scope((select public.my_workforce_scope()), f.county, f.district, f.organization_id)
        or public.farmer_review_scope((select public.my_workforce_scope()), f.county, f.district)
      )
  )
);

-- Farmer visits: no nationwide access, no deletes (OPS-DB-05).
drop policy if exists farmer_visits_all on public.farmer_visits;

create policy farmer_visits_select on public.farmer_visits
for select to authenticated
using (
  visited_by = (select auth.uid())
  or exists (
    select 1 from public.farmers f
    where f.id = farmer_visits.farmer_id
      and public.farmer_read_scope(
        (select public.my_workforce_scope()), f.county, f.district, f.organization_id, f.registered_by
      )
  )
);

create policy farmer_visits_insert on public.farmer_visits
for insert to authenticated
with check (
  visited_by = (select auth.uid())
  and exists (
    select 1 from public.farmers f
    where f.id = farmer_visits.farmer_id
      and (
        public.farmer_register_scope((select public.my_workforce_scope()), f.county, f.district, f.organization_id)
        or public.farmer_review_scope((select public.my_workforce_scope()), f.county, f.district)
      )
  )
);

create policy farmer_visits_update on public.farmer_visits
for update to authenticated
using (
  visited_by = (select auth.uid())
  or exists (
    select 1 from public.farmers f
    where f.id = farmer_visits.farmer_id
      and public.farmer_review_scope((select public.my_workforce_scope()), f.county, f.district)
  )
)
with check (
  exists (
    select 1 from public.farmers f
    where f.id = farmer_visits.farmer_id
      and (
        public.farmer_register_scope((select public.my_workforce_scope()), f.county, f.district, f.organization_id)
        or public.farmer_review_scope((select public.my_workforce_scope()), f.county, f.district)
      )
  )
);

revoke delete on public.farmer_visits from anon, authenticated;

-- Production records follow their farmer; attribution is enforced.
drop policy if exists rice_read_gov on public.rice_production_records;
drop policy if exists rice_write_agents on public.rice_production_records;
drop policy if exists rice_update_agents on public.rice_production_records;

create policy rice_select on public.rice_production_records
for select to authenticated
using (
  recorded_by = (select auth.uid())
  or exists (
    select 1 from public.farmers f
    where f.id = rice_production_records.farmer_id
      and public.farmer_read_scope(
        (select public.my_workforce_scope()), f.county, f.district, f.organization_id, f.registered_by
      )
  )
);

create policy rice_insert on public.rice_production_records
for insert to authenticated
with check (
  (recorded_by is null or recorded_by = (select auth.uid()))
  and exists (
    select 1 from public.farmers f
    where f.id = rice_production_records.farmer_id
      and (
        public.farmer_register_scope((select public.my_workforce_scope()), f.county, f.district, f.organization_id)
        or public.farmer_review_scope((select public.my_workforce_scope()), f.county, f.district)
      )
  )
);

create policy rice_update on public.rice_production_records
for update to authenticated
using (
  exists (
    select 1 from public.farmers f
    where f.id = rice_production_records.farmer_id
      and (
        public.farmer_register_scope((select public.my_workforce_scope()), f.county, f.district, f.organization_id)
        or public.farmer_review_scope((select public.my_workforce_scope()), f.county, f.district)
      )
  )
)
with check (
  exists (
    select 1 from public.farmers f
    where f.id = rice_production_records.farmer_id
      and (
        public.farmer_register_scope((select public.my_workforce_scope()), f.county, f.district, f.organization_id)
        or public.farmer_review_scope((select public.my_workforce_scope()), f.county, f.district)
      )
  )
);

-- ---------------------------------------------------------------------------
-- 3. Audit attribution (OPS-DB-06). Rows stay append-only (no UPDATE/DELETE policy).
-- ---------------------------------------------------------------------------
drop policy if exists audit_insert on public.audit_log;
create policy audit_insert on public.audit_log
for insert to authenticated
with check (user_id = (select auth.uid()));

revoke update, delete on public.audit_log from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Warehouse assignments are a role prerequisite: administrator path only (OPS-DB-09).
-- ---------------------------------------------------------------------------
drop policy if exists warehouse_assignments_write on public.warehouse_assignments;
create policy warehouse_assignments_write on public.warehouse_assignments
for all to authenticated
using ((select public.has_workforce_admin_access()))
with check ((select public.has_workforce_admin_access()));

-- ---------------------------------------------------------------------------
-- 5. Workflow engine: atomic, database-enforced transitions (OPS-DB-03/04/10).
-- ---------------------------------------------------------------------------
create table public.workflow_transition_rules (
  from_status public.workflow_status not null,
  action text not null,
  stage text not null check (stage in ('clan', 'dao', 'cac', 'ministry')),
  to_status public.workflow_status not null,
  primary key (from_status, action, stage)
);

-- Mirrors TRANSITIONS in src/lib/workflow/status-model.ts. Parity is enforced by
-- scripts/verify-workflow-transition-parity.mjs.
insert into public.workflow_transition_rules (from_status, action, stage, to_status) values
  ('draft', 'submit', 'clan', 'submitted'),
  ('draft', 'submit', 'dao', 'submitted'),
  ('draft', 'submit', 'cac', 'submitted'),
  ('draft', 'submit', 'ministry', 'submitted'),
  ('dao_corrections_requested', 'submit', 'clan', 'submitted'),
  ('dao_corrections_requested', 'submit', 'dao', 'submitted'),
  ('dao_corrections_requested', 'submit', 'cac', 'submitted'),
  ('dao_corrections_requested', 'submit', 'ministry', 'submitted'),
  ('cac_corrections_requested', 'submit', 'clan', 'submitted'),
  ('cac_corrections_requested', 'submit', 'dao', 'submitted'),
  ('cac_corrections_requested', 'submit', 'cac', 'submitted'),
  ('cac_corrections_requested', 'submit', 'ministry', 'submitted'),
  ('submitted', 'assign_reviewer', 'dao', 'dao_review'),
  ('submitted', 'assign_reviewer', 'ministry', 'dao_review'),
  ('dao_review', 'assign_reviewer', 'dao', 'dao_review'),
  ('dao_review', 'assign_reviewer', 'ministry', 'dao_review'),
  ('submitted', 'approve', 'dao', 'dao_approved'),
  ('submitted', 'approve', 'ministry', 'dao_approved'),
  ('dao_review', 'approve', 'dao', 'dao_approved'),
  ('dao_review', 'approve', 'ministry', 'dao_approved'),
  ('submitted', 'request_corrections', 'dao', 'dao_corrections_requested'),
  ('submitted', 'request_corrections', 'ministry', 'dao_corrections_requested'),
  ('dao_review', 'request_corrections', 'dao', 'dao_corrections_requested'),
  ('dao_review', 'request_corrections', 'ministry', 'dao_corrections_requested'),
  ('submitted', 'reject', 'dao', 'rejected'),
  ('submitted', 'reject', 'ministry', 'rejected'),
  ('dao_review', 'reject', 'dao', 'rejected'),
  ('dao_review', 'reject', 'ministry', 'rejected'),
  ('submitted', 'escalate', 'dao', 'escalated'),
  ('submitted', 'escalate', 'cac', 'escalated'),
  ('submitted', 'escalate', 'ministry', 'escalated'),
  ('dao_review', 'escalate', 'dao', 'escalated'),
  ('dao_review', 'escalate', 'cac', 'escalated'),
  ('dao_review', 'escalate', 'ministry', 'escalated'),
  ('dao_approved', 'assign_reviewer', 'cac', 'cac_review'),
  ('dao_approved', 'assign_reviewer', 'ministry', 'cac_review'),
  ('cac_review', 'assign_reviewer', 'cac', 'cac_review'),
  ('cac_review', 'assign_reviewer', 'ministry', 'cac_review'),
  ('dao_approved', 'approve', 'cac', 'cac_approved'),
  ('dao_approved', 'approve', 'ministry', 'cac_approved'),
  ('cac_review', 'approve', 'cac', 'cac_approved'),
  ('cac_review', 'approve', 'ministry', 'cac_approved'),
  ('dao_approved', 'request_corrections', 'cac', 'cac_corrections_requested'),
  ('dao_approved', 'request_corrections', 'ministry', 'cac_corrections_requested'),
  ('cac_review', 'request_corrections', 'cac', 'cac_corrections_requested'),
  ('cac_review', 'request_corrections', 'ministry', 'cac_corrections_requested'),
  ('dao_approved', 'reject', 'cac', 'rejected'),
  ('dao_approved', 'reject', 'ministry', 'rejected'),
  ('cac_review', 'reject', 'cac', 'rejected'),
  ('cac_review', 'reject', 'ministry', 'rejected'),
  ('dao_approved', 'escalate', 'cac', 'escalated'),
  ('dao_approved', 'escalate', 'ministry', 'escalated'),
  ('cac_review', 'escalate', 'cac', 'escalated'),
  ('cac_review', 'escalate', 'ministry', 'escalated'),
  ('cac_approved', 'assign_reviewer', 'ministry', 'ministry_review'),
  ('ministry_review', 'assign_reviewer', 'ministry', 'ministry_review'),
  ('cac_approved', 'approve', 'ministry', 'ministry_approved'),
  ('ministry_review', 'approve', 'ministry', 'ministry_approved'),
  ('escalated', 'approve', 'ministry', 'ministry_approved'),
  ('cac_approved', 'reject', 'ministry', 'rejected'),
  ('ministry_review', 'reject', 'ministry', 'rejected'),
  ('escalated', 'reject', 'ministry', 'rejected'),
  ('cac_approved', 'request_corrections', 'ministry', 'cac_corrections_requested'),
  ('ministry_review', 'request_corrections', 'ministry', 'cac_corrections_requested'),
  ('ministry_approved', 'archive', 'ministry', 'archived'),
  ('rejected', 'archive', 'ministry', 'archived');

alter table public.workflow_transition_rules enable row level security;
revoke all on table public.workflow_transition_rules from public, anon, authenticated;
grant select on table public.workflow_transition_rules to service_role;

create function public.wf_stage_for_role(r public.user_role)
returns text
language sql
immutable
as $$
  select case r::text
    when 'super_admin' then 'ministry'
    when 'admin' then 'ministry'
    when 'ministry_admin' then 'ministry'
    when 'ministry_officer' then 'ministry'
    when 'government_officer' then 'ministry'
    when 'county_agriculture_coordinator' then 'cac'
    when 'county_officer' then 'cac'
    when 'dao_officer' then 'dao'
    when 'district_officer' then 'dao'
    when 'clan_technician' then 'clan'
    when 'field_agent' then 'clan'
    when 'auditor' then 'auditor'
    else 'donor'
  end;
$$;

-- County-bound stages must match county; DAO/CLAN must also match a set district.
create function public.wf_stage_in_scope(
  stage text,
  actor_county text,
  actor_district text,
  target_county text,
  target_district text
)
returns boolean
language sql
immutable
as $$
  select case
    when stage = 'ministry' then true
    when stage = 'cac' then public.scope_same_text(actor_county, target_county)
    when stage in ('dao', 'clan') then
      public.scope_same_text(actor_county, target_county)
      and (
        target_district is null
        or btrim(target_district) = ''
        or public.scope_same_text(actor_district, target_district)
      )
    else false
  end;
$$;

create function public.wf_submission_json(s public.operational_submissions)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'id', s.id,
    'reference_code', s.reference_code,
    'submission_type', s.submission_type,
    'title', s.title,
    'summary', s.summary,
    'status', s.status,
    'actor_id', s.actor_id,
    'organization_id', s.organization_id,
    'county', s.county,
    'district', s.district,
    'current_assignee_id', s.current_assignee_id,
    'metadata', s.metadata,
    'created_at', s.created_at,
    'updated_at', s.updated_at
  );
$$;

create function public.wf_create_submission(
  p_submission_type text,
  p_title text,
  p_summary text default null,
  p_county text default null,
  p_district text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_note text default null,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_uid uuid := auth.uid();
  v_scope public.workforce_scope;
  v_stage text;
  v_type text := nullif(btrim(coalesce(p_submission_type, '')), '');
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_summary text := nullif(btrim(coalesce(p_summary, '')), '');
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_county text;
  v_district text;
  v_dedupe text;
  v_row public.operational_submissions;
begin
  v_scope := public.my_workforce_scope();
  if v_uid is null or v_scope.profile_id is null then
    raise exception using errcode = '42501', message = 'active workforce profile required';
  end if;
  v_stage := public.wf_stage_for_role(v_scope.role);
  if v_stage not in ('clan', 'dao', 'cac', 'ministry') then
    raise exception using errcode = '42501', message = 'this role cannot create or submit submissions';
  end if;
  if v_type is null or v_title is null then
    raise exception using errcode = '22023', message = 'submission type and title are required';
  end if;
  if length(v_type) > 100 or length(v_title) > 240
     or length(coalesce(v_summary, '')) > 4000 or length(coalesce(v_note, '')) > 4000 then
    raise exception using errcode = '22001', message = 'submission field exceeds maximum length';
  end if;
  if jsonb_typeof(v_metadata) <> 'object' or pg_column_size(v_metadata) > 128000 then
    raise exception using errcode = '22023', message = 'metadata must be a JSON object under 128 KB';
  end if;

  -- Geography is derived from the operator profile, never trusted from the client.
  if v_stage = 'ministry' then
    v_county := nullif(btrim(coalesce(p_county, '')), '');
    v_district := nullif(btrim(coalesce(p_district, '')), '');
  else
    v_county := v_scope.county;
    if nullif(btrim(coalesce(p_county, '')), '') is not null
       and not public.scope_same_text(p_county, v_county) then
      raise exception using errcode = '42501', message = 'submission county must match your assigned county';
    end if;
    if v_stage in ('clan', 'dao') then
      v_district := v_scope.district;
      if nullif(btrim(coalesce(p_district, '')), '') is not null
         and not public.scope_same_text(p_district, v_district) then
        raise exception using errcode = '42501', message = 'submission district must match your assigned district';
      end if;
    else
      v_district := nullif(btrim(coalesce(p_district, '')), '');
    end if;
  end if;

  v_dedupe := nullif(btrim(coalesce(v_metadata ->> 'dedupe_key', '')), '');
  if v_dedupe is not null then
    perform pg_advisory_xact_lock(hashtextextended(v_uid::text || ':' || v_dedupe, 0));
    select s.* into v_row
    from public.operational_submissions s
    where s.actor_id = v_uid
      and s.metadata ->> 'dedupe_key' = v_dedupe
      and s.status <> 'archived'
    order by s.created_at desc
    limit 1;
    if found then
      return jsonb_build_object('submission', public.wf_submission_json(v_row), 'deduplicated', true);
    end if;
  end if;

  insert into public.operational_submissions (
    reference_code, submission_type, title, summary, status, actor_id,
    organization_id, county, district, metadata
  )
  values (
    'SUB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
    v_type, v_title, v_summary, 'submitted', v_uid,
    v_scope.organization_id, v_county, v_district, v_metadata
  )
  returning * into v_row;

  insert into public.workflow_actions (
    submission_id, actor_id, action, from_status, to_status, county, district, note, metadata
  )
  values (
    v_row.id, v_uid, 'submit', 'draft', 'submitted', v_row.county, v_row.district, v_note,
    jsonb_build_object('request_id', p_request_id)
  );

  insert into public.audit_log (user_id, action, table_name, record_id, new_values)
  values (
    v_uid, 'workflow_submit', 'operational_submissions', v_row.id,
    jsonb_build_object(
      'record_ref', v_row.reference_code,
      'to_status', 'submitted',
      'type', v_row.submission_type,
      'request_id', p_request_id
    )
  );

  return jsonb_build_object('submission', public.wf_submission_json(v_row), 'deduplicated', false);
end;
$$;

create function public.wf_transition(
  p_submission_id uuid,
  p_action text,
  p_note text default null,
  p_assignee_id uuid default null,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_uid uuid := auth.uid();
  v_scope public.workforce_scope;
  v_stage text;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_sub public.operational_submissions;
  v_row public.operational_submissions;
  v_is_author boolean;
  v_in_scope boolean;
  v_to public.workflow_status;
  v_assignee_role public.user_role;
  v_assignee_county text;
  v_assignee_district text;
  v_assignee_stage text;
  v_recipient uuid;
  v_kind text;
  v_title text;
begin
  v_scope := public.my_workforce_scope();
  if v_uid is null or v_scope.profile_id is null then
    raise exception using errcode = '42501', message = 'active workforce profile required';
  end if;
  v_stage := public.wf_stage_for_role(v_scope.role);
  if v_stage not in ('clan', 'dao', 'cac', 'ministry') then
    raise exception using errcode = '42501', message = 'read-only role cannot perform workflow mutations';
  end if;
  if p_action is null or p_action not in (
    'submit', 'approve', 'reject', 'request_corrections', 'escalate', 'assign_reviewer', 'comment', 'archive'
  ) then
    raise exception using errcode = '22023', message = 'unknown workflow action';
  end if;
  if length(coalesce(v_note, '')) > 4000 then
    raise exception using errcode = '22001', message = 'note exceeds maximum length';
  end if;

  select s.* into v_sub
  from public.operational_submissions s
  where s.id = p_submission_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'submission not found or outside your scope';
  end if;

  v_is_author := v_sub.actor_id = v_uid;
  v_in_scope := public.wf_stage_in_scope(
    v_stage, v_scope.county, v_scope.district, v_sub.county, v_sub.district
  );
  if not (v_is_author or v_in_scope or v_sub.current_assignee_id = v_uid) then
    raise exception using errcode = 'P0002', message = 'submission not found or outside your scope';
  end if;

  if p_action in ('submit', 'comment') then
    if not (v_is_author or v_in_scope) then
      raise exception using errcode = '42501', message = 'submission is outside your scope';
    end if;
  else
    if v_stage = 'clan' then
      raise exception using errcode = '42501', message = 'CLAN field operators cannot review submissions';
    end if;
    if not v_in_scope then
      raise exception using errcode = '42501', message = 'submission is outside your scope';
    end if;
  end if;

  if p_action = 'comment' then
    if v_sub.status = 'archived' then
      raise exception using errcode = '22023', message = 'archived submissions cannot receive comments';
    end if;
    v_to := v_sub.status;
  else
    select r.to_status into v_to
    from public.workflow_transition_rules r
    where r.from_status = v_sub.status and r.action = p_action and r.stage = v_stage;
    if not found then
      raise exception using
        errcode = '22023',
        message = format('invalid transition: %s from %s for stage %s', p_action, v_sub.status, v_stage);
    end if;
  end if;

  if p_action = 'assign_reviewer' then
    if p_assignee_id is null then
      raise exception using errcode = '22023', message = 'assign_reviewer requires an assignee';
    end if;
    select p.role, p.county, p.district
    into v_assignee_role, v_assignee_county, v_assignee_district
    from public.profiles p
    where p.id = p_assignee_id
      and public.workforce_subject_has_access(p.id);
    if not found then
      raise exception using errcode = '22023', message = 'assignee must be an active workforce operator';
    end if;
    v_assignee_stage := public.wf_stage_for_role(v_assignee_role);
    if v_assignee_stage not in ('dao', 'cac', 'ministry')
       or not public.wf_stage_in_scope(
         v_assignee_stage, v_assignee_county, v_assignee_district, v_sub.county, v_sub.district
       ) then
      raise exception using errcode = '22023', message = 'assignee must be a reviewer in the submission scope';
    end if;
  end if;

  update public.operational_submissions s
  set
    status = v_to,
    current_assignee_id = case when p_action = 'assign_reviewer' then p_assignee_id else s.current_assignee_id end
  where s.id = v_sub.id
  returning s.* into v_row;

  insert into public.workflow_actions (
    submission_id, actor_id, action, from_status, to_status, county, district, note, metadata
  )
  values (
    v_sub.id, v_uid, p_action, v_sub.status, v_to, v_sub.county, v_sub.district, v_note,
    jsonb_build_object('request_id', p_request_id)
  );

  if p_action = 'request_corrections' or (p_action = 'comment' and v_note is not null) then
    insert into public.workflow_comments (
      submission_id, actor_id, body, is_correction_request, county
    )
    values (
      v_sub.id, v_uid, coalesce(v_note, 'Corrections requested.'),
      p_action = 'request_corrections', v_sub.county
    );
  end if;

  if p_action = 'assign_reviewer' then
    insert into public.workflow_assignments (
      submission_id, assigned_by, assignee_id, role_scope, status, county, district, note
    )
    values (
      v_sub.id, v_uid, p_assignee_id,
      case v_to when 'dao_review' then 'dao' when 'cac_review' then 'cac'
                when 'ministry_review' then 'ministry' else 'review' end,
      'active', v_sub.county, v_sub.district, v_note
    );
  end if;

  if p_action = 'assign_reviewer' then
    v_recipient := p_assignee_id; v_kind := 'assignment'; v_title := 'Assigned for review: ' || v_sub.title;
  elsif p_action = 'request_corrections' then
    v_recipient := v_sub.actor_id; v_kind := 'correction_request'; v_title := 'Corrections requested: ' || v_sub.title;
  elsif p_action = 'escalate' then
    v_recipient := v_sub.actor_id; v_kind := 'escalation'; v_title := 'Escalated: ' || v_sub.title;
  elsif p_action in ('approve', 'reject') then
    v_recipient := v_sub.actor_id; v_kind := 'decision';
    v_title := case when p_action = 'approve' then 'Advanced: ' else 'Rejected: ' end || v_sub.title;
  end if;

  if v_recipient is not null and v_recipient <> v_uid then
    insert into public.workflow_notifications (
      submission_id, recipient_id, created_by, kind, title, body, county
    )
    values (
      v_sub.id, v_recipient, v_uid, v_kind, v_title,
      coalesce(v_note, 'Status is now ' || replace(v_to::text, '_', ' ') || '.'),
      v_sub.county
    );
  end if;

  insert into public.audit_log (user_id, action, table_name, record_id, new_values)
  values (
    v_uid, 'workflow_' || p_action, 'operational_submissions', v_sub.id,
    jsonb_build_object(
      'record_ref', v_sub.reference_code,
      'from_status', v_sub.status,
      'to_status', v_to,
      'note', v_note,
      'assignee_id', p_assignee_id,
      'request_id', p_request_id
    )
  );

  return jsonb_build_object('submission', public.wf_submission_json(v_row), 'changed', v_to <> v_sub.status);
end;
$$;

revoke all on function public.wf_stage_for_role(public.user_role) from public, anon, authenticated, service_role;
revoke all on function public.wf_stage_in_scope(text, text, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.wf_submission_json(public.operational_submissions) from public, anon, authenticated, service_role;
revoke all on function public.wf_create_submission(text, text, text, text, text, jsonb, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.wf_transition(uuid, text, text, uuid, text)
  from public, anon, authenticated, service_role;
grant execute on function public.wf_create_submission(text, text, text, text, text, jsonb, text, text) to authenticated;
grant execute on function public.wf_transition(uuid, text, text, uuid, text) to authenticated;

-- Direct writes to workflow state and ledgers are closed; the RPCs above are the only path.
drop policy if exists op_subs_insert on public.operational_submissions;
drop policy if exists op_subs_update on public.operational_submissions;
drop policy if exists wf_actions_insert on public.workflow_actions;
drop policy if exists wf_comments_insert on public.workflow_comments;
drop policy if exists wf_assign_insert on public.workflow_assignments;
drop policy if exists wf_assign_update on public.workflow_assignments;
drop policy if exists wf_notifs_insert on public.workflow_notifications;

revoke insert, update, delete on public.operational_submissions from anon, authenticated;
revoke insert, update, delete on public.workflow_actions from anon, authenticated;
revoke insert, update, delete on public.workflow_comments from anon, authenticated;
revoke insert, update, delete on public.workflow_assignments from anon, authenticated;
revoke insert, update, delete on public.workflow_notifications from anon, authenticated;
grant update (read_at) on public.workflow_notifications to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Workflow read scope: donors lose raw submission access (OPS-DB-08).
-- ---------------------------------------------------------------------------
create function public.wf_can_read(
  s public.workforce_scope,
  target_county text,
  target_actor uuid,
  target_assignee uuid
)
returns boolean
language sql
immutable
as $$
  select s.profile_id is not null and (
    public.scope_is_national(s)
    or s.role = 'auditor'
    or target_actor = s.profile_id
    or target_assignee = s.profile_id
    or (
      s.role in (
        'county_agriculture_coordinator', 'county_officer',
        'dao_officer', 'district_officer', 'clan_technician', 'field_agent'
      )
      and public.scope_same_text(target_county, s.county)
    )
  );
$$;

drop policy if exists op_subs_read on public.operational_submissions;
create policy op_subs_read on public.operational_submissions
for select to authenticated
using (public.wf_can_read((select public.my_workforce_scope()), county, actor_id, current_assignee_id));

drop policy if exists wf_actions_read on public.workflow_actions;
create policy wf_actions_read on public.workflow_actions
for select to authenticated
using (
  public.wf_can_read((select public.my_workforce_scope()), county, actor_id, null)
  or exists (
    select 1 from public.operational_submissions s
    where s.id = workflow_actions.submission_id
  )
);

drop policy if exists wf_comments_read on public.workflow_comments;
create policy wf_comments_read on public.workflow_comments
for select to authenticated
using (
  public.wf_can_read((select public.my_workforce_scope()), county, actor_id, null)
  or exists (
    select 1 from public.operational_submissions s
    where s.id = workflow_comments.submission_id
  )
);

drop policy if exists wf_assign_read on public.workflow_assignments;
create policy wf_assign_read on public.workflow_assignments
for select to authenticated
using (
  assigned_by = (select auth.uid())
  or assignee_id = (select auth.uid())
  or public.wf_can_read((select public.my_workforce_scope()), county, null, null)
);

commit;
