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

## Seed order

```bash
npm run seed:demo    # demo Auth users, orgs, farmers, cocoa/rice demo graph (service role)
npm run seed:national   # Liberia counties grid, pilot warehouses, inventory, rice pilot aggregates
```

Requires **`NEXT_PUBLIC_SUPABASE_URL`** and **`SUPABASE_SERVICE_ROLE_KEY`** locally or in CI (never expose the service role to the browser).
