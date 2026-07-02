import { ChevronDown } from "lucide-react";

export function Topbar({
  companyName,
  userEmail,
}: {
  companyName: string;
  userEmail: string;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-border bg-surface-card px-4 md:px-6">
      {/* Company switcher — dropdown isinya company yg user itu punya akses */}
      <button className="flex items-center gap-2 rounded-lg border border-surface-border px-3 py-1.5 text-sm font-medium hover:bg-surface">
        {companyName}
        <ChevronDown size={14} className="text-ink-muted" />
      </button>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-ink-muted sm:inline">
          {userEmail}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
          {userEmail.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
