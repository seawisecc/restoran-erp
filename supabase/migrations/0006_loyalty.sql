-- =========================================================
-- RestoERP — Migration 0006: Loyalty Poin
-- Jalankan di Supabase Dashboard > SQL Editor > New query
-- =========================================================

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  phone text not null,
  name text,
  points int not null default 0,
  created_at timestamptz not null default now(),
  unique (company_id, phone)
);

alter table public.orders
  add column customer_id uuid references public.customers (id) on delete set null,
  add column discount_amount numeric(12, 2) not null default 0,
  add column points_earned int not null default 0,
  add column points_redeemed int not null default 0;

create index on public.customers (company_id);
create index on public.orders (customer_id);

alter table public.customers enable row level security;

create policy "tenant_isolation_customers"
  on public.customers for all
  using (company_id in (select public.get_my_company_ids()))
  with check (company_id in (select public.get_my_company_ids()));
