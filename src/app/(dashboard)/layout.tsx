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

  // Catatan: begitu tabel `company_users` + `companies` sudah dibuat
  // (lihat step berikutnya: skema DB multi-tenant), query di bawah ini
  // narik company pertama yang user itu punya akses. Nanti bisa
  // dikembangkan jadi "company terakhir dipilih" pakai cookie.
  const { data: membership } = await supabase
    .from("company_users")
    .select("role, companies(id, name, slug, created_at)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership || !membership.companies) {
    // User login tapi belum terhubung ke company manapun.
    redirect("/login");
  }

  const activeCompany: ActiveCompanyContext = {
    company: membership.companies as unknown as ActiveCompanyContext["company"],
    role: membership.role as ActiveCompanyContext["role"],
  };

  return (
    <CompanyProvider value={activeCompany}>
      <div className="flex min-h-screen bg-surface">
        <Sidebar />
        <div className="flex flex-1 flex-col pb-16 md:pb-0">
          <Topbar
            companyName={activeCompany.company.name}
            userEmail={user.email ?? ""}
          />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
        <MobileNav />
      </div>
    </CompanyProvider>
  );
}
