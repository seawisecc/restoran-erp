-- =========================================================
-- Seawise Enterprise Apps (Restaurants Edition)
-- Migration 0013: Konfirmasi serah terima pesanan (take away)
-- Jalankan di Supabase Dashboard > SQL Editor > New query
-- =========================================================

-- Diisi saat dapur menekan "Diserahkan" di Kitchen Display.
-- Dibedakan dari kds_status item: masakan bisa "siap" tapi belum
-- tentu sudah diambil pelanggan.
alter table public.orders
  add column if not exists served_at timestamptz;
