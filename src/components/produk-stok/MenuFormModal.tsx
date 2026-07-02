"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { X } from "lucide-react";
import { createMenuItem } from "@/app/(dashboard)/produk-stok/actions";

type Category = { id: string; name: string };

export function MenuFormModal({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await createMenuItem(formData);
        formRef.current?.reset();
        onClose();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal menyimpan menu.",
        );
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">Tambah Menu</h3>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Nama Menu
            </label>
            <input
              name="name"
              required
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="misal: Nasi Goreng Spesial"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Kategori
            </label>
            <select
              name="category_id"
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
              defaultValue=""
            >
              <option value="">Tanpa kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Harga (Rp)
              </label>
              <input
                name="price"
                type="number"
                required
                min={0}
                className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
                placeholder="25000"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Satuan
              </label>
              <input
                name="unit"
                defaultValue="porsi"
                className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>

          {error && <p className="text-sm text-accent-danger">{error}</p>}

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-surface-border py-2.5 text-sm font-medium text-ink-muted hover:bg-surface"
            >
              Batal
            </button>
            <button type="submit" disabled={isPending} className="btn-primary flex-1">
              {isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
