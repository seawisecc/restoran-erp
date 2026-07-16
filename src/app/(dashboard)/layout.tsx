import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompanyProvider } from "@/components/providers/CompanyProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { ACTIVE_COMPANY_COOKIE } from "@/lib/constants";
import type { ActiveCompanyContext } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Tipe hasil query join ditulis eksplisit di sini karena Supabase
  // client kesulitan infer tipe field embed (companies(...)) dari
  // hand-written Database types yang belum punya metadata relationship.
  type MembershipQueryResult = {
    role: ActiveCompanyContext["role"];
    companies: ActiveCompanyContext["company"] | null;
  };

  // Narik SEMUA company yang user ini punya akses (bisa lebih dari 1,
  // misal konsultan/investor yang pegang beberapa resto).
  // CATATAN: query ini sengaja TIDAK menyertakan kolom `modules` supaya
  // jalur auth utama gak tergantung pada migrasi user-management. Modul
  // diambil terpisah & defensif di bawah.
  const { data: memberships } = await supabase
    .from("company_users")
    .select(
      "role, companies(id, name, slug, status, subscription_expires_at, loyalty_earn_rate, loyalty_redeem_rate, created_at)",
    )
    .eq("user_id", user.id)
    .returns<MembershipQueryResult[]>();

  const validMemberships = (memberships ?? []).filter((m) => m.companies);

  if (validMemberships.length === 0) {
    // User login tapi belum terhubung ke company manapun.
    redirect("/login");
  }

  // Company aktif ditentukan dari cookie (kalau user pernah switch
  // sebelumnya dan cookie-nya masih valid buat salah satu company
  // yang dia punya akses). Kalau enggak, default ke yang pertama.
  const cookieStore = await cookies();
  const preferredCompanyId = cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value;
  const activeMembership =
    validMemberships.find((m) => m.companies!.id === preferredCompanyId) ??
    validMemberships[0];

  // Ambil modul akses user untuk company aktif secara DEFENSIF: kalau
  // kolom `modules` belum ada (migrasi 0009 belum dijalankan) atau
  // query gagal, default ke null = akses penuh, biar aplikasi tetap
  // jalan dan gak ngunci siapa pun.
  let userModules: string[] | null = null;
  if (activeMembership.role !== "owner") {
    const { data: modRow, error: modError } = await supabase
      .from("company_users")
      .select("modules")
      .eq("user_id", user.id)
      .eq("company_id", activeMembership.companies!.id)
      .maybeSingle();
    if (!modError) {
      userModules = modRow?.modules ?? null;
    }
  }

  // Setting pajak & service diambil DEFENSIF juga: kalau kolom belum
  // ada (migrasi 0010 belum jalan), pakai default lama (pajak 10%,
  // tanpa service) supaya transaksi tetap jalan normal.
  const charge = {
    tax_enabled: true,
    tax_rate: 10,
    service_enabled: false,
    service_rate: 0,
  };
  const { data: chargeRow, error: chargeError } = await supabase
    .from("companies")
    .select("tax_enabled, tax_rate, service_enabled, service_rate")
    .eq("id", activeMembership.companies!.id)
    .maybeSingle();
  if (!chargeError && chargeRow) {
    charge.tax_enabled = chargeRow.tax_enabled ?? true;
    charge.tax_rate = Number(chargeRow.tax_rate ?? 10);
    charge.service_enabled = chargeRow.service_enabled ?? false;
    charge.service_rate = Number(chargeRow.service_rate ?? 0);
  }

  const activeCompany: ActiveCompanyContext = {
    company: { ...activeMembership.companies!, ...charge },
    role: activeMembership.role,
    // Owner selalu akses penuh (modules null).
    modules: userModules,
  };

  const companyOptions = validMemberships.map((m) => ({
    id: m.companies!.id,
    name: m.companies!.name,
  }));

  // Cek apakah user ini terdaftar sebagai Super Admin (buat nampilin
  // link ke /admin di Topbar). Ini query aman dilakukan pakai client
  // biasa karena ada RLS policy "select_own_admin_row".
  const { data: adminRow } = await supabase
    .from("platform_admins")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const isSuperAdmin = Boolean(adminRow);

  // Company belum di-approve super admin — blokir akses ke dashboard,
  // tampilin layar tunggu/ditolak, bukan langsung nendang ke /login
  // (biar user ngerti kenapa dan gak keliru dikira error).
  if (activeCompany.company.status !== "approved") {
    const isPending = activeCompany.company.status === "pending";
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="card w-full max-w-sm p-8 text-center">
          <h1 className="mb-2 text-xl font-bold text-ink">
            {isPending ? "Menunggu Persetujuan" : "Akun Ditolak"}
          </h1>
          <p className="text-sm text-ink-muted">
            {isPending
              ? `Akun restoran "${activeCompany.company.name}" sedang menunggu persetujuan admin. Silakan cek kembali nanti.`
              : `Pendaftaran restoran "${activeCompany.company.name}" tidak disetujui. Hubungi admin untuk info lebih lanjut.`}
          </p>
          <Link href="/login" className="btn-primary mt-6 block">
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  // Company approved tapi masa aktif langganannya udah lewat —
  // blokir juga, tapi kasih pesan yang beda biar jelas ini soal
  // pembayaran/perpanjangan, bukan soal approval.
  const expiresAt = activeCompany.company.subscription_expires_at;
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  if (isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="card w-full max-w-sm p-8 text-center">
          <h1 className="mb-2 text-xl font-bold text-ink">Langganan Berakhir</h1>
          <p className="text-sm text-ink-muted">
            Masa aktif langganan restoran &ldquo;{activeCompany.company.name}
            &rdquo; sudah berakhir. Hubungi admin untuk perpanjangan.
          </p>
          <Link href="/login" className="btn-primary mt-6 block">
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CompanyProvider value={activeCompany}>
      <div className="flex min-h-screen bg-surface">
        <Sidebar />
        <div className="flex flex-1 flex-col pb-16 md:pb-0">
          <Topbar
            companyName={activeCompany.company.name}
            companies={companyOptions}
            activeCompanyId={activeCompany.company.id}
            userEmail={user.email ?? ""}
            isSuperAdmin={isSuperAdmin}
          />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
        <MobileNav />
      </div>
    </CompanyProvider>
  );
}
