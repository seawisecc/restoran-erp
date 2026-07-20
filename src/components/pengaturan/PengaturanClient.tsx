"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  ChevronRight,
  Gift,
  Pencil,
  Plus,
  Printer,
  QrCode,
  Receipt,
  Store,
  Trash2,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import {
  deleteTable,
  toggleOutletActive,
  updateChargeSettings,
  updateCompanyProfile,
  updateLoyaltySettings,
  updateReceiptSettings,
} from "@/app/(dashboard)/pengaturan/actions";
import { useCompany } from "@/components/providers/CompanyProvider";
import { OutletFormModal } from "./OutletFormModal";
import { TableFormModal } from "./TableFormModal";
import { TableQrModal } from "./TableQrModal";
import { UserManagement, type TeamMember } from "./UserManagement";

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
type CompanyProfile = { name: string; address: string | null };

type SectionKey =
  | "profil"
  | "pengguna"
  | "biaya"
  | "nota"
  | "outlet"
  | "meja"
  | "loyalty";

const PAPER_OPTIONS = [
  {
    value: "80mm",
    label: "Thermal 80mm",
    desc: "Printer kasir thermal paling umum.",
  },
  {
    value: "58mm",
    label: "Thermal 58mm",
    desc: "Printer thermal kecil / portable.",
  },
  { value: "a4", label: "A4 / Kertas biasa", desc: "Printer inkjet atau laser." },
];

export function PengaturanClient({
  outlets,
  tables,
  company,
  team,
  receiptPaper,
}: {
  outlets: Outlet[];
  tables: TableRow[];
  company: CompanyProfile;
  team: TeamMember[];
  receiptPaper: string;
}) {
  const { company: activeCompany, role } = useCompany();
  const isOwner = role === "owner";

  const [section, setSection] = useState<SectionKey>("profil");
  const [outletModalOpen, setOutletModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [qrTable, setQrTable] = useState<TableRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loyaltyError, setLoyaltyError] = useState<string | null>(null);
  const [loyaltySaved, setLoyaltySaved] = useState(false);
  const [chargeSaved, setChargeSaved] = useState(false);
  const [chargeError, setChargeError] = useState<string | null>(null);
  const [paperSaved, setPaperSaved] = useState(false);
  const [paperError, setPaperError] = useState<string | null>(null);
  const [paper, setPaper] = useState(receiptPaper);

  function handleToggleOutlet(id: string, current: boolean) {
    startTransition(() => {
      toggleOutletActive(id, !current);
    });
  }

  function handleDeleteTable(id: string, name: string) {
    if (!confirm(`Hapus ${name}? Riwayat transaksi meja ini tetap tersimpan.`))
      return;
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

  function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileError(null);
    setProfileSaved(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateCompanyProfile(formData);
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 2500);
      } catch (err) {
        setProfileError(
          err instanceof Error ? err.message : "Gagal menyimpan profil.",
        );
      }
    });
  }

  function handleSavePaper(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPaperError(null);
    setPaperSaved(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateReceiptSettings(formData);
        setPaperSaved(true);
        setTimeout(() => setPaperSaved(false), 2500);
      } catch (err) {
        setPaperError(
          err instanceof Error ? err.message : "Gagal menyimpan pengaturan.",
        );
      }
    });
  }

  function handleSaveCharge(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setChargeError(null);
    setChargeSaved(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateChargeSettings(formData);
        setChargeSaved(true);
        setTimeout(() => setChargeSaved(false), 2500);
      } catch (err) {
        setChargeError(
          err instanceof Error ? err.message : "Gagal menyimpan pengaturan.",
        );
      }
    });
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

  // Kelompokin meja per outlet.
  const tablesByOutlet = new Map<string, TableRow[]>();
  for (const t of tables) {
    const key = t.outlets?.name ?? "Tanpa outlet";
    if (!tablesByOutlet.has(key)) tablesByOutlet.set(key, []);
    tablesByOutlet.get(key)!.push(t);
  }
  for (const list of tablesByOutlet.values()) {
    list.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );
  }

  const navItems: {
    key: SectionKey;
    label: string;
    desc: string;
    icon: LucideIcon;
    show: boolean;
  }[] = [
    { key: "profil", label: "Profil Resto", desc: "Nama & alamat restoran", icon: Store, show: true },
    { key: "pengguna", label: "Manajemen Pengguna", desc: "Akses pengguna, anggota tim", icon: Users, show: isOwner },
    { key: "biaya", label: "Pajak & Service", desc: "Biaya di tiap transaksi", icon: Receipt, show: true },
    { key: "nota", label: "Nota & Printer", desc: "Ukuran kertas struk", icon: Printer, show: true },
    { key: "outlet", label: "Outlet", desc: "Cabang & lokasi", icon: Building2, show: true },
    { key: "meja", label: "Meja", desc: "Denah & QR meja", icon: UtensilsCrossed, show: true },
    { key: "loyalty", label: "Loyalty", desc: "Konversi poin pelanggan", icon: Gift, show: true },
  ];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Pengaturan</h1>
        <p className="text-sm text-ink-muted">
          Kelola profil restoran, pengguna, outlet, dan meja.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        {/* ===== Left nav ===== */}
        <nav className="flex flex-col gap-2">
          {navItems
            .filter((n) => n.show)
            .map((n) => {
              const active = section === n.key;
              const Icon = n.icon;
              return (
                <button
                  key={n.key}
                  onClick={() => setSection(n.key)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                    active
                      ? "border-accent bg-surface-card shadow-sm"
                      : "border-surface-border bg-surface-card hover:border-accent/40"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      active ? "bg-accent text-white" : "bg-surface text-ink-muted"
                    }`}
                  >
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">
                      {n.label}
                    </span>
                    <span className="block truncate text-xs text-ink-muted">
                      {n.desc}
                    </span>
                  </span>
                  <ChevronRight size={16} className="text-ink-muted" />
                </button>
              );
            })}
        </nav>

        {/* ===== Right panel ===== */}
        <section>
          {section === "profil" && (
            <div className="card max-w-xl p-6">
              <h3 className="mb-1 text-base font-bold text-ink">Profil Resto</h3>
              <p className="mb-5 text-xs text-ink-muted">
                Nama & alamat ini dipakai di struk dan tampilan aplikasi.
              </p>
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Nama Restoran
                  </label>
                  <input
                    name="name"
                    required
                    defaultValue={company.name}
                    disabled={!isOwner}
                    className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent disabled:bg-surface disabled:text-ink-muted"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Alamat
                  </label>
                  <textarea
                    name="address"
                    rows={3}
                    defaultValue={company.address ?? ""}
                    disabled={!isOwner}
                    className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent disabled:bg-surface disabled:text-ink-muted"
                    placeholder="Alamat lengkap restoran"
                  />
                </div>

                {profileError && (
                  <p className="text-sm text-accent-danger">{profileError}</p>
                )}
                {profileSaved && (
                  <p className="text-sm text-accent-success">Profil tersimpan.</p>
                )}

                {isOwner ? (
                  <button type="submit" disabled={isPending} className="btn-primary">
                    {isPending ? "Menyimpan..." : "Simpan Profil"}
                  </button>
                ) : (
                  <p className="text-xs text-ink-muted">
                    Hanya pemilik yang bisa mengubah profil.
                  </p>
                )}
              </form>
            </div>
          )}

          {section === "pengguna" && isOwner && <UserManagement team={team} />}

          {section === "biaya" && (
            <div className="card max-w-md p-6">
              <h3 className="mb-1 text-base font-bold text-ink">
                Pajak & Service Charge
              </h3>
              <p className="mb-5 text-xs text-ink-muted">
                Atur biaya yang otomatis ditambahkan di tiap transaksi. Matikan
                kalau restoran Anda tidak memungutnya.
              </p>
              <form onSubmit={handleSaveCharge} className="flex flex-col gap-5">
                {/* Pajak */}
                <div className="rounded-xl border border-surface-border p-4">
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink">
                      Pajak (PB1 / PPN)
                    </span>
                    <input
                      type="checkbox"
                      name="tax_enabled"
                      defaultChecked={activeCompany.tax_enabled}
                      disabled={!isOwner}
                      className="h-4 w-4"
                    />
                  </label>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      name="tax_rate"
                      min={0}
                      max={100}
                      step="0.1"
                      defaultValue={activeCompany.tax_rate}
                      disabled={!isOwner}
                      className="w-24 rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent disabled:bg-surface"
                    />
                    <span className="text-sm text-ink-muted">% dari subtotal</span>
                  </div>
                </div>

                {/* Service */}
                <div className="rounded-xl border border-surface-border p-4">
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink">
                      Service Charge
                    </span>
                    <input
                      type="checkbox"
                      name="service_enabled"
                      defaultChecked={activeCompany.service_enabled}
                      disabled={!isOwner}
                      className="h-4 w-4"
                    />
                  </label>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      name="service_rate"
                      min={0}
                      max={100}
                      step="0.1"
                      defaultValue={activeCompany.service_rate}
                      disabled={!isOwner}
                      className="w-24 rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent disabled:bg-surface"
                    />
                    <span className="text-sm text-ink-muted">% dari subtotal</span>
                  </div>
                </div>

                <p className="text-xs text-ink-muted">
                  Urutan hitung: pajak dikenakan atas (subtotal + service).
                </p>

                {chargeError && (
                  <p className="text-sm text-accent-danger">{chargeError}</p>
                )}
                {chargeSaved && (
                  <p className="text-sm text-accent-success">
                    Pengaturan biaya tersimpan.
                  </p>
                )}

                {isOwner ? (
                  <button type="submit" disabled={isPending} className="btn-primary">
                    {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
                  </button>
                ) : (
                  <p className="text-xs text-ink-muted">
                    Hanya pemilik yang bisa mengubah pengaturan ini.
                  </p>
                )}
              </form>
            </div>
          )}

          {section === "nota" && (
            <div className="card max-w-md p-6">
              <h3 className="mb-1 text-base font-bold text-ink">
                Nota &amp; Printer
              </h3>
              <p className="mb-5 text-xs text-ink-muted">
                Pilih ukuran kertas printer struk. Layout nota otomatis
                menyesuaikan saat dicetak.
              </p>
              <form onSubmit={handleSavePaper} className="flex flex-col gap-4">
                <div className="space-y-2.5">
                  {PAPER_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                        paper === opt.value
                          ? "border-accent bg-surface"
                          : "border-surface-border hover:border-accent/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="receipt_paper"
                        value={opt.value}
                        checked={paper === opt.value}
                        onChange={() => setPaper(opt.value)}
                        disabled={!isOwner}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-ink">
                          {opt.label}
                        </span>
                        <span className="block text-xs text-ink-muted">
                          {opt.desc}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>

                <p className="text-xs text-ink-muted">
                  Catatan: pemotongan kertas otomatis dan buka laci uang perlu
                  aplikasi pendukung di komputer kasir, tidak bisa dari browser.
                </p>

                {paperError && (
                  <p className="text-sm text-accent-danger">{paperError}</p>
                )}
                {paperSaved && (
                  <p className="text-sm text-accent-success">
                    Pengaturan nota tersimpan.
                  </p>
                )}

                {isOwner ? (
                  <button type="submit" disabled={isPending} className="btn-primary">
                    {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
                  </button>
                ) : (
                  <p className="text-xs text-ink-muted">
                    Hanya pemilik yang bisa mengubah pengaturan ini.
                  </p>
                )}
              </form>
            </div>
          )}

          {section === "outlet" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-ink">Outlet</h3>
                <button onClick={openAddOutlet} className="btn-primary gap-2">
                  <Plus size={16} /> Tambah Outlet
                </button>
              </div>
              {outlets.length === 0 ? (
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
              )}
            </div>
          )}

          {section === "meja" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-ink">Meja</h3>
                <button
                  onClick={() => setTableModalOpen(true)}
                  className="btn-primary gap-2"
                >
                  <Plus size={16} /> Tambah Meja
                </button>
              </div>
              {tables.length === 0 ? (
                <div className="card p-10 text-center text-sm text-ink-muted">
                  Belum ada meja. Tambahkan yang pertama.
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {Array.from(tablesByOutlet.entries()).map(
                    ([outletName, list]) => (
                      <div key={outletName}>
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                          <Building2 size={14} className="text-ink-muted" />
                          {outletName}
                          <span className="font-normal text-ink-muted">
                            &middot; {list.length} meja
                          </span>
                        </h4>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                          {list.map((t) => (
                            <div
                              key={t.id}
                              className="card flex items-center justify-between p-3.5"
                            >
                              <div>
                                <p className="text-sm font-bold text-ink">
                                  {t.name}
                                </p>
                                <p className="text-xs text-ink-muted">
                                  {t.seats} kursi
                                </p>
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
                    ),
                  )}
                </div>
              )}
            </div>
          )}

          {section === "loyalty" && (
            <div className="card max-w-md p-6">
              <h3 className="mb-1 text-sm font-bold text-ink">
                Konversi Poin Loyalty
              </h3>
              <p className="mb-5 text-xs text-ink-muted">
                Atur berapa rupiah belanja yang setara 1 poin, dan berapa rupiah
                diskon per 1 poin yang ditukar pelanggan.
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
                    defaultValue={activeCompany.loyalty_earn_rate}
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
                    defaultValue={activeCompany.loyalty_redeem_rate}
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
        </section>
      </div>

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
