import { createAdminClient } from "@/lib/supabase/admin";
import { AdminClient } from "@/components/admin/AdminClient";
import type { CompanyStatus } from "@/types";

export default async function AdminPage() {
  // Sengaja pakai admin client (service role) di sini — halaman ini
  // memang butuh lihat SEMUA company lintas tenant, yang gak mungkin
  // kebaca lewat client biasa (RLS cuma ngasih company milik sendiri).
  // Aman karena akses ke halaman ini sendiri udah digate ketat di
  // admin/layout.tsx (cuma super admin yang bisa nyampe sini).
  const admin = createAdminClient();

  const { data: companies } = await admin
    .from("companies")
    .select(
      "id, name, slug, status, subscription_expires_at, created_at, company_users(count)",
    )
    .order("created_at", { ascending: false });

  // Ambil pemilik (owner) tiap company supaya bisa nampilin kolom Admin
  // seperti di apotek. Satu query buat semua owner, lalu dipetakan.
  const { data: owners } = await admin
    .from("company_users")
    .select("company_id, user_id")
    .eq("role", "owner");

  // Petakan user_id -> email lewat Admin Auth API (auth.users gak bisa
  // di-query langsung dari schema public).
  const { data: usersList } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const emailByUserId = new Map<string, string>(
    (usersList?.users ?? []).map((u) => [u.id, u.email ?? ""]),
  );
  const ownerEmailByCompany = new Map<string, string>();
  for (const o of owners ?? []) {
    if (!ownerEmailByCompany.has(o.company_id)) {
      ownerEmailByCompany.set(
        o.company_id,
        emailByUserId.get(o.user_id) ?? "",
      );
    }
  }

  // Kolom `status` di database bertipe `string` biasa (kita pakai
  // CHECK constraint di SQL, bukan enum asli Postgres), jadi perlu
  // di-cast ke union type yang lebih ketat di sini — nilainya udah
  // dijamin salah satu dari 3 itu oleh constraint di database.
  const typedCompanies = (companies ?? []).map((c) => ({
    ...c,
    status: c.status as CompanyStatus,
    admin_email: ownerEmailByCompany.get(c.id) ?? null,
  }));

  return <AdminClient companies={typedCompanies} />;
}
