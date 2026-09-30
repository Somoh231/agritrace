-- ===========================================================================
-- Ministry preview — synthetic STAGING dataset (never production)
-- ---------------------------------------------------------------------------
-- Every record is illustrative: "Sample …" names, fictitious +231 000 000 …
-- numbers, SMP-* identifiers, Nimba / Bong / Lofa only, illustrative values.
-- No production identities, farmer PII or operational records are copied.
--
-- Hard guards (both must pass, or nothing is written):
--   1. the database carries the staging marker, created once by the owner in
--      the STAGING project only (production never has it):
--        create schema if not exists agrivault_env;
--        revoke all on schema agrivault_env from public, anon, authenticated;
--        create table if not exists agrivault_env.marker (
--          environment text primary key check (environment = 'staging'));
--        insert into agrivault_env.marker values ('staging') on conflict do nothing;
--   2. no non-synthetic farmer rows exist (a database holding real registry
--      data is refused, whatever its marker says).
--
-- Idempotent: fixed ids derived from SMP codes; re-running updates in place.
-- Verified by `npm run test:db:preview` (throwaway local Postgres).
-- ===========================================================================

begin;

do $$
declare
  marked boolean := false;
begin
  if to_regclass('agrivault_env.marker') is not null then
    execute $q$select exists (select 1 from agrivault_env.marker where environment = 'staging')$q$ into marked;
  end if;
  if not marked then
    raise exception 'preview-synthetic.sql refused: database has no agrivault_env staging marker';
  end if;
  if exists (select 1 from public.farmers where coalesce(national_id, '') not like 'SMP-%') then
    raise exception 'preview-synthetic.sql refused: database holds non-synthetic farmer records';
  end if;
end $$;

create or replace function pg_temp.smp_id(code text) returns uuid language sql immutable as $$
  select md5('agrivault-preview:' || code)::uuid;
$$;

-- Warehouses and items ---------------------------------------------------------
insert into public.warehouses (id, name, county, latitude, longitude, ministry_code, capacity_mt, current_stock_mt, utilization_pct, manager_name, operational_status, low_stock_threshold_pct)
values
  (pg_temp.smp_id('SMP-WH-A'), 'Sample warehouse A · Nimba', 'Nimba', 7.36, -8.71, 'SMP-WH-A', 120, 78, 65, 'Sample manager A', 'Operational', 20),
  (pg_temp.smp_id('SMP-WH-B'), 'Sample warehouse B · Bong', 'Bong', 7.00, -9.47, 'SMP-WH-B', 90, 63, 70, 'Sample manager B', 'Operational', 20),
  (pg_temp.smp_id('SMP-WH-C'), 'Sample warehouse C · Lofa', 'Lofa', 8.42, -9.75, 'SMP-WH-C', 100, 42, 42, 'Sample manager C', 'Operational', 20)
on conflict (id) do update set name = excluded.name, county = excluded.county, current_stock_mt = excluded.current_stock_mt, utilization_pct = excluded.utilization_pct;

insert into public.inventory_items (id, sku, name, category, unit) values
  (pg_temp.smp_id('SMP-ITEM-SEED'), 'SMP-SEED-RICE', 'Sample rice seed', 'rice_seed', 'kg'),
  (pg_temp.smp_id('SMP-ITEM-UREA'), 'SMP-FERT-UREA', 'Sample urea', 'fertilizer', 'kg'),
  (pg_temp.smp_id('SMP-ITEM-NPK'), 'SMP-FERT-NPK', 'Sample NPK', 'fertilizer', 'kg')
on conflict (id) do update set name = excluded.name;

insert into public.warehouse_stock (id, warehouse_id, inventory_item_id, quantity, batch_code, donor_tagged, loss_flag, theft_flag)
select pg_temp.smp_id('SMP-STOCK-' || w || '-' || i), pg_temp.smp_id('SMP-WH-' || w), pg_temp.smp_id('SMP-ITEM-' || i),
       q, 'SMP-BATCH-' || w || '-' || i, false, false, false
from (values ('A', 'SEED', 4000), ('A', 'UREA', 3000), ('A', 'NPK', 1500),
             ('B', 'SEED', 2800), ('B', 'UREA', 2400), ('B', 'NPK', 1100),
             ('C', 'SEED', 3200), ('C', 'UREA', 2600), ('C', 'NPK', 900)) as s(w, i, q)
on conflict (id) do update set quantity = excluded.quantity;

-- Farmers, plots, production ------------------------------------------------------
with f as (
  select n,
         lpad(n::text, 2, '0') as nn,
         (array['Nimba', 'Bong', 'Lofa'])[1 + (n - 1) % 3] as county,
         (array[7.36, 7.00, 8.42])[1 + (n - 1) % 3] + ((n % 5) - 2) * 0.03 as lat,
         (array[-8.71, -9.47, -9.75])[1 + (n - 1) % 3] + ((n % 4) - 1.5) * 0.03 as lng
  from generate_series(1, 24) as n
)
insert into public.farmers (id, full_name, national_id, phone, gender, county, district, village, latitude, longitude,
                            registration_date, verification_status, subsidy_eligible, main_crop, acreage_hectares, notes)
select pg_temp.smp_id('SMP-F-' || nn), 'Sample farmer ' || nn, 'SMP-F-0' || nn, '+231 000 000 0' || nn,
       case when n % 2 = 0 then 'female' else 'male' end,
       county, 'Sample district ' || (case when n % 2 = 0 then 'A' else 'B' end), 'Sample village',
       round(lat::numeric, 5), round(lng::numeric, 5),
       date '2026-04-01' + (n * 3),
       (array['verified', 'verified', 'pending', 'flagged'])[1 + n % 4],
       n % 3 <> 0, 'rice', 1 + (n % 4),
       'Illustrative preview record — not a real farmer.'
from f
on conflict (id) do update set full_name = excluded.full_name, phone = excluded.phone, county = excluded.county,
  district = excluded.district, verification_status = excluded.verification_status;

insert into public.plots (id, farmer_id, commodity, area_hectares, center_latitude, center_longitude, polygon_geojson, county, district, village, land_tenure)
select pg_temp.smp_id('SMP-P-' || lpad(n::text, 2, '0')), fr.id, 'rice', fr.acreage_hectares, fr.latitude, fr.longitude,
       jsonb_build_object('type', 'Polygon', 'coordinates', jsonb_build_array(jsonb_build_array(
         jsonb_build_array(fr.longitude - 0.002, fr.latitude - 0.002), jsonb_build_array(fr.longitude + 0.002, fr.latitude - 0.002),
         jsonb_build_array(fr.longitude + 0.002, fr.latitude + 0.002), jsonb_build_array(fr.longitude - 0.002, fr.latitude + 0.002),
         jsonb_build_array(fr.longitude - 0.002, fr.latitude - 0.002)))),
       fr.county, fr.district, fr.village, 'Customary (illustrative)'
from generate_series(1, 24) as n
join public.farmers fr on fr.id = pg_temp.smp_id('SMP-F-' || lpad(n::text, 2, '0'))
on conflict (id) do update set area_hectares = excluded.area_hectares, polygon_geojson = excluded.polygon_geojson;

-- Season value matches the platform's current-period filter; the UI shows
-- "Pilot validation period", never a season name.
insert into public.rice_production_records (id, farmer_id, plot_id, season, expected_yield_kg, actual_yield_kg, post_harvest_loss_kg,
                                            post_harvest_loss_cause, county, district, notes)
select pg_temp.smp_id('SMP-PR-' || lpad(n::text, 2, '0')), fr.id, pg_temp.smp_id('SMP-P-' || lpad(n::text, 2, '0')),
       to_char(now(), 'YYYY') || '-' || case when extract(month from now()) < 7 then 'A' else 'B' end,
       fr.acreage_hectares * 3000, fr.acreage_hectares * (2400 + (n % 5) * 100), fr.acreage_hectares * (180 + (n % 3) * 40),
       (array['Moisture / storage', 'Transport delay', 'Pests'])[1 + n % 3], fr.county, fr.district,
       'Illustrative preview value.'
from generate_series(1, 24) as n
join public.farmers fr on fr.id = pg_temp.smp_id('SMP-F-' || lpad(n::text, 2, '0'))
on conflict (id) do update set actual_yield_kg = excluded.actual_yield_kg, season = excluded.season;

-- Movements and transfers ----------------------------------------------------------
insert into public.inventory_movements (id, inventory_item_id, warehouse_from, warehouse_to, quantity, movement_type, reference, county_allocation)
values
  (pg_temp.smp_id('SMP-MV-1'), pg_temp.smp_id('SMP-ITEM-SEED'), null, pg_temp.smp_id('SMP-WH-A'), 4000, 'receipt', 'SMP-MV-1', 'Nimba'),
  (pg_temp.smp_id('SMP-MV-2'), pg_temp.smp_id('SMP-ITEM-UREA'), null, pg_temp.smp_id('SMP-WH-B'), 2400, 'receipt', 'SMP-MV-2', 'Bong'),
  (pg_temp.smp_id('SMP-MV-3'), pg_temp.smp_id('SMP-ITEM-SEED'), pg_temp.smp_id('SMP-WH-A'), pg_temp.smp_id('SMP-WH-B'), 500, 'transfer', 'SMP-MV-3', 'Bong'),
  (pg_temp.smp_id('SMP-MV-4'), pg_temp.smp_id('SMP-ITEM-NPK'), pg_temp.smp_id('SMP-WH-C'), null, 200, 'distribution', 'SMP-MV-4', 'Lofa'),
  (pg_temp.smp_id('SMP-MV-5'), pg_temp.smp_id('SMP-ITEM-UREA'), pg_temp.smp_id('SMP-WH-B'), null, 300, 'distribution', 'SMP-MV-5', 'Bong'),
  (pg_temp.smp_id('SMP-MV-6'), pg_temp.smp_id('SMP-ITEM-SEED'), pg_temp.smp_id('SMP-WH-C'), null, 50, 'loss', 'SMP-MV-6', 'Lofa')
on conflict (id) do update set quantity = excluded.quantity;

insert into public.warehouse_transfer_orders (id, transfer_code, warehouse_from, warehouse_to, inventory_item_id, sku_code, quantity, status,
                                              notes, requested_at, approved_at, dispatched_at, delivered_at, operator_label)
values
  (pg_temp.smp_id('SMP-TR-1'), 'SMP-TR-1', pg_temp.smp_id('SMP-WH-A'), pg_temp.smp_id('SMP-WH-B'), pg_temp.smp_id('SMP-ITEM-SEED'), 'SMP-SEED-RICE', 500, 'delivered',
   'Illustrative transfer.', now() - interval '12 days', now() - interval '11 days', now() - interval '10 days', now() - interval '8 days', 'Sample operator'),
  (pg_temp.smp_id('SMP-TR-2'), 'SMP-TR-2', pg_temp.smp_id('SMP-WH-B'), pg_temp.smp_id('SMP-WH-C'), pg_temp.smp_id('SMP-ITEM-UREA'), 'SMP-FERT-UREA', 300, 'in_transit',
   'Illustrative transfer.', now() - interval '4 days', now() - interval '3 days', now() - interval '2 days', null, 'Sample operator'),
  (pg_temp.smp_id('SMP-TR-3'), 'SMP-TR-3', pg_temp.smp_id('SMP-WH-C'), pg_temp.smp_id('SMP-WH-A'), pg_temp.smp_id('SMP-ITEM-NPK'), 'SMP-FERT-NPK', 150, 'requested',
   'Illustrative transfer.', now() - interval '1 day', null, null, null, 'Sample operator')
on conflict (id) do update set status = excluded.status;

-- Verification workflow and its recorded history -----------------------------------
insert into public.operational_submissions (id, reference_code, submission_type, title, summary, status, county, district, metadata)
select pg_temp.smp_id('SMP-SUB-' || lpad(n::text, 2, '0')), 'SMP-SUB-' || lpad(n::text, 2, '0'), 'farmer_registration',
       'Sample farmer ' || lpad(n::text, 2, '0') || ' · registration', 'Illustrative preview submission.',
       st::workflow_status, (array['Nimba', 'Bong', 'Lofa'])[1 + (n - 1) % 3], 'Sample district A',
       jsonb_build_object('illustrative', true)
from (values (1, 'submitted'), (2, 'dao_review'), (3, 'dao_approved'), (4, 'cac_review'),
             (5, 'cac_approved'), (6, 'ministry_review'), (7, 'ministry_approved'), (8, 'dao_corrections_requested')) as s(n, st)
on conflict (id) do update set status = excluded.status;

-- One history row per step reached; actors are labels, not accounts.
insert into public.workflow_actions (id, submission_id, action, from_status, to_status, county, note, metadata, created_at)
select pg_temp.smp_id('SMP-ACT-' || s.n || '-' || h.step), pg_temp.smp_id('SMP-SUB-' || lpad(s.n::text, 2, '0')),
       h.action, h.from_status::workflow_status, h.to_status::workflow_status,
       (array['Nimba', 'Bong', 'Lofa'])[1 + (s.n - 1) % 3], 'Illustrative history.',
       jsonb_build_object('actor_label', h.actor_label, 'illustrative', true),
       now() - make_interval(days => 20 - h.step * 2)
from (values (1), (2), (3), (4), (5), (6), (7), (8)) as s(n)
join lateral (
  select * from (values
    (1, 'submit', 'draft', 'submitted', 'Sample field officer', 1),
    (2, 'assign_reviewer', 'submitted', 'dao_review', 'Sample DAO reviewer', 2),
    (3, 'approve', 'dao_review', 'dao_approved', 'Sample DAO reviewer', 3),
    (4, 'assign_reviewer', 'dao_approved', 'cac_review', 'Sample county reviewer', 4),
    (5, 'approve', 'cac_review', 'cac_approved', 'Sample county reviewer', 5),
    (6, 'assign_reviewer', 'cac_approved', 'ministry_review', 'Sample national reviewer', 6),
    (7, 'approve', 'ministry_review', 'ministry_approved', 'Sample national reviewer', 7)
  ) as v(step, action, from_status, to_status, actor_label, reached_at)
  where v.reached_at <= case when s.n = 8 then 2 else s.n end
) h on true
on conflict (id) do nothing;

insert into public.workflow_actions (id, submission_id, action, from_status, to_status, county, note, metadata)
values (pg_temp.smp_id('SMP-ACT-8-corrections'), pg_temp.smp_id('SMP-SUB-08'), 'request_corrections', 'dao_review', 'dao_corrections_requested',
        'Nimba', 'Illustrative: plot outline incomplete.', jsonb_build_object('actor_label', 'Sample DAO reviewer', 'illustrative', true))
on conflict (id) do nothing;

commit;
