"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { X } from "lucide-react";
import { createCustomer } from "@/app/(dashboard)/pelanggan/actions";

export function CustomerFormModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
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
        await createCustomer(formData);
        formRef.current?.reset();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan pelanggan.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">Tambah Pelanggan</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Nomor HP
            </label>
            <input
              name="phone"
              required
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="08123456789"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Nama (opsional)
            </label>
            <input
              name="name"
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="misal: Budi Santoso"
            />
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
