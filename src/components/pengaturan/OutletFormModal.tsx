"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { X } from "lucide-react";
import { createOutlet, updateOutlet } from "@/app/(dashboard)/pengaturan/actions";

type Outlet = { id: string; name: string; address: string | null };

export function OutletFormModal({
  open,
  onClose,
  outlet,
}: {
  open: boolean;
  onClose: () => void;
  outlet?: Outlet | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(outlet);

  // Reset error tiap kali modal dibuka ulang buat outlet yang beda
  useEffect(() => {
    setError(null);
  }, [outlet, open]);

  if (!open) return null;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        if (isEdit && outlet) {
          await updateOutlet(outlet.id, formData);
        } else {
          await createOutlet(formData);
        }
        formRef.current?.reset();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan outlet.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">
            {isEdit ? "Edit Outlet" : "Tambah Outlet"}
          </h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          key={outlet?.id ?? "new"}
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Nama Outlet
            </label>
            <input
              name="name"
              required
              defaultValue={outlet?.name ?? ""}
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="misal: Outlet Kemang"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Alamat</label>
            <textarea
              name="address"
              rows={2}
              defaultValue={outlet?.address ?? ""}
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="Alamat outlet (opsional)"
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
