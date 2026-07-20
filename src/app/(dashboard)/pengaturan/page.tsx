import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveCompanyId } from "@/lib/get-active-company";
import { PengaturanClient } from "@/components/pengaturan/PengaturanClient";

export default async function PengaturanPage() {
  const supabase = await createClient();
  const companyId = await getActiveCompanyId();

  const [
    { data: outlets },
    { data: tables },
    { data: company },
    { data: paperRow, error: paperError },
  ] = await Promise.all([
      supabase
        .from("outlets")
        .select("id, name, address, is_active")
        .eq("company_id", companyId)
        .order("name"),
      supabase
        .from("restaurant_tables")
        .select("id, name, seats, outlets(name)")
        .eq("company_id", companyId)
        .order("name"),
      supabase
        .from("companies")
        .select("name, address")
        .eq("id", companyId)
        .maybeSingle(),
      // Query terpisah & defensif: kalau migrasi 0011 belum dijalankan,
      // error-nya gak ikut menggagalkan query profil di atas.
      supabase
        .from("companies")
        .select("receipt_paper")
        .eq("id", companyId)
        .maybeSingle(),
    ]);

  const receiptPaper =
    !paperError && paperRow?.receipt_paper ? paperRow.receipt_paper : "80mm";

  // Daftar anggota tim + email-nya (email diambil via Admin Auth API,
  // karena auth.users gak bisa di-query langsung dari schema public).
  const admin = createAdminClient();
  const { data: members } = await admin
    .from("company_users")
    .select("id, user_id, role, full_name, modules, is_active")
    .eq("company_id", companyId);

  const { data: usersList } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const emailByUserId = new Map<string, string>(
    (usersList?.users ?? []).map((u) => [u.id, u.email ?? ""]),
  );

  const team = (members ?? []).map((m) => ({
    id: m.id,
    email: emailByUserId.get(m.user_id) ?? "",
    full_name: m.full_name ?? null,
    role: m.role as "owner" | "manager" | "kasir" | "staff",
    modules: (m.modules as string[] | null) ?? null,
    is_active: m.is_active ?? true,
  }));

  return (
    <PengaturanClient
      outlets={outlets ?? []}
      tables={tables ?? []}
      company={{
        name: company?.name ?? "",
        address: company?.address ?? null,
      }}
      team={team}
      receiptPaper={receiptPaper}
    />
  );
}
