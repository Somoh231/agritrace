-- Operational transfer workflow orders (TRF-* codes) — complements inventory_movements ledger.

create table if not exists warehouse_transfer_orders (
  id uuid primary key default gen_random_uuid(),
  transfer_code text not null unique,
  warehouse_from uuid references warehouses (id),
  warehouse_to uuid references warehouses (id),
  inventory_item_id uuid references inventory_items (id),
  sku_code text,
  quantity numeric(14, 2) not null check (quantity > 0),
  status text not null
    check (
      status in (
        'requested',
        'approved',
        'dispatched',
        'in_transit',
        'delivered',
        'completed',
        'disputed'
      )
    ),
  notes text,
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  completed_at timestamptz,
  requested_by uuid references profiles (id),
  operator_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_wto_from on warehouse_transfer_orders (warehouse_from);
create index if not exists idx_wto_to on warehouse_transfer_orders (warehouse_to);
create index if not exists idx_wto_status on warehouse_transfer_orders (status);

alter table warehouse_transfer_orders enable row level security;

drop policy if exists warehouse_transfer_orders_select on warehouse_transfer_orders;
create policy warehouse_transfer_orders_select on warehouse_transfer_orders for select to authenticated using (true);

drop policy if exists warehouse_transfer_orders_write on warehouse_transfer_orders;
create policy warehouse_transfer_orders_write on warehouse_transfer_orders for all to authenticated using (
  public.profile_role() in (
    'super_admin',
    'admin',
    'ministry_officer',
    'government_officer',
    'warehouse_manager',
    'county_officer',
    'district_officer'
  )
) with check (
  public.profile_role() in (
    'super_admin',
    'admin',
    'ministry_officer',
    'government_officer',
    'warehouse_manager',
    'county_officer',
    'district_officer'
  )
);
