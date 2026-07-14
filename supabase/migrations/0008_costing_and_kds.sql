-- =========================================================
-- RestoERP — Migration 0008: Costing (resep & HPP) + KDS
-- Jalankan di Supabase Dashboard > SQL Editor > New query
-- =========================================================

-- ---------------------------------------------------------
-- 1. Costing: harga rata-rata bahan baku
--    Di-update otomatis (weighted average) tiap kali PO diterima,
--    biar HPP selalu ngikutin harga beli terbaru.
-- ---------------------------------------------------------
alter table public.raw_materials
  add column cost_price numeric(12, 2) not null default 0;

comment on column public.raw_materials.cost_price is
  'Harga rata-rata (weighted average) per satuan, di-update otomatis
   tiap kali pembelian bahan ini diterima.';

-- ---------------------------------------------------------
-- 2. Resep — bahan baku apa aja & berapa takaran buat bikin
--    1 porsi menu tertentu. Ini dasar hitungan HPP.
-- ---------------------------------------------------------
create table public.menu_item_recipes (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  raw_material_id uuid not null references public.raw_materials (id) on delete cascade,
  qty_used numeric(12, 4) not null default 0,
  created_at timestamptz not null default now(),
  unique (menu_item_id, raw_material_id)
);

create index on public.menu_item_recipes (menu_item_id);
create index on public.menu_item_recipes (raw_material_id);

alter table public.menu_item_recipes enable row level security;

-- Scoping-nya lewat menu_items (gak ada company_id langsung di sini)
create policy "tenant_isolation_menu_item_recipes"
  on public.menu_item_recipes for all
  using (
    menu_item_id in (
      select id from public.menu_items
      where company_id in (select public.get_my_company_ids())
    )
  )
  with check (
    menu_item_id in (
      select id from public.menu_items
      where company_id in (select public.get_my_company_ids())
    )
  );

-- ---------------------------------------------------------
-- 3. KDS — status tiap item pesanan buat dilacak dapur
-- ---------------------------------------------------------
create type public.kds_status as enum ('queued', 'preparing', 'ready');

alter table public.order_items
  add column kds_status public.kds_status not null default 'queued';

-- ---------------------------------------------------------
-- 4. Aktifin Realtime buat order_items & orders, biar layar
--    dapur bisa update otomatis tanpa refresh manual.
-- ---------------------------------------------------------
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.orders;
