-- =========================================================
-- Seawise Enterprise Apps (Restaurants Edition)
-- Migration 0009: Manajemen Pengguna berbasis modul
-- Jalankan di Supabase Dashboard > SQL Editor > New query
-- =========================================================

-- ---------------------------------------------------------
-- 1. Kolom tambahan di company_users
--    - full_name : nama tampilan anggota tim (biar gak cuma email)
--    - modules   : daftar modul yang boleh diakses user ini.
--                  NULL / kosong = akses penuh (dipakai untuk owner).
--    - is_active : bisa dipakai untuk menonaktifkan akun tanpa hapus.
--    Semua pakai IF NOT EXISTS supaya aman dijalankan ulang.
-- ---------------------------------------------------------
alter table public.company_users
  add column if not exists full_name text;

alter table public.company_users
  add column if not exists modules text[];

alter table public.company_users
  add column if not exists is_active boolean not null default true;

-- ---------------------------------------------------------
-- 1b. Kolom alamat untuk Profil Resto (companies).
-- ---------------------------------------------------------
alter table public.companies
  add column if not exists address text;

-- ---------------------------------------------------------
-- 2. Owner selalu akses penuh — set modules NULL untuk owner lama
--    (NULL diperlakukan sebagai "semua modul" oleh aplikasi).
-- ---------------------------------------------------------
update public.company_users
  set modules = null
  where role = 'owner';

-- ---------------------------------------------------------
-- Catatan modul yang dikenali aplikasi (untuk referensi):
--   dashboard, produk-stok, transaksi, dapur, pelanggan,
--   pembelian, supplier, laporan, pengaturan
-- ---------------------------------------------------------
