"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Star, UserRound } from "lucide-react";
import { CustomerFormModal } from "./CustomerFormModal";

type Customer = {
  id: string;
  phone: string;
  name: string | null;
  points: number;
  created_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PelangganClient({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.phone.includes(q) || (c.name ?? "").toLowerCase().includes(q),
    );
  }, [customers, search]);

  const totalPoints = customers.reduce((s, c) => s + c.points, 0);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Pelanggan</h1>
          <p className="text-sm text-ink-muted">
            {customers.length} pelanggan &middot; {totalPoints} total poin beredar
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary gap-2">
          <Plus size={16} /> Tambah Pelanggan
        </button>
      </div>

      <div className="relative mb-5">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nomor HP atau nama..."
          className="w-full rounded-lg border border-surface-border bg-surface-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-muted">
          {customers.length === 0
            ? "Belum ada pelanggan. Otomatis terdaftar begitu kasir input nomor HP pas bayar, atau tambah manual di sini."
            : "Gak ada pelanggan yang cocok dengan pencarian."}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {filtered.map((c, i) => (
            <div
              key={c.id}
              className={`flex items-center justify-between px-4 py-3.5 ${
                i !== 0 ? "border-t border-surface-border" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink-muted">
                  <UserRound size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {c.name || "Tanpa nama"}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {c.phone} &middot; sejak {formatDate(c.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-accent-warningBg px-3 py-1 text-xs font-bold text-accent-warning">
                <Star size={12} /> {c.points} poin
              </div>
            </div>
          ))}
        </div>
      )}

      <CustomerFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
