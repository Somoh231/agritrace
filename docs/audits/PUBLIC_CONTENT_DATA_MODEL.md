# Public content data model — review

Date: 2026-09-25. Code review only; the live database was **not** queried or
changed.

## Findings

| Question | Finding |
| --- | --- |
| Table | `public.public_content_blocks` — columns `key text`, `locale text`, `value jsonb`, `updated_by uuid`, `updated_at timestamptz`; primary key `(key, locale)`. |
| Where it is defined | Only in `src/lib/supabase/schema.content.sql`, a file marked **"LEGACY / DO NOT APPLY. Superseded by supabase/migrations/*.sql"**. No tracked migration creates the table or sets its policies, so its existence and policies in the live database are **unknown from code**. |
| Public read policy | That legacy file creates `public_content_blocks_read_anon`: `for select to anon, authenticated using (true)` — every row and every JSON field readable. No later migration revokes it (there is no blanket anon revoke). |
| Fields publicly readable (if applied) | All of them: `key`, `locale`, the whole `value` object, `updated_by` (a user id) and `updated_at`. |
| Intended public website content | `homepage.*` and `platform.*` copy (headlines, CTAs) for the **legacy** marketing site, which has been removed. The current public site does not read this table at all. |
| Private data that can be stored | Yes. The `contact` key holds a person's name, role, email, phone and locations, and `value` is free-form JSON, so any admin PATCH can store arbitrary fields. `updated_by` exposes staff user ids. |
| API field filtering | None. `GET /api/admin/content` returns the full merged object; `PATCH` upserts any object-valued key. Both are admin-guarded (`guardAdminApiRequest`) and use the service-role client, so they bypass RLS. |
| Direct public queries | If the table exists with the legacy policy: yes. The anon key is shipped to browsers (`NEXT_PUBLIC_SUPABASE_ANON_KEY`), so anyone can read the table through Supabase's REST API without going through the app. |
| Is public read intentional? | It was intended for the legacy public marketing site. That consumer no longer exists, and `getPublicContent()` (the only public reader) is unused. |

## Recommendation: C — make the table private; expose only selected fields through an API

- Nothing on the current public site needs anonymous database reads of this
  table, and it can hold personal contact data.
- Drop the anon/authenticated `select` policy (leave RLS enabled with no
  public policy). The admin API keeps working because it uses the service
  role.
- If editable public copy is needed later, serve it from a server route that
  returns an explicit allow-list of fields (never `contact`, never
  `updated_by`), cached at the edge.
- Remove the legacy `schema.content.sql` file so it cannot be re-applied, and
  move the table definition into a tracked migration.

**Do not apply any of this without explicit approval.** Proposed migration
(for review, not applied):

```sql
-- Proposed: make public_content_blocks private (service role only).
drop policy if exists "public_content_blocks_read_anon" on public.public_content_blocks;
revoke all on table public.public_content_blocks from anon, authenticated;
alter table public.public_content_blocks enable row level security;
```

## Owner verification (read-only, run in the Supabase SQL editor)

```sql
-- 1. Does the table exist?
select to_regclass('public.public_content_blocks') as table_exists;
-- 2. Which policies apply?
select policyname, roles, cmd, qual from pg_policies where tablename = 'public_content_blocks';
-- 3. Which keys are stored (no values)?
select key, locale, (select array_agg(k) from jsonb_object_keys(value) k) as fields
from public.public_content_blocks;
```

If query 3 shows a `contact` row with populated fields and query 2 shows the
anon policy, that personal data is publicly readable today and should be
cleared as part of approving the change above.
