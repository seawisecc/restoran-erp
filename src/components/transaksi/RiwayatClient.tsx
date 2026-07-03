"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Receipt } from "lucide-react";

type OrderRow = {
  id: string;
  total: number;
  subtotal: number;
  tax: number;
  paid_at: string;
  restaurant_tables: { name: string } | null;
  order_items: { count: number }[];
};

function rupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isThisWeek(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  return d >= start;
}

export function RiwayatClient({ orders }: { orders: OrderRow[] }) {
  const [filter, setFilter] = useState<"all" | "today" | "week">("all");

  const filtered = useMemo(() => {
    if (filter === "today") return orders.filter((o) => isToday(o.paid_at));
    if (filter === "week") return orders.filter((o) => isThisWeek(o.paid_at));
    return orders;
  }, [orders, filter]);

  const totalRevenue = filtered.reduce((sum, o) => sum + o.total, 0);

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/transaksi"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-surface-card"
        >
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ink">Riwayat Transaksi</h1>
          <p className="text-sm text-ink-muted">
            {filtered.length} transaksi &middot; total {rupiah(totalRevenue)}
          </p>
        </div>
      </div>

      <div className="mb-5 flex gap-2">
        {[
          { key: "all" as const, label: "Semua" },
          { key: "today" as const, label: "Hari Ini" },
          { key: "week" as const, label: "Minggu Ini" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
              filter === f.key
                ? "border-accent bg-accent text-white"
                : "border-surface-border bg-surface-card text-ink-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-muted">
          Belum ada transaksi pada rentang ini.
        </div>
      ) : (
        <div className="card overflow-hidden">
          {filtered.map((o, i) => (
            <Link
              key={o.id}
              href={`/transaksi/riwayat/${o.id}`}
              className={`flex items-center justify-between px-4 py-3.5 hover:bg-surface ${
                i !== 0 ? "border-t border-surface-border" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-ink-muted">
                  <Receipt size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {o.restaurant_tables?.name ?? "Meja"}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {formatDateTime(o.paid_at)} &middot;{" "}
                    {o.order_items?.[0]?.count ?? 0} item
                  </p>
                </div>
              </div>
              <p className="text-sm font-bold text-ink">{rupiah(o.total)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
