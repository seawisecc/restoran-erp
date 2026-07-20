-- =========================================================
-- Seawise Enterprise Apps (Restaurants Edition)
-- Migration 0011: Ukuran kertas nota (printer struk)
-- Jalankan di Supabase Dashboard > SQL Editor > New query
-- =========================================================

-- Nilai yang dikenali aplikasi: '58mm', '80mm', 'a4'.
-- Default '80mm' — ukuran printer thermal kasir paling umum.
alter table public.companies
  add column if not exists receipt_paper text not null default '80mm';
