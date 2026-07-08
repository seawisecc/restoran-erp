-- =========================================================
-- RestoERP — Migration 0005: Masa aktif langganan (subscription)
-- Jalankan di Supabase Dashboard > SQL Editor > New query
-- =========================================================

alter table public.companies
  add column subscription_expires_at timestamptz;

-- Company yang UDAH ADA sebelumnya (dibuat manual / demo) dikasih
-- masa aktif 1 tahun dari sekarang, biar gak keblokir tiba-tiba.
update public.companies
set subscription_expires_at = now() + interval '365 days'
where subscription_expires_at is null;
