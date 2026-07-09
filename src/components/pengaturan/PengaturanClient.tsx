"use client";

import { useState, useTransition } from "react";
import { Building2, Gift, Pencil, Plus, QrCode, Trash2, UtensilsCrossed } from "lucide-react";
import { deleteTable, toggleOutletActive, updateLoyaltySettings } from "@/app/(dashboard)/pengaturan/actions";
import { useCompany } from "@/components/providers/CompanyProvider";
import { OutletFormModal } from "./OutletFormModal";
import { TableFormModal } from "./TableFormModal";
import { TableQrModal } from "./TableQrModal";

type Outlet = {
  id: string;
  name: string;
  address: string | null;
  is_active: boolean;
};
type TableRow = {
  id: string;
  name: string;
  seats: number;
  outlets: { name: string } | null;
};

export function PengaturanClient({
  outlets,
  tables,
}: {
  outlets: Outlet[];
  tables: TableRow[];
}) {
  const { company } = useCompany();
  const [tab, setTab] = useState<"outlet" | "meja" | "loyalty">("outlet");
  const [outletModalOpen, setOutletModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [qrTable, setQrTable] = useState<TableRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loyaltyError, setLoyaltyError] = useState<string | null>(null);
  const [loyaltySaved, setLoyaltySaved] = useState(false);

  function handleToggleOutlet(id: string, current: boolean) {
    startTransition(() => {
      toggleOutletActive(id, !current);
    });
  }

  function handleDeleteTable(id: string, name: string) {
    if (!confirm(`Hapus ${name}? Riwayat transaksi meja ini tetap tersimpan.`)) return;
    startTransition(() => {
      deleteTable(id);
    });
  }

  function openAddOutlet() {
    setEditingOutlet(null);
    setOutletModalOpen(true);
  }

  function openEditOutlet(outlet: Outlet) {
    setEditingOutlet(outlet);
    setOutletModalOpen(true);
  }

  function handleSaveLoyalty(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoyaltyError(null);
    setLoyaltySaved(false);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await updateLoyaltySettings(formData);
        setLoyaltySaved(true);
        setTimeout(() => setLoyaltySaved(false), 2500);
      } catch (err) {
        setLoyaltyError(
          err instanceof Error ? err.message : "Gagal menyimpan pengaturan.",
        );
      }
    });
  }

  // Kelompokin meja per outlet, biar gak numpuk jadi satu kalau
  // company punya lebih dari 1 outlet/cabang.
  const tablesByOutlet = new Map<string, TableRow[]>();
  for (const t of tables) {
    const key = t.outlets?.name ?? "Tanpa outlet";
    if (!tablesByOutlet.has(key)) tablesByOutlet.set(key, []);
    tablesByOutlet.get(key)!.push(t);
  }
  for (const list of tablesByOutlet.values()) {
    list.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Pengaturan</h1>
          <p className="text-sm text-ink-muted">
            {outlets.length} outlet &middot; {tables.length} meja
          </p>
        </div>
        <button
          onClick={() => (tab === "outlet" ? openAddOutlet() : setTableModalOpen(true))}
          className={`btn-primary gap-2 ${tab === "loyalty" ? "invisible" : ""}`}
        >
          <Plus size={16} /> {tab === "outlet" ? "Tambah Outlet" : "Tambah Meja"}
        </button>
      </div>

      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setTab("outlet")}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold ${
            tab === "outlet"
              ? "border-accent bg-accent text-white"
              : "border-surface-border bg-surface-card text-ink-muted"
          }`}
        >
          <Building2 size={14} /> Outlet
        </button>
        <button
          onClick={() => setTab("meja")}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold ${
            tab === "meja"
              ? "border-accent bg-accent text-white"
              : "border-surface-border bg-surface-card text-ink-muted"
          }`}
        >
          <UtensilsCrossed size={14} /> Meja
        </button>
        <button
          onClick={() => setTab("loyalty")}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold ${
            tab === "loyalty"
              ? "border-accent bg-accent text-white"
              : "border-surface-border bg-surface-card text-ink-muted"
          }`}
        >
          <Gift size={14} /> Loyalty
        </button>
      </div>

      {tab === "outlet" ? (
        outlets.length === 0 ? (
          <div className="card p-10 text-center text-sm text-ink-muted">
            Belum ada outlet. Tambahkan yang pertama.
          </div>
        ) : (
          <div className="card overflow-hidden">
            {outlets.map((o, i) => (
              <div
                key={o.id}
                className={`flex items-center justify-between px-4 py-3.5 ${
                  i !== 0 ? "border-t border-surface-border" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{o.name}</p>
                  {o.address && (
                    <p className="text-xs text-ink-muted">{o.address}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleOutlet(o.id, o.is_active)}
                    disabled={isPending}
                    className={o.is_active ? "badge-success" : "badge-danger"}
                  >
                    {o.is_active ? "Aktif" : "Nonaktif"}
                  </button>
                  <button
                    onClick={() => openEditOutlet(o)}
                    className="rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-ink"
                    aria-label={`Edit ${o.name}`}
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === "meja" ? (
        tables.length === 0 ? (
          <div className="card p-10 text-center text-sm text-ink-muted">
            Belum ada meja. Tambahkan yang pertama.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {Array.from(tablesByOutlet.entries()).map(([outletName, list]) => (
              <div key={outletName}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                  <Building2 size={14} className="text-ink-muted" />
                  {outletName}
                  <span className="font-normal text-ink-muted">
                    &middot; {list.length} meja
                  </span>
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {list.map((t) => (
                    <div
                      key={t.id}
                      className="card flex items-center justify-between p-3.5"
                    >
                      <div>
                        <p className="text-sm font-bold text-ink">{t.name}</p>
                        <p className="text-xs text-ink-muted">{t.seats} kursi</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setQrTable(t)}
                          className="rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-ink"
                          aria-label={`QR ${t.name}`}
                        >
                          <QrCode size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteTable(t.id, t.name)}
                          disabled={isPending}
                          className="rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-accent-danger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="card max-w-md p-6">
          <h3 className="mb-1 text-sm font-bold text-ink">
            Konversi Poin Loyalty
          </h3>
          <p className="mb-5 text-xs text-ink-muted">
            Atur berapa rupiah belanja yang setara 1 poin, dan berapa
            rupiah diskon per 1 poin yang ditukar pelanggan.
          </p>

          <form onSubmit={handleSaveLoyalty} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Belanja per 1 Poin Didapat (Rp)
              </label>
              <input
                name="loyalty_earn_rate"
                type="number"
                min={1}
                step={1}
                defaultValue={company.loyalty_earn_rate}
                required
                className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <p className="mt-1 text-xs text-ink-muted">
                Contoh: 10.000 artinya tiap Rp10.000 belanja = 1 poin.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Nilai Diskon per 1 Poin Ditukar (Rp)
              </label>
              <input
                name="loyalty_redeem_rate"
                type="number"
                min={1}
                step={1}
                defaultValue={company.loyalty_redeem_rate}
                required
                className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <p className="mt-1 text-xs text-ink-muted">
                Contoh: 100 artinya 1 poin = potongan Rp100 pas dipakai.
              </p>
            </div>

            {loyaltyError && (
              <p className="text-sm text-accent-danger">{loyaltyError}</p>
            )}
            {loyaltySaved && (
              <p className="text-sm text-accent-success">
                Pengaturan loyalty tersimpan.
              </p>
            )}

            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </form>
        </div>
      )}

      <OutletFormModal
        open={outletModalOpen}
        onClose={() => setOutletModalOpen(false)}
        outlet={editingOutlet}
      />
      <TableFormModal
        open={tableModalOpen}
        onClose={() => setTableModalOpen(false)}
        outlets={outlets}
      />
      <TableQrModal
        open={Boolean(qrTable)}
        onClose={() => setQrTable(null)}
        tableId={qrTable?.id ?? ""}
        tableName={qrTable?.name ?? ""}
      />
    </div>
  );
}
