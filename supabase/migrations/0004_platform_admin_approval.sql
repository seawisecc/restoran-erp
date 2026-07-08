-- =========================================================
-- RestoERP — Migration 0004: Approval company + Super Admin
-- Jalankan di Supabase Dashboard > SQL Editor > New query
-- =========================================================

-- ---------------------------------------------------------
-- 1. Status approval di tabel companies
--    Default 'approved' supaya company yang UDAH ADA (dibuat manual
--    lewat SQL sebelumnya) gak keblokir. Company baru dari signup
--    form akan di-insert eksplisit dengan status 'pending'.
-- ---------------------------------------------------------
alter table public.companies
  add column status text not null default 'approved'
  check (status in ('pending', 'approved', 'rejected'));

-- ---------------------------------------------------------
-- 2. Tabel platform_admins — daftar user yang jadi Super Admin
--    (bisa approve company baru & lihat semua resto).
--    TIDAK ADA cara di aplikasi buat orang naikin dirinya sendiri
--    jadi admin — baris di sini cuma bisa ditambah manual lewat
--    SQL Editor oleh lo sendiri. Ini demi keamanan.
-- ---------------------------------------------------------
create table public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

-- User cuma boleh lihat baris dirinya sendiri (buat ngecek "apakah
-- gw admin?"). Insert/update/delete sengaja TIDAK dikasih policy
-- sama sekali — jadi cuma bisa dilakukan lewat service role (admin
-- client) atau langsung dari SQL Editor.
create policy "select_own_admin_row"
  on public.platform_admins for select
  using (user_id = auth.uid());
