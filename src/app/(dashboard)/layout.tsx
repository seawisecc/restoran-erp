import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompanyProvider } from "@/components/providers/CompanyProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
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

  // Narik company pertama yang user itu punya akses. Nanti bisa
  // dikembangkan jadi "company terakhir dipilih" pakai cookie.
  const { data: membership } = await supabase
    .from("company_users")
    .select(
      "role, companies(id, name, slug, status, subscription_expires_at, created_at)",
    )
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle<MembershipQueryResult>();

  if (!membership || !membership.companies) {
    // User login tapi belum terhubung ke company manapun.
    redirect("/login");
  }

  const activeCompany: ActiveCompanyContext = {
    company: membership.companies,
    role: membership.role,
  };

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
