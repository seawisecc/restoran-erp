import { createAdminClient } from "@/lib/supabase/admin";
import { AdminClient } from "@/components/admin/AdminClient";

export default async function AdminPage() {
  // Sengaja pakai admin client (service role) di sini — halaman ini
  // memang butuh lihat SEMUA company lintas tenant, yang gak mungkin
  // kebaca lewat client biasa (RLS cuma ngasih company milik sendiri).
  // Aman karena akses ke halaman ini sendiri udah digate ketat di
  // admin/layout.tsx (cuma super admin yang bisa nyampe sini).
  const admin = createAdminClient() as any;

  const { data: companies } = await admin
    .from("companies")
    .select(
      "id, name, slug, status, subscription_expires_at, created_at, company_users(count)",
    )
    .order("created_at", { ascending: false });

  return <AdminClient companies={companies ?? []} />;
}
