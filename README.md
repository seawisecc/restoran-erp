# RestoERP

Sistem manajemen restoran multi-tenant — POS, inventory, purchasing, laporan.
Dibangun dengan Next.js (App Router) + Supabase + Vercel.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** — Auth, Postgres, Realtime, Storage
- **Tailwind CSS** — styling
- **Vercel** — hosting & CI/CD dari GitHub

## Struktur folder

```
restoran-erp/
├── middleware.ts              # refresh session Supabase + proteksi route
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # halaman login (public)
│   │   ├── (dashboard)/       # halaman yang butuh login + company aktif
│   │   │   ├── dashboard/
│   │   │   ├── produk-stok/   # menu & stok
│   │   │   ├── transaksi/     # kasir / POS
│   │   │   ├── pembelian/     # PO, goods receipt, invoice supplier
│   │   │   ├── supplier/
│   │   │   ├── laporan/
│   │   │   └── pengaturan/
│   │   └── api/                # route handlers (server-only)
│   ├── components/
│   │   ├── layout/             # Sidebar, Topbar, MobileNav
│   │   ├── providers/          # CompanyProvider (context company aktif)
│   │   └── ui/                 # komponen kecil reusable (button, badge, dst)
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts       # dipakai di Client Component
│   │       ├── server.ts       # dipakai di Server Component / Server Action
│   │       ├── admin.ts        # service role — server-only, bypass RLS
│   │       └── middleware.ts   # helper refresh session
│   └── types/                  # tipe domain (Company, CompanyUser, dst)
└── supabase/
    └── migrations/              # SQL migration skema database
```

## Setup lokal

1. Install dependencies:
   ```bash
   npm install
   ```

2. Bikin project di [supabase.com](https://supabase.com) (gratis buat mulai).

3. Copy `.env.local.example` jadi `.env.local`, isi 3 value dari
   **Project Settings > API** di dashboard Supabase.

4. Jalankan dev server:
   ```bash
   npm run dev
   ```
   Buka http://localhost:3000

## Model multi-tenant

Satu Supabase project dipakai bersama oleh semua tenant (company/restoran).
Isolasi data dijamin lewat:

- Kolom `company_id` di semua tabel operasional
- **Row Level Security (RLS)** policy di Postgres — user cuma bisa baca/tulis
  baris yang company_id-nya sesuai company yang dia punya akses (lewat tabel
  `company_users`)
- Ini jadi tugas step berikutnya: bikin migration SQL untuk tabel inti +
  RLS policy-nya.

## Deploy

- Push ke GitHub → connect repo ke [Vercel](https://vercel.com) → set
  environment variables yang sama seperti `.env.local` di project settings
  Vercel → auto-deploy tiap push ke `main`, preview deployment tiap PR.
