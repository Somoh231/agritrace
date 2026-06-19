-- ===========================================================================
-- Persistent approval workflow engine — CLAN → DAO → CAC → Ministry
-- ---------------------------------------------------------------------------
-- Introduces durable, audited, permission-checked workflow entities:
--   operational_submissions, workflow_actions, workflow_comments,
--   workflow_assignments, workflow_notifications.
--
-- Authorization model: server logic (src/lib/workflow/*) is the primary gate
-- and computes transitions + role/scope. RLS here is defense-in-depth so that
-- even with the user-scoped (anon) client, rows cannot leak or be mutated out
-- of county scope. No service-role key is ever used from the app.
-- ===========================================================================

-- pgcrypto for gen_random_uuid (no-op if already present)
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Workflow status enum (13 states)
-- ---------------------------------------------------------------------------
do $$ begin
  create type workflow_status as enum (
    'draft',
    'submitted',
    'dao_review',
    'dao_corrections_requested',
    'dao_approved',
    'cac_review',
    'cac_corrections_requested',
    'cac_approved',
    'ministry_review',
    'ministry_approved',
    'rejected',
    'escalated',
    'archived'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Scope helpers (security definer; account for all national/ministry roles —
-- public.is_ministry_wide() predates ministry_admin, so we widen it here).
-- ---------------------------------------------------------------------------
create or replace function public.wf_is_ministry()
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
      and p.role in ('super_admin','admin','ministry_admin','ministry_officer','government_officer')
  );
$$;

-- Reviewer = anyone who can act on the chain (DAO / CAC / ministry / admin).
create or replace function public.wf_is_reviewer()
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
        'super_admin','admin','ministry_admin','ministry_officer','government_officer',
        'county_agriculture_coordinator','county_officer',
        'dao_officer','district_officer'
      )
  );
$$;

-- Submission author roles (can create/submit field submissions).
create or replace function public.wf_can_create()
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
        'super_admin','admin','ministry_admin','ministry_officer','government_officer',
        'county_agriculture_coordinator','county_officer',
        'dao_officer','district_officer',
        'clan_technician','field_agent'
      )
  );
$$;

-- County visibility predicate reused across tables.
create or replace function public.wf_county_in_scope(target_county text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.wf_is_ministry()
    or public.profile_role() in ('super_admin','auditor','donor_observer','donor_partner')
    or (target_county is not null and lower(target_county) = lower(coalesce(public.profile_county(), '')));
$$;

-- ---------------------------------------------------------------------------
-- operational_submissions — the canonical workflow entity
-- ---------------------------------------------------------------------------
create table if not exists operational_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reference_code text unique,
  submission_type text not null,
  title text not null,
  summary text,
  status workflow_status not null default 'draft',
  actor_id uuid references profiles(id) on delete set null,
  organization_id uuid references organizations(id) on delete set null,
  county text,
  district text,
  current_assignee_id uuid references profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- workflow_actions — append-only decision ledger
-- ---------------------------------------------------------------------------
create table if not exists workflow_actions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  submission_id uuid not null references operational_submissions(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  from_status workflow_status,
  to_status workflow_status,
  county text,
  district text,
  note text,
  metadata jsonb not null default '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- workflow_comments — discussion + correction requests (append-only)
-- ---------------------------------------------------------------------------
create table if not exists workflow_comments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  submission_id uuid not null references operational_submissions(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  body text not null,
  is_correction_request boolean not null default false,
  county text,
  metadata jsonb not null default '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- workflow_assignments — reviewer routing / claim state
-- ---------------------------------------------------------------------------
create table if not exists workflow_assignments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  submission_id uuid not null references operational_submissions(id) on delete cascade,
  assigned_by uuid references profiles(id) on delete set null,
  assignee_id uuid references profiles(id) on delete set null,
  role_scope text,
  status text not null default 'active',
  county text,
  district text,
  note text,
  metadata jsonb not null default '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- workflow_notifications — directed alerts (assignment / corrections / decisions)
-- ---------------------------------------------------------------------------
create table if not exists workflow_notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  submission_id uuid references operational_submissions(id) on delete cascade,
  recipient_id uuid references profiles(id) on delete cascade,
  created_by uuid references profiles(id) on delete set null,
  kind text not null,
  title text not null,
  body text,
  county text,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_op_subs_status on operational_submissions(status);
create index if not exists idx_op_subs_county on operational_submissions(county);
create index if not exists idx_op_subs_actor on operational_submissions(actor_id);
create index if not exists idx_op_subs_assignee on operational_submissions(current_assignee_id);
create index if not exists idx_op_subs_created on operational_submissions(created_at desc);
create index if not exists idx_wf_actions_submission on workflow_actions(submission_id, created_at desc);
create index if not exists idx_wf_actions_actor on workflow_actions(actor_id);
create index if not exists idx_wf_comments_submission on workflow_comments(submission_id, created_at desc);
create index if not exists idx_wf_assignments_submission on workflow_assignments(submission_id, created_at desc);
create index if not exists idx_wf_assignments_assignee on workflow_assignments(assignee_id);
create index if not exists idx_wf_notifs_recipient on workflow_notifications(recipient_id, read_at);

-- ---------------------------------------------------------------------------
-- updated_at trigger for operational_submissions
-- ---------------------------------------------------------------------------
create or replace function public.wf_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_op_subs_updated on operational_submissions;
create trigger trg_op_subs_updated
  before update on operational_submissions
  for each row execute function public.wf_touch_updated_at();

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table operational_submissions enable row level security;
alter table workflow_actions enable row level security;
alter table workflow_comments enable row level security;
alter table workflow_assignments enable row level security;
alter table workflow_notifications enable row level security;

-- ----- operational_submissions ---------------------------------------------
-- Read: ministry-wide, super_admin/auditor (read-only oversight), donor (read),
--       creator, current assignee, or county-scoped reviewers.
drop policy if exists op_subs_read on operational_submissions;
create policy op_subs_read on operational_submissions for select using (
  public.wf_is_ministry()
  or public.profile_role() in ('super_admin','auditor','donor_observer','donor_partner')
  or actor_id = auth.uid()
  or current_assignee_id = auth.uid()
  or public.wf_county_in_scope(county)
);

-- Insert: only authors, attributed to themselves.
drop policy if exists op_subs_insert on operational_submissions;
create policy op_subs_insert on operational_submissions for insert with check (
  public.wf_can_create()
  and actor_id = auth.uid()
);

-- Update: ministry-wide, the creator (e.g., redraft/resubmit own), or
-- county-scoped reviewers. Exact transition legality is enforced server-side.
drop policy if exists op_subs_update on operational_submissions;
create policy op_subs_update on operational_submissions for update using (
  public.wf_is_ministry()
  or actor_id = auth.uid()
  or (public.wf_is_reviewer() and public.wf_county_in_scope(county))
) with check (
  public.wf_is_ministry()
  or actor_id = auth.uid()
  or (public.wf_is_reviewer() and public.wf_county_in_scope(county))
);

-- ----- workflow_actions (append-only) --------------------------------------
drop policy if exists wf_actions_read on workflow_actions;
create policy wf_actions_read on workflow_actions for select using (
  public.wf_is_ministry()
  or public.profile_role() in ('super_admin','auditor','donor_observer','donor_partner')
  or actor_id = auth.uid()
  or public.wf_county_in_scope(county)
  or exists (
    select 1 from operational_submissions s
    where s.id = workflow_actions.submission_id and s.actor_id = auth.uid()
  )
);

drop policy if exists wf_actions_insert on workflow_actions;
create policy wf_actions_insert on workflow_actions for insert with check (
  actor_id = auth.uid()
  and (public.wf_is_reviewer() or public.wf_can_create())
);

-- ----- workflow_comments (append-only) -------------------------------------
drop policy if exists wf_comments_read on workflow_comments;
create policy wf_comments_read on workflow_comments for select using (
  public.wf_is_ministry()
  or public.profile_role() in ('super_admin','auditor','donor_observer','donor_partner')
  or actor_id = auth.uid()
  or public.wf_county_in_scope(county)
  or exists (
    select 1 from operational_submissions s
    where s.id = workflow_comments.submission_id and s.actor_id = auth.uid()
  )
);

drop policy if exists wf_comments_insert on workflow_comments;
create policy wf_comments_insert on workflow_comments for insert with check (
  actor_id = auth.uid()
  and (public.wf_is_reviewer() or public.wf_can_create())
);

-- ----- workflow_assignments ------------------------------------------------
drop policy if exists wf_assign_read on workflow_assignments;
create policy wf_assign_read on workflow_assignments for select using (
  public.wf_is_ministry()
  or public.profile_role() in ('super_admin','auditor')
  or assigned_by = auth.uid()
  or assignee_id = auth.uid()
  or public.wf_county_in_scope(county)
);

drop policy if exists wf_assign_insert on workflow_assignments;
create policy wf_assign_insert on workflow_assignments for insert with check (
  assigned_by = auth.uid()
  and public.wf_is_reviewer()
);

drop policy if exists wf_assign_update on workflow_assignments;
create policy wf_assign_update on workflow_assignments for update using (
  public.wf_is_ministry()
  or assigned_by = auth.uid()
  or assignee_id = auth.uid()
) with check (
  public.wf_is_ministry()
  or assigned_by = auth.uid()
  or assignee_id = auth.uid()
);

-- ----- workflow_notifications ----------------------------------------------
drop policy if exists wf_notifs_read on workflow_notifications;
create policy wf_notifs_read on workflow_notifications for select using (
  public.wf_is_ministry()
  or recipient_id = auth.uid()
  or created_by = auth.uid()
);

-- Inserter (actor) creates notifications for others; attributed to self.
drop policy if exists wf_notifs_insert on workflow_notifications;
create policy wf_notifs_insert on workflow_notifications for insert with check (
  created_by = auth.uid()
  and (public.wf_is_reviewer() or public.wf_can_create())
);

-- Recipients can mark their own notifications read.
drop policy if exists wf_notifs_update on workflow_notifications;
create policy wf_notifs_update on workflow_notifications for update using (
  recipient_id = auth.uid() or public.wf_is_ministry()
) with check (
  recipient_id = auth.uid() or public.wf_is_ministry()
);
