-- =========================================================
-- RestoERP — Migration 0003: Pembelian (supplier, bahan baku, PO)
-- Jalankan di Supabase Dashboard > SQL Editor > New query
-- =========================================================

create type public.purchase_status as enum ('pending', 'received', 'cancelled');

-- ---------------------------------------------------------
-- Supplier
-- ---------------------------------------------------------
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  contact_person text,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Bahan baku (stok gudang, beda dari menu_items yang dijual
-- ke pelanggan)
-- ---------------------------------------------------------
create table public.raw_materials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  unit text not null default 'pcs',
  stock_qty numeric(12, 2) not null default 0,
  min_stock numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Purchase order (pembelian ke supplier)
-- ---------------------------------------------------------
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  supplier_id uuid references public.suppliers (id) on delete set null,
  status public.purchase_status not null default 'pending',
  total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  received_at timestamptz
);

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  raw_material_id uuid references public.raw_materials (id) on delete set null,
  name text not null,
  qty numeric(12, 2) not null default 1,
  price numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index on public.suppliers (company_id);
create index on public.raw_materials (company_id);
create index on public.purchases (company_id);
create index on public.purchases (supplier_id);
create index on public.purchase_items (purchase_id);
create index on public.purchase_items (raw_material_id);

-- ---------------------------------------------------------
-- RLS
-- ---------------------------------------------------------
alter table public.suppliers enable row level security;
alter table public.raw_materials enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;

create policy "tenant_isolation_suppliers"
  on public.suppliers for all
  using (company_id in (select public.get_my_company_ids()))
  with check (company_id in (select public.get_my_company_ids()));

create policy "tenant_isolation_raw_materials"
  on public.raw_materials for all
  using (company_id in (select public.get_my_company_ids()))
  with check (company_id in (select public.get_my_company_ids()));

create policy "tenant_isolation_purchases"
  on public.purchases for all
  using (company_id in (select public.get_my_company_ids()))
  with check (company_id in (select public.get_my_company_ids()));

create policy "tenant_isolation_purchase_items"
  on public.purchase_items for all
  using (
    purchase_id in (
      select id from public.purchases
      where company_id in (select public.get_my_company_ids())
    )
  )
  with check (
    purchase_id in (
      select id from public.purchases
      where company_id in (select public.get_my_company_ids())
    )
  );
