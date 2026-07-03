"use client";

import { useTransition } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { openOrCreateOrder } from "@/app/(dashboard)/transaksi/actions";

type Table = { id: string; name: string; seats: number };
type OpenOrder = { id: string; table_id: string | null; created_at: string };

function timeAgo(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} menit lalu`;
  return `${Math.round(mins / 60)} jam lalu`;
}

export function TableGridClient({
  tables,
  openOrders,
}: {
  tables: Table[];
  openOrders: OpenOrder[];
}) {
  const [isPending, startTransition] = useTransition();

  // Urutan alami: "Meja 2" harus muncul sebelum "Meja 10", bukan
  // diurutkan sebagai teks (yang bikin 10, 11, 12 nyelip sebelum 2).
  const sortedTables = [...tables].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
  );

  function handleClick(tableId: string) {
    startTransition(() => {
      openOrCreateOrder(tableId);
    });
  }

  const orderByTable = new Map(openOrders.map((o) => [o.table_id, o]));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Pilih Meja</h1>
          <p className="text-sm text-ink-muted">
            {tables.length} meja &middot; {openOrders.length} sedang terisi
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-surface-border" /> Kosong
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-accent-warning" /> Terisi
            </span>
          </div>
          <Link
            href="/transaksi/riwayat"
            className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-card px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink"
          >
            <History size={14} /> Riwayat
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {sortedTables.map((t) => {
          const order = orderByTable.get(t.id);
          const occupied = Boolean(order);
          return (
            <button
              key={t.id}
              disabled={isPending}
              onClick={() => handleClick(t.id)}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border font-bold transition-opacity disabled:opacity-60 ${
                occupied
                  ? "border-accent-warning bg-accent-warningBg text-accent-warning"
                  : "border-surface-border bg-surface-card text-ink hover:border-accent"
              }`}
            >
              <span className="text-xl">{t.name}</span>
              <span className="text-[10px] font-medium opacity-80">
                {occupied ? timeAgo(order!.created_at) : `${t.seats} kursi`}
              </span>
            </button>
          );
        })}
      </div>

      {tables.length === 0 && (
        <div className="card p-10 text-center text-sm text-ink-muted">
          Belum ada meja terdaftar. Tambahkan lewat Supabase SQL Editor
          atau menu Pengaturan (segera hadir).
        </div>
      )}
    </div>
  );
}
