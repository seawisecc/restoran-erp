"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  getMenuItemRecipe,
  saveMenuItemRecipe,
} from "@/app/(dashboard)/produk-stok/actions";

type RawMaterial = { id: string; name: string; unit: string; cost_price: number };
type RecipeLine = { rawMaterialId: string; qtyUsed: string };

function rupiah(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export function RecipeFormModal({
  open,
  onClose,
  menuItemId,
  menuItemName,
  menuItemPrice,
  rawMaterials,
}: {
  open: boolean;
  onClose: () => void;
  menuItemId: string | null;
  menuItemName: string;
  menuItemPrice: number;
  rawMaterials: RawMaterial[];
}) {
  const [lines, setLines] = useState<RecipeLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !menuItemId) return;
    setLoading(true);
    getMenuItemRecipe(menuItemId).then((data) => {
      setLines(
        data.length > 0
          ? data.map((d) => ({
              rawMaterialId: d.raw_material_id,
              qtyUsed: String(d.qty_used),
            }))
          : [{ rawMaterialId: "", qtyUsed: "" }],
      );
      setLoading(false);
    });
  }, [open, menuItemId]);

  if (!open || !menuItemId) return null;

  // Disalin ke const di scope komponen utama (bukan di dalam
  // handleSave) — TypeScript gak nyimpen penyempitan tipe dari guard
  // di atas ke dalam nested function manapun (baik handleSave maupun
  // closure startTransition di dalemnya), jadi harus ditangkep di
  // sini biar tipenya "string" nempel permanen.
  const activeMenuItemId = menuItemId;

  function updateLine(index: number, field: keyof RecipeLine, value: string) {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    );
  }

  function addLine() {
    setLines((prev) => [...prev, { rawMaterialId: "", qtyUsed: "" }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  const hpp = lines.reduce((sum, l) => {
    const material = rawMaterials.find((m) => m.id === l.rawMaterialId);
    const qty = Number(l.qtyUsed) || 0;
    return sum + (material ? material.cost_price * qty : 0);
  }, 0);
  const margin = menuItemPrice - hpp;
  const marginPct = menuItemPrice > 0 ? (margin / menuItemPrice) * 100 : 0;

  function handleSave() {
    setError(null);
    const payload = lines
      .filter((l) => l.rawMaterialId && Number(l.qtyUsed) > 0)
      .map((l) => ({ rawMaterialId: l.rawMaterialId, qtyUsed: Number(l.qtyUsed) }));

    startTransition(async () => {
      try {
        await saveMenuItemRecipe(activeMenuItemId, payload);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan resep.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-lg p-6">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">Resep &mdash; {menuItemName}</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <p className="mb-4 text-xs text-ink-muted">
          Tentukan bahan baku &amp; takaran per 1 porsi, biar HPP &amp; margin
          otomatis kehitung.
        </p>

        {loading ? (
          <p className="py-8 text-center text-sm text-ink-muted">Memuat...</p>
        ) : (
          <>
            <div className="mb-3 max-h-64 overflow-y-auto pr-1">
              {rawMaterials.length === 0 ? (
                <p className="rounded-lg bg-surface py-6 text-center text-xs text-ink-muted">
                  Belum ada bahan baku. Tambahkan dulu lewat modul Pembelian.
                </p>
              ) : (
                lines.map((line, i) => (
                  <div key={i} className="mb-2 grid grid-cols-12 gap-2">
                    <select
                      value={line.rawMaterialId}
                      onChange={(e) => updateLine(i, "rawMaterialId", e.target.value)}
                      className="col-span-7 rounded-lg border border-surface-border px-2.5 py-2 text-sm outline-none focus:border-accent"
                    >
                      <option value="">Pilih bahan...</option>
                      {rawMaterials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({rupiah(m.cost_price)}/{m.unit})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.qtyUsed}
                      onChange={(e) => updateLine(i, "qtyUsed", e.target.value)}
                      placeholder="Qty"
                      className="col-span-4 rounded-lg border border-surface-border px-2.5 py-2 text-sm outline-none focus:border-accent"
                    />
                    <button
                      onClick={() => removeLine(i)}
                      className="col-span-1 flex items-center justify-center text-ink-muted hover:text-accent-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={addLine}
              className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-accent-link"
            >
              <Plus size={14} /> Tambah bahan
            </button>

            <div className="mb-4 rounded-lg bg-surface p-3 text-sm">
              <div className="flex justify-between text-ink-muted">
                <span>HPP (Harga Pokok Produksi)</span>
                <span className="font-semibold text-ink">{rupiah(hpp)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Harga Jual</span>
                <span className="font-semibold text-ink">{rupiah(menuItemPrice)}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-surface-border pt-1 font-bold">
                <span className={margin >= 0 ? "text-accent-success" : "text-accent-danger"}>
                  Margin
                </span>
                <span className={margin >= 0 ? "text-accent-success" : "text-accent-danger"}>
                  {rupiah(margin)} ({marginPct.toFixed(0)}%)
                </span>
              </div>
            </div>

            {error && <p className="mb-3 text-sm text-accent-danger">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-surface-border py-2.5 text-sm font-medium text-ink-muted hover:bg-surface"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="btn-primary flex-1"
              >
                {isPending ? "Menyimpan..." : "Simpan Resep"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}