-- =========================================================
-- Seawise Enterprise Apps (Restaurants Edition)
-- Migration 0010: Pajak & Service charge per company
-- Jalankan di Supabase Dashboard > SQL Editor > New query
-- =========================================================

-- ---------------------------------------------------------
-- 1. Pengaturan biaya di tabel companies.
--    Default menjaga perilaku lama: pajak 10% aktif, service off.
--    tax_rate / service_rate disimpan dalam PERSEN (mis. 10 = 10%).
-- ---------------------------------------------------------
alter table public.companies
  add column if not exists tax_enabled boolean not null default true;

alter table public.companies
  add column if not exists tax_rate numeric not null default 10;

alter table public.companies
  add column if not exists service_enabled boolean not null default false;

alter table public.companies
  add column if not exists service_rate numeric not null default 0;

-- ---------------------------------------------------------
-- 2. Kolom service (nominal) di tabel orders untuk itemisasi struk.
-- ---------------------------------------------------------
alter table public.orders
  add column if not exists service numeric not null default 0;
