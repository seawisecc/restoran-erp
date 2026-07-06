"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { createPurchase } from "@/app/(dashboard)/pembelian/actions";

type Supplier = { id: string; name: string };
type Row = { name: string; unit: string; qty: string; price: string };

const emptyRow: Row = { name: "", unit: "pcs", qty: "1", price: "0" };

export function PurchaseFormModal({
  open,
  onClose,
  suppliers,
}: {
  open: boolean;
  onClose: () => void;
  suppliers: Supplier[];
}) {
  const [supplierId, setSupplierId] = useState("");
  const [rows, setRows] = useState<Row[]>([{ ...emptyRow }]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function updateRow(index: number, field: keyof Row, value: string) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, { ...emptyRow }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function resetAndClose() {
    setRows([{ ...emptyRow }]);
    setSupplierId("");
    setError(null);
    onClose();
  }

  function handleSubmit() {
    setError(null);

    const items = rows
      .filter((r) => r.name.trim() !== "")
      .map((r) => ({
        name: r.name.trim(),
        unit: r.unit.trim() || "pcs",
        qty: Number(r.qty) || 0,
        price: Number(r.price) || 0,
      }));

    if (items.length === 0) {
      setError("Tambahkan minimal 1 bahan baku.");
      return;
    }
    if (items.some((it) => it.qty <= 0)) {
      setError("Qty tiap item harus lebih dari 0.");
      return;
    }

    startTransition(async () => {
      try {
        await createPurchase({ supplierId: supplierId || null, items });
        resetAndClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan pembelian.");
      }
    });
  }

  const total = rows.reduce(
    (sum, r) => sum + (Number(r.qty) || 0) * (Number(r.price) || 0),
    0,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">Buat Pembelian</h3>
          <button onClick={resetAndClose} className="text-ink-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-ink">Supplier</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Tanpa supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-2">
          <label className="mb-1 block text-sm font-medium text-ink">
            Item Bahan Baku
          </label>
          <p className="mb-2 text-xs text-ink-muted">
            Ketik nama bahan baku bebas — kalau belum ada, otomatis dibuatkan.
          </p>
        </div>

        <div className="mb-3 max-h-64 overflow-y-auto pr-1">
          {rows.map((row, i) => (
            <div key={i} className="mb-2 grid grid-cols-12 gap-2">
              <input
                value={row.name}
                onChange={(e) => updateRow(i, "name", e.target.value)}
                placeholder="Nama bahan (misal: Beras 5kg)"
                className="col-span-5 rounded-lg border border-surface-border px-2.5 py-2 text-sm outline-none focus:border-accent"
              />
              <input
                value={row.unit}
                onChange={(e) => updateRow(i, "unit", e.target.value)}
                placeholder="Satuan"
                className="col-span-2 rounded-lg border border-surface-border px-2.5 py-2 text-sm outline-none focus:border-accent"
              />
              <input
                type="number"
                min={0}
                value={row.qty}
                onChange={(e) => updateRow(i, "qty", e.target.value)}
                placeholder="Qty"
                className="col-span-2 rounded-lg border border-surface-border px-2.5 py-2 text-sm outline-none focus:border-accent"
              />
              <input
                type="number"
                min={0}
                value={row.price}
                onChange={(e) => updateRow(i, "price", e.target.value)}
                placeholder="Harga satuan"
                className="col-span-2 rounded-lg border border-surface-border px-2.5 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                onClick={() => removeRow(i)}
                disabled={rows.length === 1}
                className="col-span-1 flex items-center justify-center rounded-lg text-ink-muted hover:text-accent-danger disabled:opacity-30"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addRow}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-accent-link"
        >
          <Plus size={14} /> Tambah baris
        </button>

        <div className="mb-4 flex justify-between border-t border-surface-border pt-3 text-sm font-bold text-ink">
          <span>Total</span>
          <span>Rp {Math.round(total).toLocaleString("id-ID")}</span>
        </div>

        {error && <p className="mb-3 text-sm text-accent-danger">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={resetAndClose}
            className="flex-1 rounded-lg border border-surface-border py-2.5 text-sm font-medium text-ink-muted hover:bg-surface"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="btn-primary flex-1"
          >
            {isPending ? "Menyimpan..." : "Simpan Pembelian"}
          </button>
        </div>
      </div>
    </div>
  );
}
