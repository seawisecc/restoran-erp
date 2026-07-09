import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { CompanySwitcher } from "./CompanySwitcher";
import { UserMenu } from "./UserMenu";

type CompanyOption = { id: string; name: string };

export function Topbar({
  companyName,
  companies,
  activeCompanyId,
  userEmail,
  isSuperAdmin,
}: {
  companyName: string;
  companies: CompanyOption[];
  activeCompanyId: string;
  userEmail: string;
  isSuperAdmin?: boolean;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-border bg-surface-card px-4 md:px-6">
      <CompanySwitcher
        companies={companies}
        activeCompanyId={activeCompanyId}
        activeName={companyName}
      />

      <div className="flex items-center gap-3">
        {isSuperAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink"
          >
            <ShieldCheck size={14} /> Admin Panel
          </Link>
        )}
        <span className="hidden text-sm text-ink-muted sm:inline">
          {userEmail}
        </span>
        <UserMenu email={userEmail} />
      </div>
    </header>
  );
}
