-- =========================================================
-- RestoERP — Migration 0002: POS (meja, transaksi, item transaksi)
-- Jalankan di Supabase Dashboard > SQL Editor > New query
-- =========================================================

create type public.order_status as enum ('open', 'paid', 'cancelled');

-- ---------------------------------------------------------
-- Meja
-- ---------------------------------------------------------
create table public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  outlet_id uuid not null references public.outlets (id) on delete cascade,
  name text not null,
  seats int not null default 4,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Orders (satu order = satu sesi meja, dari buka sampai bayar)
-- ---------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  outlet_id uuid not null references public.outlets (id) on delete cascade,
  table_id uuid references public.restaurant_tables (id) on delete set null,
  status public.order_status not null default 'open',
  subtotal numeric(12, 2) not null default 0,
  tax numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- ---------------------------------------------------------
-- Item di dalam satu order
-- Nama & harga di-snapshot di sini (bukan cuma referensi ke
-- menu_items) supaya histori transaksi lama gak berubah kalau
-- menu-nya di-edit/dihapus di kemudian hari.
-- ---------------------------------------------------------
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  name text not null,
  price numeric(12, 2) not null,
  qty int not null default 1,
  created_at timestamptz not null default now()
);

create index on public.restaurant_tables (company_id);
create index on public.orders (company_id);
create index on public.orders (table_id);
create index on public.orders (status);
create index on public.order_items (order_id);

-- ---------------------------------------------------------
-- RLS
-- ---------------------------------------------------------
alter table public.restaurant_tables enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "tenant_isolation_restaurant_tables"
  on public.restaurant_tables for all
  using (company_id in (select public.get_my_company_ids()))
  with check (company_id in (select public.get_my_company_ids()));

create policy "tenant_isolation_orders"
  on public.orders for all
  using (company_id in (select public.get_my_company_ids()))
  with check (company_id in (select public.get_my_company_ids()));

-- order_items gak punya company_id langsung, jadi ceknya lewat
-- order induknya.
create policy "tenant_isolation_order_items"
  on public.order_items for all
  using (
    order_id in (
      select id from public.orders
      where company_id in (select public.get_my_company_ids())
    )
  )
  with check (
    order_id in (
      select id from public.orders
      where company_id in (select public.get_my_company_ids())
    )
  );
