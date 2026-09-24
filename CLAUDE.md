# CLAUDE.md

Konteks proyek ada di `README.md`. File ini cuma berisi aturan yang gak kelihatan dari kode.

## Migration Supabase (`supabase/migrations/`)

- Migration dijalankan **manual** lewat Supabase Dashboard > SQL Editor, bukan `supabase db push`.
  Nomor file berurutan (`00NN_nama.sql`); `0001` (companies, outlets, menu_items, dst) gak ada di repo
  karena dulu dibikin langsung di dashboard.
- **Setiap `create table public.xxx` WAJIB diikuti GRANT di migration yang sama.** Sejak 30 Okt 2026
  Supabase gak otomatis grant tabel baru ke Data API; tanpa grant, API balikin `permission denied`.
  Taruh setelah `enable row level security`:

  ```sql
  alter table public.xxx enable row level security;

  grant select, insert, update, delete on public.xxx to authenticated;
  grant select, insert, update, delete on public.xxx to service_role;
  ```

  - **Jangan grant ke `anon`** kecuali memang ada akses publik langsung. Akses publik (QR order di
    `src/app/o/[tableId]/`) lewat admin client (service role).
  - Tabel yang cuma boleh dibaca user (contoh `platform_admins`): `authenticated` cukup `select`.
- Setiap tabel tenant wajib RLS + policy `tenant_isolation_<tabel>` pakai
  `company_id in (select public.get_my_company_ids())`. Tabel anak tanpa `company_id` dicek lewat tabel induknya
  (lihat `order_items` di `0002`).

## Supabase client

- `src/lib/supabase/admin.ts` pakai service role (bypass RLS). Pakai cuma di server, dan jangan pernah
  expose `SUPABASE_SERVICE_ROLE_KEY` dengan prefix `NEXT_PUBLIC_`.

## Deploy

- Push ke `main` = deploy production otomatis di Vercel. Commit/push cuma kalau diminta.
- Git push pakai kredensial `gh` CLI (akun `seawisecc`). Kalau auth gagal: `gh auth login --web`, lalu `gh auth setup-git`.
