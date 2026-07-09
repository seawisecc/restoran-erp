-- =========================================================
-- RestoERP — Migration 0007: Konfigurasi rate Loyalty poin
-- Jalankan di Supabase Dashboard > SQL Editor > New query
-- =========================================================

alter table public.companies
  add column loyalty_earn_rate numeric(12, 2) not null default 10000,
  add column loyalty_redeem_rate numeric(12, 2) not null default 100;

comment on column public.companies.loyalty_earn_rate is
  'Rupiah belanja yang setara dengan 1 poin didapat. Default: Rp10.000 = 1 poin.';
comment on column public.companies.loyalty_redeem_rate is
  'Nilai diskon (Rupiah) untuk tiap 1 poin yang ditukar. Default: 1 poin = Rp100.';
