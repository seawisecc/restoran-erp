-- =========================================================
-- RestoERP — Seed meja untuk testing POS
-- Jalankan SETELAH migration 0002
-- =========================================================

with o as (
  select id from public.outlets
  where company_id = (select id from public.companies where slug = 'resto-contoh')
  limit 1
)
insert into public.restaurant_tables (company_id, outlet_id, name, seats)
select
  (select id from public.companies where slug = 'resto-contoh'),
  o.id,
  'Meja ' || n,
  4
from o, generate_series(1, 12) as n;
