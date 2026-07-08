import Link from "next/link";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { UserMenu } from "./UserMenu";

export function Topbar({
  companyName,
  userEmail,
  isSuperAdmin,
}: {
  companyName: string;
  userEmail: string;
  isSuperAdmin?: boolean;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-border bg-surface-card px-4 md:px-6">
      {/* Company switcher — dropdown isinya company yg user itu punya akses */}
      <button className="flex items-center gap-2 rounded-lg border border-surface-border px-3 py-1.5 text-sm font-medium hover:bg-surface">
        {companyName}
        <ChevronDown size={14} className="text-ink-muted" />
      </button>

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
