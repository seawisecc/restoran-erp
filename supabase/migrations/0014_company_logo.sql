-- =========================================================
-- Seawise Enterprise Apps (Restaurants Edition)
-- Migration 0014: Logo usaha (untuk dicetak di kepala nota)
-- Jalankan di Supabase Dashboard > SQL Editor > New query
-- =========================================================

-- 1. Kolom URL logo di companies.
alter table public.companies
  add column if not exists logo_url text;

-- 2. Bucket penyimpanan file logo. Public supaya gampang dicetak di
--    nota (URL bisa langsung dipakai di <img>).
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- 3. Policy akses bucket:
--    - Siapa pun boleh MELIHAT (read) — perlu supaya logo tampil di nota.
--    - Hanya user yang sudah login boleh mengunggah/mengubah/menghapus.
--    (File di-scope per company lewat nama folder oleh aplikasi.)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'logos_public_read'
  ) then
    create policy "logos_public_read"
      on storage.objects for select
      using (bucket_id = 'logos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'logos_auth_insert'
  ) then
    create policy "logos_auth_insert"
      on storage.objects for insert to authenticated
      with check (bucket_id = 'logos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'logos_auth_update'
  ) then
    create policy "logos_auth_update"
      on storage.objects for update to authenticated
      using (bucket_id = 'logos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'logos_auth_delete'
  ) then
    create policy "logos_auth_delete"
      on storage.objects for delete to authenticated
      using (bucket_id = 'logos');
  end if;
end $$;
