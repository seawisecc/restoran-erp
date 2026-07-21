-- =========================================================
-- Seawise Enterprise Apps (Restaurants Edition)
-- Migration 0012: Nomor antrian & nama pelanggan (Take Away)
-- Jalankan di Supabase Dashboard > SQL Editor > New query
-- =========================================================

-- Nomor antrian hanya diisi untuk pesanan take away (table_id null).
-- Penomoran di-reset tiap hari, dihitung per outlet oleh aplikasi.
alter table public.orders
  add column if not exists queue_number integer;

-- Nama pelanggan opsional (untuk dipanggil saat pesanan siap).
alter table public.orders
  add column if not exists customer_name text;

-- Mempercepat pencarian nomor antrian terakhir hari ini per outlet.
create index if not exists orders_takeaway_queue_idx
  on public.orders (outlet_id, created_at desc)
  where table_id is null;
