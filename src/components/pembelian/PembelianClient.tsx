"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Package,
  Plus,
  Truck,
  X,
} from "lucide-react";
import {
  cancelPurchase,
  receivePurchase,
  saveStockOpname,
} from "@/app/(dashboard)/pembelian/actions";
import { PurchaseFormModal } from "./PurchaseFormModal";

type PurchaseItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
};
type Purchase = {
  id: string;
  status: "pending" | "received" | "cancelled";
  total: number;
  created_at: string;
  received_at: string | null;
  suppliers: { name: string } | null;
  purchase_items: PurchaseItem[];
};
type Supplier = { id: string; name: string };
type RawMaterial = {
  id: string;
  name: string;
  unit: string;
  stock_qty: number;
  min_stock: number;
  cost_price: number;
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
  const [openDetail, setOpenDetail] = useState<string | null>(null);
  const [opname, setOpname] = useState<RawMaterial | null>(null);
  const [opnameQty, setOpnameQty] = useState("");
  const [opnameMin, setOpnameMin] = useState("");
  const [opnameError, setOpnameError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const lowStockCount = rawMaterials.filter(
    (m) => m.min_stock > 0 && m.stock_qty <= m.min_stock,
  ).length;

  function openOpname(m: RawMaterial) {
    setOpname(m);
    setOpnameQty(String(m.stock_qty));
    setOpnameMin(String(m.min_stock));
    setOpnameError(null);
  }

  function submitOpname(e: React.FormEvent) {
    e.preventDefault();
    if (!opname) return;
    setOpnameError(null);
    startTransition(async () => {
      try {
        await saveStockOpname(
          opname.id,
          Number(opnameQty),
          Number(opnameMin),
        );
        setOpname(null);
      } catch (err) {
        setOpnameError(
          err instanceof Error ? err.message : "Gagal menyimpan stok.",
        );
      }
    });
  }

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
              const expanded = openDetail === p.id;
              const items = p.purchase_items ?? [];
              return (
                <div
                  key={p.id}
                  className={i !== 0 ? "border-t border-surface-border" : ""}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                    <button
                      onClick={() => setOpenDetail(expanded ? null : p.id)}
                      className="flex min-w-0 items-center gap-2 text-left"
                    >
                      {expanded ? (
                        <ChevronDown size={16} className="shrink-0 text-ink-muted" />
                      ) : (
                        <ChevronRight size={16} className="shrink-0 text-ink-muted" />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {p.suppliers?.name ?? "Tanpa supplier"}
                        </span>
                        <span className="block text-xs text-ink-muted">
                          {formatDate(p.created_at)} &middot; {items.length} item
                        </span>
                      </span>
                    </button>
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

                  {/* Rincian item pembelian */}
                  {expanded && (
                    <div className="border-t border-surface-border bg-surface px-4 py-3">
                      {items.length === 0 ? (
                        <p className="py-2 text-center text-xs text-ink-muted">
                          Tidak ada rincian item.
                        </p>
                      ) : (
                        <>
                          <div className="grid grid-cols-[1.6fr_0.6fr_0.9fr_0.9fr] gap-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                            <span>Bahan</span>
                            <span className="text-right">Qty</span>
                            <span className="text-right">Harga</span>
                            <span className="text-right">Subtotal</span>
                          </div>
                          {items.map((it) => (
                            <div
                              key={it.id}
                              className="grid grid-cols-[1.6fr_0.6fr_0.9fr_0.9fr] gap-3 border-t border-surface-border py-2 text-xs"
                            >
                              <span className="truncate font-medium text-ink">
                                {it.name}
                              </span>
                              <span className="text-right text-ink-muted">
                                {it.qty}
                              </span>
                              <span className="text-right text-ink-muted">
                                {rupiah(it.price)}
                              </span>
                              <span className="text-right font-semibold text-ink">
                                {rupiah(it.qty * it.price)}
                              </span>
                            </div>
                          ))}
                          <div className="grid grid-cols-[1.6fr_0.6fr_0.9fr_0.9fr] gap-3 border-t border-surface-border pt-2 text-xs">
                            <span className="col-span-3 font-semibold text-ink">
                              Total
                            </span>
                            <span className="text-right font-bold text-ink">
                              {rupiah(p.total)}
                            </span>
                          </div>
                          {p.received_at && (
                            <p className="mt-2 text-[11px] text-ink-muted">
                              Diterima {formatDate(p.received_at)} — stok bahan
                              sudah ditambahkan.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : rawMaterials.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-muted">
          Belum ada bahan baku. Bahan baku otomatis muncul di sini setelah
          Anda membuat pembelian pertama.
        </div>
      ) : (
        <>
          {lowStockCount > 0 && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-accent-warning/40 bg-accent-warningBg p-4">
              <AlertTriangle
                size={16}
                className="mt-0.5 shrink-0 text-accent-warning"
              />
              <div>
                <p className="text-sm font-semibold text-accent-warning">
                  {lowStockCount} bahan baku menipis
                </p>
                <p className="text-xs text-ink-muted">
                  Stoknya sudah di bawah batas minimum. Segera buat pembelian.
                </p>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="hidden grid-cols-[1.6fr_1fr_1fr_1fr_0.8fr] gap-4 border-b border-surface-border bg-surface px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-muted md:grid">
              <span>Bahan Baku</span>
              <span className="text-right">Stok</span>
              <span className="text-right">Min.</span>
              <span className="text-right">Modal / satuan</span>
              <span className="text-right">Aksi</span>
            </div>

            {rawMaterials.map((m, i) => {
              const low = m.min_stock > 0 && m.stock_qty <= m.min_stock;
              return (
                <div
                  key={m.id}
                  className={`grid grid-cols-2 gap-2 px-4 py-3.5 md:grid-cols-[1.6fr_1fr_1fr_1fr_0.8fr] md:items-center md:gap-4 ${
                    i !== 0 ? "border-t border-surface-border" : ""
                  }`}
                >
                  <p className="text-sm font-semibold text-ink">{m.name}</p>
                  <div className="md:text-right">
                    <span className={low ? "badge-danger" : "badge-success"}>
                      {m.stock_qty} {m.unit}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted md:text-right">
                    <span className="md:hidden">Min: </span>
                    {m.min_stock > 0 ? `${m.min_stock} ${m.unit}` : "—"}
                  </p>
                  <p className="text-xs text-ink-muted md:text-right">
                    {m.cost_price > 0 ? rupiah(m.cost_price) : "—"}
                  </p>
                  <div className="md:text-right">
                    <button
                      onClick={() => openOpname(m)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border px-2.5 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink"
                    >
                      <ClipboardCheck size={13} /> Opname
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-ink-muted">
            Stok bertambah otomatis saat pembelian ditandai &ldquo;Diterima&rdquo;,
            dan disesuaikan lewat Opname (hitung fisik). Penjualan tidak
            memotong stok bahan otomatis.
          </p>
        </>
      )}

      {/* ===== Modal Stok Opname ===== */}
      {opname && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={submitOpname}
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-surface-border px-5 py-3.5">
              <div>
                <p className="text-sm font-bold text-ink">Stok Opname</p>
                <p className="text-xs text-ink-muted">{opname.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpname(null)}
                className="rounded-md p-1 text-ink-muted hover:text-ink"
                aria-label="Tutup"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-4 p-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Stok fisik saat ini ({opname.unit})
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={opnameQty}
                  onChange={(e) => setOpnameQty(e.target.value)}
                  required
                  autoFocus
                  className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Isi hasil hitung fisik. Tercatat: {opname.stock_qty}{" "}
                  {opname.unit}.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Batas stok minimum ({opname.unit})
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={opnameMin}
                  onChange={(e) => setOpnameMin(e.target.value)}
                  required
                  className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Peringatan muncul saat stok menyentuh angka ini. Isi 0 untuk
                  mematikan peringatan.
                </p>
              </div>

              {opnameError && (
                <p className="text-sm text-accent-danger">{opnameError}</p>
              )}
            </div>

            <div className="flex gap-2 border-t border-surface-border p-4">
              <button
                type="button"
                onClick={() => setOpname(null)}
                className="flex-1 rounded-lg border border-surface-border py-2.5 text-sm font-semibold text-ink-muted hover:text-ink"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {isPending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
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
