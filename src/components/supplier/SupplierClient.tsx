"use client";

import { useState, useTransition } from "react";
import { Phone, Plus, Trash2 } from "lucide-react";
import { deleteSupplier } from "@/app/(dashboard)/supplier/actions";
import { SupplierFormModal } from "./SupplierFormModal";

type Supplier = {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  address: string | null;
};

export function SupplierClient({ suppliers }: { suppliers: Supplier[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus supplier "${name}"?`)) return;
    startTransition(() => {
      deleteSupplier(id);
    });
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Supplier</h1>
          <p className="text-sm text-ink-muted">{suppliers.length} supplier terdaftar</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary gap-2">
          <Plus size={16} /> Tambah Supplier
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-muted">
          Belum ada supplier. Tambahkan yang pertama.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <div key={s.id} className="card p-4">
              <div className="mb-2 flex items-start justify-between">
                <h4 className="text-sm font-bold text-ink">{s.name}</h4>
                <button
                  onClick={() => handleDelete(s.id, s.name)}
                  disabled={isPending}
                  className="rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-accent-danger"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {s.contact_person && (
                <p className="mb-1 text-xs text-ink-muted">
                  Kontak: {s.contact_person}
                </p>
              )}
              {s.phone && (
                <p className="mb-1 flex items-center gap-1.5 text-xs text-ink-muted">
                  <Phone size={12} /> {s.phone}
                </p>
              )}
              {s.address && (
                <p className="mt-2 text-xs text-ink-muted">{s.address}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <SupplierFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
