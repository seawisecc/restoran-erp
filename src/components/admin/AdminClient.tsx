"use client";

import { useMemo, useState, useTransition } from "react";
import { Calendar } from "lucide-react";
import {
  approveCompany,
  extendSubscription,
  rejectCompany,
  setSubscriptionDate,
} from "@/app/admin/actions";

type Company = {
  id: string;
  name: string;
  slug: string;
  status: "pending" | "approved" | "rejected";
  subscription_expires_at: string | null;
  created_at: string;
  company_users: { count: number }[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isExpired(iso: string | null) {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

function daysLeft(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const statusConfig = {
  pending: { label: "Menunggu", cls: "badge-warning" },
  approved: { label: "Aktif", cls: "badge-success" },
  rejected: { label: "Ditolak", cls: "badge-danger" },
};

export function AdminClient({ companies }: { companies: Company[] }) {
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "all">(
    "pending",
  );
  const [datePickerFor, setDatePickerFor] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (tab === "all") return companies;
    return companies.filter((c) => c.status === tab);
  }, [companies, tab]);

  const counts = useMemo(
    () => ({
      pending: companies.filter((c) => c.status === "pending").length,
      approved: companies.filter((c) => c.status === "approved").length,
      rejected: companies.filter((c) => c.status === "rejected").length,
      all: companies.length,
    }),
    [companies],
  );

  function handleApprove(id: string) {
    startTransition(() => {
      approveCompany(id);
    });
  }

  function handleReject(id: string) {
    if (!confirm("Tolak pendaftaran restoran ini?")) return;
    startTransition(() => {
      rejectCompany(id);
    });
  }

  function handleExtend(id: string, days: number) {
    startTransition(() => {
      extendSubscription(id, days);
    });
  }

  function handleSetDate(id: string, dateValue: string) {
    if (!dateValue) return;
    startTransition(() => {
      setSubscriptionDate(id, dateValue);
      setDatePickerFor(null);
    });
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Kelola Restoran</h1>
        <p className="text-sm text-ink-muted">
          {companies.length} restoran terdaftar di seluruh platform
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            { key: "pending" as const, label: "Menunggu" },
            { key: "approved" as const, label: "Aktif" },
            { key: "rejected" as const, label: "Ditolak" },
            { key: "all" as const, label: "Semua" },
          ]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
              tab === t.key
                ? "border-accent bg-accent text-white"
                : "border-surface-border bg-surface-card text-ink-muted"
            }`}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-muted">
          Gak ada restoran di kategori ini.
        </div>
      ) : (
        <div className="card overflow-hidden">
          {filtered.map((c, i) => {
            const cfg = statusConfig[c.status];
            const expired = isExpired(c.subscription_expires_at);
            return (
              <div
                key={c.id}
                className={`px-4 py-3.5 ${i !== 0 ? "border-t border-surface-border" : ""}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{c.name}</p>
                    <p className="text-xs text-ink-muted">
                      /{c.slug} &middot; {c.company_users?.[0]?.count ?? 0} user
                      &middot; daftar {formatDate(c.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cfg.cls}>{cfg.label}</span>
                    {c.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(c.id)}
                          disabled={isPending}
                          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => handleReject(c.id)}
                          disabled={isPending}
                          className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-ink-muted"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Masa aktif langganan — cuma relevan buat yang udah
                    disetujui, karena yang pending/ditolak emang belum
                    bisa dipakai sama sekali */}
                {c.status === "approved" && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-surface px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar size={13} className="text-ink-muted" />
                      {c.subscription_expires_at ? (
                        <span
                          className={
                            expired
                              ? "font-semibold text-accent-danger"
                              : "text-ink-muted"
                          }
                        >
                          {expired
                            ? `Kadaluarsa sejak ${formatDate(c.subscription_expires_at)}`
                            : `Aktif s.d. ${formatDate(c.subscription_expires_at)} (${daysLeft(c.subscription_expires_at)} hari lagi)`}
                        </span>
                      ) : (
                        <span className="text-ink-muted">Belum ada masa aktif</span>
                      )}
                    </div>

                    <div className="ml-auto flex flex-wrap gap-1.5">
                      {[30, 90, 365].map((d) => (
                        <button
                          key={d}
                          onClick={() => handleExtend(c.id, d)}
                          disabled={isPending}
                          className="rounded-md border border-surface-border bg-surface-card px-2.5 py-1 text-[11px] font-semibold text-ink-muted hover:text-ink"
                        >
                          +{d} Hari
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setDatePickerFor(datePickerFor === c.id ? null : c.id)
                        }
                        className="rounded-md border border-surface-border bg-surface-card px-2.5 py-1 text-[11px] font-semibold text-ink-muted hover:text-ink"
                      >
                        Set Tanggal
                      </button>
                    </div>
                  </div>
                )}

                {datePickerFor === c.id && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="date"
                      className="rounded-lg border border-surface-border px-3 py-1.5 text-xs outline-none focus:border-accent"
                      onChange={(e) => handleSetDate(c.id, e.target.value)}
                    />
                    <span className="text-xs text-ink-muted">
                      Pilih tanggal baru masa aktif berakhir
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
