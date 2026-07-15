import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: adminRow } = await supabase
    .from("platform_admins")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Bukan super admin — gak boleh masuk sama sekali, balikin ke
  // dashboard tenant biasa.
  if (!adminRow) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-surface">
      <header className="flex h-16 items-center justify-between border-b border-surface-border bg-sidebar px-6">
        <div className="flex items-center gap-2 text-sidebar-foreground">
          <ShieldCheck size={18} />
          <span className="font-bold">Seawise Enterprise Apps — Admin Panel</span>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-sidebar-muted hover:text-sidebar-foreground"
        >
          &larr; Kembali ke Dashboard
        </Link>
      </header>
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
