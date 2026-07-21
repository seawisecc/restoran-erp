"use client";

import { useMemo, useState, useTransition } from "react";
import { ChefHat, Pencil, Plus, Search, Tags, Trash2, X } from "lucide-react";
import { MenuFormModal } from "./MenuFormModal";
import { RecipeFormModal } from "./RecipeFormModal";
import {
  toggleMenuItemActive,
  deleteMenuItem,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
} from "@/app/(dashboard)/produk-stok/actions";

type Category = { id: string; name: string; sort_order: number };
type MenuItem = {
  id: string;
  name: string;
  category_id: string | null;
  price: number;
  unit: string;
  is_active: boolean;
  code: string | null;
};
type RawMaterial = { id: string; name: string; unit: string; cost_price: number };

export function ProdukStokClient({
  categories,
  items,
  rawMaterials,
}: {
  categories: Category[];
  items: MenuItem[];
  rawMaterials: RawMaterial[];
}) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [recipeItem, setRecipeItem] = useState<MenuItem | null>(null);
  const [isPending, startTransition] = useTransition();

  // ===== Kelola kategori =====
  const [catPanel, setCatPanel] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [catError, setCatError] = useState<string | null>(null);

  function runCat(fn: () => Promise<unknown>, done?: () => void) {
    setCatError(null);
    startTransition(async () => {
      try {
        await fn();
        done?.();
      } catch (err) {
        setCatError(err instanceof Error ? err.message : "Gagal menyimpan.");
      }
    });
  }

  function handleAddCat(e: React.FormEvent) {
    e.preventDefault();
    const name = newCat.trim();
    if (!name) return;
    const formData = new FormData();
    formData.set("name", name);
    runCat(() => createMenuCategory(formData), () => setNewCat(""));
  }

  function handleRenameCat(id: string) {
    const name = editCatName.trim();
    if (!name) return;
    runCat(() => updateMenuCategory(id, name), () => setEditingCat(null));
  }

  function handleDeleteCat(id: string, name: string) {
    const used = items.filter((i) => i.category_id === id).length;
    const msg = used
      ? `Hapus kategori "${name}"? ${used} menu di dalamnya tidak ikut terhapus, hanya jadi Tanpa kategori.`
      : `Hapus kategori "${name}"?`;
    if (!confirm(msg)) return;
    runCat(() => deleteMenuCategory(id));
  }

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? "Tanpa kategori";

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCat = activeCat === "all" || item.category_id === activeCat;
      return matchesSearch && matchesCat;
    });
  }, [items, search, activeCat]);

  function handleToggle(id: string, current: boolean) {
    startTransition(() => {
      toggleMenuItemActive(id, !current);
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus menu "${name}"? Tindakan ini tidak bisa dibatalkan.`)) {
      return;
    }
    startTransition(() => {
      deleteMenuItem(id);
    });
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Menu &amp; Stok</h1>
          <p className="text-sm text-ink-muted">
            {items.length} menu &middot; {categories.length} kategori
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCatPanel(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-surface-border bg-surface-card px-4 py-2 text-sm font-semibold text-ink-muted hover:text-ink"
          >
            <Tags size={16} /> Kelola Kategori
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary gap-2"
          >
            <Plus size={16} /> Tambah Menu
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama menu..."
          className="w-full rounded-lg border border-surface-border bg-surface-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCat("all")}
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
            activeCat === "all"
              ? "border-accent bg-accent text-white"
              : "border-surface-border bg-surface-card text-ink-muted hover:text-ink"
          }`}
        >
          Semua ({items.length})
        </button>
        {categories.map((cat) => {
          const count = items.filter((i) => i.category_id === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                activeCat === cat.id
                  ? "border-accent bg-accent text-white"
                  : "border-surface-border bg-surface-card text-ink-muted hover:text-ink"
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-muted">
          Belum ada menu yang cocok. Coba ubah pencarian/kategori, atau
          tambah menu baru.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <div key={item.id} className="card overflow-hidden">
              <div className="flex h-20 items-center justify-center bg-gradient-to-br from-surface-border to-surface text-2xl">
                🍽️
              </div>
              <div className="p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
                  {categoryName(item.category_id)}
                </p>
                <h4 className="mb-1.5 text-sm font-semibold leading-tight text-ink">
                  {item.name}
                </h4>
                <p className="mb-2.5 text-sm font-bold text-ink">
                  Rp {item.price.toLocaleString("id-ID")}
                </p>
                <div className="mb-2 flex items-center justify-between">
                  <button
                    onClick={() => handleToggle(item.id, item.is_active)}
                    disabled={isPending}
                    className={item.is_active ? "badge-success" : "badge-danger"}
                  >
                    {item.is_active ? "Aktif" : "Nonaktif"}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    disabled={isPending}
                    className="rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-accent-danger"
                    aria-label={`Hapus ${item.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <button
                  onClick={() => setRecipeItem(item)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-surface-border py-1.5 text-xs font-semibold text-ink-muted hover:text-ink"
                >
                  <ChefHat size={13} /> Resep &amp; HPP
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Kelola Kategori ===== */}
      {catPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-surface-border px-5 py-3.5">
              <div>
                <p className="text-sm font-bold text-ink">Kelola Kategori</p>
                <p className="text-xs text-ink-muted">
                  Kelompokkan menu sesuai kebutuhan restoran
                </p>
              </div>
              <button
                onClick={() => {
                  setCatPanel(false);
                  setEditingCat(null);
                  setCatError(null);
                }}
                className="rounded-md p-1 text-ink-muted hover:text-ink"
                aria-label="Tutup"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto">
              {categories.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-ink-muted">
                  Belum ada kategori. Tambahkan di bawah.
                </p>
              ) : (
                categories.map((cat, i) => {
                  const count = items.filter(
                    (it) => it.category_id === cat.id,
                  ).length;
                  const editing = editingCat === cat.id;
                  return (
                    <div
                      key={cat.id}
                      className={`flex items-center gap-2 px-5 py-3 ${
                        i !== 0 ? "border-t border-surface-border" : ""
                      }`}
                    >
                      {editing ? (
                        <>
                          <input
                            value={editCatName}
                            onChange={(e) => setEditCatName(e.target.value)}
                            autoFocus
                            className="min-w-0 flex-1 rounded-lg border border-surface-border px-2.5 py-1.5 text-sm outline-none focus:border-accent"
                          />
                          <button
                            onClick={() => handleRenameCat(cat.id)}
                            disabled={isPending}
                            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Simpan
                          </button>
                          <button
                            onClick={() => setEditingCat(null)}
                            className="rounded-lg border border-surface-border px-2.5 py-1.5 text-xs text-ink-muted"
                          >
                            Batal
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink">
                              {cat.name}
                            </p>
                            <p className="text-xs text-ink-muted">
                              {count} menu
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setEditingCat(cat.id);
                              setEditCatName(cat.name);
                            }}
                            className="rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-ink"
                            aria-label={`Ubah ${cat.name}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCat(cat.id, cat.name)}
                            disabled={isPending}
                            className="rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-accent-danger"
                            aria-label={`Hapus ${cat.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={handleAddCat}
              className="flex gap-2 border-t border-surface-border p-4"
            >
              <input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="Kategori baru, misal: Minuman"
                className="min-w-0 flex-1 rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={isPending || !newCat.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Plus size={15} /> Tambah
              </button>
            </form>

            {catError && (
              <p className="px-4 pb-4 text-sm text-accent-danger">{catError}</p>
            )}
          </div>
        </div>
      )}

      <MenuFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
      />

      <RecipeFormModal
        open={Boolean(recipeItem)}
        onClose={() => setRecipeItem(null)}
        menuItemId={recipeItem?.id ?? null}
        menuItemName={recipeItem?.name ?? ""}
        menuItemPrice={recipeItem?.price ?? 0}
        rawMaterials={rawMaterials}
      />
    </div>
  );
}
