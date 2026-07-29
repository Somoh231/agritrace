# Supabase — national agriculture pilot

Apply migrations to your hosted project **before** running app seeds.

Your project ref (dashboard URL slug): `tkblfaqaoyadjnyhyiz`

## Option A — Supabase CLI

From `agritrace/`:

```bash
supabase link --project-ref tkblfaqaoyadjnyhyiz
supabase db push
```

## Option B — SQL Editor

In Supabase Dashboard → **SQL**, paste and run **in filename order**:

1. `migrations/20260207100000_national_pilot_schema.sql`
2. `migrations/20260207101000_auth_trigger_and_rls.sql`
3. `migrations/20260208100000_orgs_locations_unique_for_upserts.sql`

## Synthetic data order

```bash
npm run seed:national   # approved staging only; requires unique operator emails
```

Provision unique users through Admin → Users & Roles first. The national seed
requires **`NEXT_PUBLIC_SUPABASE_URL`**, **`SUPABASE_SERVICE_ROLE_KEY`**,
`SEED_MINISTRY_OPERATOR_EMAIL`, and `SEED_FIELD_OPERATOR_EMAIL` locally or in CI
(never expose the service role to the browser).
