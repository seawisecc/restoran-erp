"use client";

import { useMemo, useState, useTransition } from "react";
import { Calendar, X } from "lucide-react";
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
  admin_email: string | null;
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
  rejected: { label: "Nonaktif", cls: "badge-danger" },
};

export function AdminClient({ companies }: { companies: Company[] }) {
  const [tab, setTab] = useState<"all" | "pending" | "approved" | "rejected">(
    "all",
  );
  const [manageFor, setManageFor] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (tab === "all") return companies;
    return companies.filter((c) => c.status === tab);
  }, [companies, tab]);

  const counts = useMemo(
    () => ({
      all: companies.length,
      pending: companies.filter((c) => c.status === "pending").length,
      approved: companies.filter((c) => c.status === "approved").length,
      rejected: companies.filter((c) => c.status === "rejected").length,
    }),
    [companies],
  );

  function handleApprove(id: string) {
    startTransition(() => approveCompany(id));
  }

  function handleReject(id: string) {
    if (
      !confirm(
        "Nonaktifkan restoran ini? Mereka tidak bisa mengakses aplikasi sampai diaktifkan kembali.",
      )
    )
      return;
    startTransition(() => rejectCompany(id));
  }

  function handleExtend(id: string, days: number) {
    startTransition(() => extendSubscription(id, days));
  }

  function handleSetDate(id: string, dateValue: string) {
    if (!dateValue) return;
    startTransition(() => {
      setSubscriptionDate(id, dateValue);
      setManageFor(null);
    });
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Companies</h1>
        <p className="text-sm text-ink-muted">
          {companies.length} restoran terdaftar
        </p>
      </div>

      {/* Filter status */}
      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            { key: "all" as const, label: "Semua" },
            { key: "pending" as const, label: "Menunggu" },
            { key: "approved" as const, label: "Aktif" },
            { key: "rejected" as const, label: "Nonaktif" },
          ]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "border-accent bg-accent text-white"
                : "border-surface-border bg-surface-card text-ink-muted hover:text-ink"
            }`}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-muted">
          Belum ada restoran di kategori ini.
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Header tabel */}
          <div className="hidden grid-cols-[1.6fr_1.4fr_0.5fr_0.7fr_1fr_1.4fr] gap-4 border-b border-surface-border bg-surface px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-muted md:grid">
            <span>Company</span>
            <span>Admin</span>
            <span>User</span>
            <span>Status</span>
            <span>Valid Sampai</span>
            <span className="text-right">Aksi</span>
          </div>

          {filtered.map((c, i) => {
            const cfg = statusConfig[c.status];
            const expired = isExpired(c.subscription_expires_at);
            const userCount = c.company_users?.[0]?.count ?? 0;
            const managing = manageFor === c.id;

            return (
              <div
                key={c.id}
                className={i !== 0 ? "border-t border-surface-border" : ""}
              >
                <div className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-[1.6fr_1.4fr_0.5fr_0.7fr_1fr_1.4fr] md:items-center md:gap-4">
                  {/* Company */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {c.name}
                    </p>
                    <p className="truncate text-xs text-ink-muted">{c.slug}</p>
                  </div>

                  {/* Admin */}
                  <div className="min-w-0 text-sm">
                    {c.admin_email ? (
                      <span className="block truncate text-ink-muted">
                        {c.admin_email}
                      </span>
                    ) : (
                      <span className="text-ink-muted">&mdash;</span>
                    )}
                  </div>

                  {/* User */}
                  <div className="text-sm text-ink md:text-center">
                    <span className="text-xs text-ink-muted md:hidden">
                      User:{" "}
                    </span>
                    {userCount}
                  </div>

                  {/* Status */}
                  <div>
                    <span className={cfg.cls}>{cfg.label}</span>
                  </div>

                  {/* Valid sampai */}
                  <div className="text-sm">
                    {c.status === "approved" &&
                    c.subscription_expires_at ? (
                      <span
                        className={
                          expired
                            ? "font-semibold text-accent-danger"
                            : "text-ink-muted"
                        }
                      >
                        {formatDate(c.subscription_expires_at)}
                      </span>
                    ) : (
                      <span className="text-ink-muted">&mdash;</span>
                    )}
                  </div>

                  {/* Aksi */}
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {c.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleReject(c.id)}
                          disabled={isPending}
                          className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink disabled:opacity-60"
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => handleApprove(c.id)}
                          disabled={isPending}
                          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
                        >
                          Setujui
                        </button>
                      </>
                    )}

                    {c.status === "approved" && (
                      <>
                        <button
                          onClick={() => handleReject(c.id)}
                          disabled={isPending}
                          className="rounded-lg border border-accent-peach/50 px-3 py-1.5 text-xs font-semibold text-accent-peach hover:bg-accent-peachBg disabled:opacity-60"
                        >
                          Nonaktifkan
                        </button>
                        <button
                          onClick={() => setManageFor(managing ? null : c.id)}
                          disabled={isPending}
                          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
                        >
                          Ubah Masa Aktif
                        </button>
                      </>
                    )}

                    {c.status === "rejected" && (
                      <button
                        onClick={() => handleApprove(c.id)}
                        disabled={isPending}
                        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
                      >
                        Aktifkan
                      </button>
                    )}
                  </div>
                </div>

                {/* Panel "Ubah Masa Aktif" */}
                {managing && c.status === "approved" && (
                  <div className="border-t border-surface-border bg-surface px-5 py-3.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar size={13} className="text-ink-muted" />
                        {c.subscription_expires_at ? (
                          <span className="text-ink-muted">
                            {expired
                              ? `Kadaluarsa sejak ${formatDate(c.subscription_expires_at)}`
                              : `Aktif s.d. ${formatDate(c.subscription_expires_at)} (${daysLeft(c.subscription_expires_at)} hari lagi)`}
                          </span>
                        ) : (
                          <span className="text-ink-muted">
                            Belum ada masa aktif
                          </span>
                        )}
                      </div>

                      <div className="ml-auto flex flex-wrap items-center gap-1.5">
                        {[30, 90, 365].map((d) => (
                          <button
                            key={d}
                            onClick={() => handleExtend(c.id, d)}
                            disabled={isPending}
                            className="rounded-md border border-surface-border bg-surface-card px-2.5 py-1 text-[11px] font-semibold text-ink-muted hover:text-ink disabled:opacity-60"
                          >
                            +{d} Hari
                          </button>
                        ))}
                        <input
                          type="date"
                          className="rounded-md border border-surface-border bg-surface-card px-2.5 py-1 text-[11px] text-ink outline-none focus:border-accent"
                          onChange={(e) => handleSetDate(c.id, e.target.value)}
                        />
                        <button
                          onClick={() => setManageFor(null)}
                          className="rounded-md p-1 text-ink-muted hover:text-ink"
                          aria-label="Tutup"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
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
