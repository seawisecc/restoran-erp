"use client";

import { useState, useTransition } from "react";
import { Package, Plus, Truck } from "lucide-react";
import { cancelPurchase, receivePurchase } from "@/app/(dashboard)/pembelian/actions";
import { PurchaseFormModal } from "./PurchaseFormModal";

type Purchase = {
  id: string;
  status: "pending" | "received" | "cancelled";
  total: number;
  created_at: string;
  received_at: string | null;
  suppliers: { name: string } | null;
};
type Supplier = { id: string; name: string };
type RawMaterial = {
  id: string;
  name: string;
  unit: string;
  stock_qty: number;
  min_stock: number;
};

function rupiah(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusConfig = {
  pending: { label: "Menunggu", cls: "badge-warning" },
  received: { label: "Diterima", cls: "badge-success" },
  cancelled: { label: "Dibatalkan", cls: "badge-danger" },
};

export function PembelianClient({
  purchases,
  suppliers,
  rawMaterials,
}: {
  purchases: Purchase[];
  suppliers: Supplier[];
  rawMaterials: RawMaterial[];
}) {
  const [tab, setTab] = useState<"purchases" | "materials">("purchases");
  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleReceive(id: string) {
    if (!confirm("Tandai pembelian ini sebagai diterima? Stok bahan baku akan otomatis bertambah.")) {
      return;
    }
    startTransition(() => {
      receivePurchase(id);
    });
  }

  function handleCancel(id: string) {
    if (!confirm("Batalkan pembelian ini?")) return;
    startTransition(() => {
      cancelPurchase(id);
    });
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Pembelian</h1>
          <p className="text-sm text-ink-muted">
            {purchases.length} pembelian &middot; {rawMaterials.length} bahan baku
          </p>
        </div>
        {tab === "purchases" && (
          <button onClick={() => setModalOpen(true)} className="btn-primary gap-2">
            <Plus size={16} /> Buat Pembelian
          </button>
        )}
      </div>

      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setTab("purchases")}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold ${
            tab === "purchases"
              ? "border-accent bg-accent text-white"
              : "border-surface-border bg-surface-card text-ink-muted"
          }`}
        >
          <Truck size={14} /> Daftar Pembelian
        </button>
        <button
          onClick={() => setTab("materials")}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold ${
            tab === "materials"
              ? "border-accent bg-accent text-white"
              : "border-surface-border bg-surface-card text-ink-muted"
          }`}
        >
          <Package size={14} /> Stok Bahan Baku
        </button>
      </div>

      {tab === "purchases" ? (
        purchases.length === 0 ? (
          <div className="card p-10 text-center text-sm text-ink-muted">
            Belum ada pembelian. Buat yang pertama.
          </div>
        ) : (
          <div className="card overflow-hidden">
            {purchases.map((p, i) => {
              const cfg = statusConfig[p.status];
              return (
                <div
                  key={p.id}
                  className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 ${
                    i !== 0 ? "border-t border-surface-border" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {p.suppliers?.name ?? "Tanpa supplier"}
                    </p>
                    <p className="text-xs text-ink-muted">{formatDate(p.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cfg.cls}>{cfg.label}</span>
                    <p className="w-28 text-right text-sm font-bold text-ink">
                      {rupiah(p.total)}
                    </p>
                    {p.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReceive(p.id)}
                          disabled={isPending}
                          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Terima
                        </button>
                        <button
                          onClick={() => handleCancel(p.id)}
                          disabled={isPending}
                          className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-ink-muted"
                        >
                          Batal
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : rawMaterials.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-muted">
          Belum ada bahan baku. Bahan baku otomatis muncul di sini setelah
          lo buat pembelian pertama.
        </div>
      ) : (
        <div className="card overflow-hidden">
          {rawMaterials.map((m, i) => {
            const low = m.stock_qty <= m.min_stock && m.min_stock > 0;
            return (
              <div
                key={m.id}
                className={`flex items-center justify-between px-4 py-3.5 ${
                  i !== 0 ? "border-t border-surface-border" : ""
                }`}
              >
                <p className="text-sm font-semibold text-ink">{m.name}</p>
                <div className="flex items-center gap-2">
                  <span className={low ? "badge-danger" : "badge-success"}>
                    {m.stock_qty} {m.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PurchaseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        suppliers={suppliers}
      />
    </div>
  );
}
