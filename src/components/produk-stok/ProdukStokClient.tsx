"use client";

import { useMemo, useState, useTransition } from "react";
import { ChefHat, Plus, Search, Trash2 } from "lucide-react";
import { MenuFormModal } from "./MenuFormModal";
import { RecipeFormModal } from "./RecipeFormModal";
import { toggleMenuItemActive, deleteMenuItem } from "@/app/(dashboard)/produk-stok/actions";

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
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary gap-2"
        >
          <Plus size={16} /> Tambah Menu
        </button>
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
