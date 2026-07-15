"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, UserPlus, X } from "lucide-react";
import {
  createTeamUser,
  deleteTeamUser,
  updateTeamUser,
} from "@/app/(dashboard)/pengaturan/actions";
import { MODULES } from "@/lib/modules";

export type TeamMember = {
  id: string;
  email: string;
  full_name: string | null;
  role: "owner" | "manager" | "kasir" | "staff";
  modules: string[] | null;
  is_active: boolean;
};

const ROLE_LABELS: Record<TeamMember["role"], string> = {
  owner: "Pemilik",
  manager: "Manajer",
  kasir: "Kasir",
  staff: "Staff",
};

const inputCls =
  "w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent";

export function UserManagement({ team }: { team: TeamMember[] }) {
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [role, setRole] = useState<TeamMember["role"]>("kasir");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openAdd() {
    setEditing(null);
    setRole("kasir");
    setSelectedModules(["transaksi"]);
    setError(null);
    setMode("add");
  }

  function openEdit(m: TeamMember) {
    setEditing(m);
    setRole(m.role);
    setSelectedModules(m.modules ?? []);
    setError(null);
    setMode("edit");
  }

  function toggleModule(key: string) {
    setSelectedModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    // Modul dari state checkbox (form native gak ikut karena controlled).
    if (role !== "owner") {
      for (const k of selectedModules) formData.append("modules", k);
    }

    startTransition(async () => {
      try {
        if (mode === "edit" && editing) {
          await updateTeamUser(editing.id, formData);
        } else {
          await createTeamUser(formData);
        }
        setMode("list");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan.");
      }
    });
  }

  function handleDelete(m: TeamMember) {
    if (!confirm(`Hapus akses ${m.full_name || m.email}?`)) return;
    startTransition(async () => {
      try {
        await deleteTeamUser(m.id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Gagal menghapus.");
      }
    });
  }

  if (mode !== "list") {
    const isEdit = mode === "edit";
    return (
      <div className="card max-w-xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-ink">
            {isEdit ? "Edit Pengguna" : "Tambah Pengguna"}
          </h3>
          <button
            onClick={() => setMode("list")}
            className="rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-ink"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Nama Lengkap
            </label>
            <input
              name="full_name"
              defaultValue={editing?.full_name ?? ""}
              className={inputCls}
              placeholder="misal: Budi Santoso"
            />
          </div>

          {isEdit ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Email
              </label>
              <input
                value={editing?.email ?? ""}
                disabled
                className={`${inputCls} bg-surface text-ink-muted`}
              />
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className={inputCls}
                  placeholder="nama@resto.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  className={inputCls}
                  placeholder="Minimal 6 karakter"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Role
            </label>
            <select
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as TeamMember["role"])}
              className={inputCls}
            >
              <option value="manager">Manajer</option>
              <option value="kasir">Kasir</option>
              <option value="staff">Staff</option>
              <option value="owner">Pemilik (akses penuh)</option>
            </select>
          </div>

          {role !== "owner" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">
                Modul yang bisa diakses
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MODULES.map((m) => (
                  <label
                    key={m.key}
                    className="flex items-center gap-2 rounded-lg border border-surface-border px-3 py-2 text-sm text-ink"
                  >
                    <input
                      type="checkbox"
                      checked={selectedModules.includes(m.key)}
                      onChange={() => toggleModule(m.key)}
                    />
                    {m.label}
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-ink-muted">
                Centang modul yang boleh dibuka pengguna ini.
              </p>
            </div>
          )}

          {isEdit && (
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={editing?.is_active ?? true}
              />
              Akun aktif
            </label>
          )}

          {error && <p className="text-sm text-accent-danger">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Pengguna"}
            </button>
            <button
              type="button"
              onClick={() => setMode("list")}
              className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-ink">Manajemen Pengguna</h3>
          <p className="text-sm text-ink-muted">
            Atur anggota tim beserta hak akses modul masing-masing.
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary gap-2">
          <UserPlus size={16} /> Tambah Pengguna
        </button>
      </div>

      {team.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-muted">
          Belum ada anggota tim. Tambahkan yang pertama.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden grid-cols-[1.2fr_1.6fr_0.8fr_0.7fr_0.7fr_0.6fr] gap-4 border-b border-surface-border bg-surface px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-muted md:grid">
            <span>Nama</span>
            <span>Email</span>
            <span>Role</span>
            <span>Modul</span>
            <span>Status</span>
            <span className="text-right">Aksi</span>
          </div>

          {team.map((m, i) => (
            <div
              key={m.id}
              className={`grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-[1.2fr_1.6fr_0.8fr_0.7fr_0.7fr_0.6fr] md:items-center md:gap-4 ${
                i !== 0 ? "border-t border-surface-border" : ""
              }`}
            >
              <div className="text-sm font-semibold text-ink">
                {m.full_name || "—"}
              </div>
              <div className="min-w-0 truncate text-sm text-ink-muted">
                {m.email || "—"}
              </div>
              <div className="text-sm text-ink">{ROLE_LABELS[m.role]}</div>
              <div className="text-sm text-ink-muted">
                {m.role === "owner"
                  ? "Semua"
                  : `${m.modules?.length ?? 0} modul`}
              </div>
              <div>
                <span className={m.is_active ? "badge-success" : "badge-danger"}>
                  {m.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <div className="flex gap-1 md:justify-end">
                <button
                  onClick={() => openEdit(m)}
                  className="rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-ink"
                  aria-label={`Edit ${m.email}`}
                >
                  <Pencil size={14} />
                </button>
                {m.role !== "owner" && (
                  <button
                    onClick={() => handleDelete(m)}
                    disabled={isPending}
                    className="rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-accent-danger"
                    aria-label={`Hapus ${m.email}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
