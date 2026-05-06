# Supabase migrations — AgriVault national pilot

Apply to your Supabase project (e.g. ref `tkblfaqaoyadjnyhyiz`):

## Option A — Supabase CLI

```bash
cd agritrace
supabase link --project-ref tkblfaqaoyadjnyhyiz
supabase db push
```

## Option B — SQL Editor

Run files **in numeric order** in the Supabase Dashboard → SQL Editor:

1. `20260207120000_agrivault_core.sql`
2. `20260207120001_agrivault_pilot_tables.sql`
3. `20260207120002_agrivault_rls.sql`

Then load pilot reference + inventory data:

4. From `agritrace/`: `npm run seed:pilot` (requires `SUPABASE_SERVICE_ROLE_KEY`). Optional SQL snippets live in `supabase/seed/pilot_seed.sql`.

## TEMP DEMO FALLBACK (app layer)

See `src/lib/supabase/TEMP_DEMO_FALLBACK.md` and `temp-demo-profile-fallback.ts`. Disable after every auth user has a `profiles` row and RLS is validated.

## Environment (production)

- **Browser:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` only  
- **Server/admin scripts:** `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`  
- Never expose the service role key to the client bundle.
