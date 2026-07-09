"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown } from "lucide-react";
import { switchCompany } from "@/app/(dashboard)/actions";

type CompanyOption = { id: string; name: string };

export function CompanySwitcher({
  companies,
  activeCompanyId,
  activeName,
}: {
  companies: CompanyOption[];
  activeCompanyId: string;
  activeName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Kalau user cuma punya akses ke 1 company, gak perlu dropdown —
  // cukup label statis biar gak nambah langkah yang gak perlu.
  if (companies.length <= 1) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-surface-border px-3 py-1.5 text-sm font-medium text-ink">
        {activeName}
      </div>
    );
  }

  function handleSwitch(companyId: string) {
    if (companyId === activeCompanyId) {
      setOpen(false);
      return;
    }
    startTransition(() => {
      switchCompany(companyId);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="flex items-center gap-2 rounded-lg border border-surface-border px-3 py-1.5 text-sm font-medium hover:bg-surface disabled:opacity-60"
      >
        {isPending ? "Berpindah..." : activeName}
        <ChevronDown size={14} className="text-ink-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-10 z-20 w-64 rounded-lg border border-surface-border bg-surface-card p-1.5 shadow-lg">
            <p className="px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Pilih Resto
            </p>
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSwitch(c.id)}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm hover:bg-surface"
              >
                <span
                  className={
                    c.id === activeCompanyId
                      ? "font-semibold text-ink"
                      : "text-ink-muted"
                  }
                >
                  {c.name}
                </span>
                {c.id === activeCompanyId && (
                  <Check size={14} className="text-accent" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
