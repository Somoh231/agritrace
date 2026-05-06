-- Optional manual snippets for the Liberia rice pilot.
-- Canonical seed (farmers, warehouses, stock, reporting) runs via:
--   cd agritrace && npm run seed:pilot
-- with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set.

-- Example: toggle pilot-active counties without re-running the TS seed.
-- update counties set is_pilot_active = (name in ('Nimba','Bong','Lofa'));
