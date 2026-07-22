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
    { data: chargeRow, error: chargeError },
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
      // Pajak & service diambil DI SINI (bukan dari context layout),
      // supaya setelah disimpan nilainya langsung ikut ter-refresh.
      supabase
        .from("companies")
        .select("tax_enabled, tax_rate, service_enabled, service_rate")
        .eq("id", companyId)
        .maybeSingle(),
    ]);

  const receiptPaper =
    !paperError && paperRow?.receipt_paper ? paperRow.receipt_paper : "80mm";

  // Logo diambil defensif: kalau migrasi 0014 belum jalan, cukup null.
  const { data: logoRow, error: logoError } = await supabase
    .from("companies")
    .select("logo_url")
    .eq("id", companyId)
    .maybeSingle();
  const logoUrl = !logoError ? (logoRow?.logo_url ?? null) : null;

  // Kalau kolomnya belum ada (migrasi 0010 belum jalan), tandai supaya
  // UI bisa kasih tahu penyebabnya — bukan gagal diam-diam.
  const chargeReady = !chargeError && Boolean(chargeRow);
  const charges = {
    tax_enabled: chargeRow?.tax_enabled ?? true,
    tax_rate: Number(chargeRow?.tax_rate ?? 10),
    service_enabled: chargeRow?.service_enabled ?? false,
    service_rate: Number(chargeRow?.service_rate ?? 0),
  };

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
        logo_url: logoUrl,
      }}
      team={team}
      receiptPaper={receiptPaper}
      charges={charges}
      chargeReady={chargeReady}
    />
  );
}
