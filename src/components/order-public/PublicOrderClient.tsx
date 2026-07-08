"use client";

import { useMemo, useState, useTransition } from "react";
import { Minus, Plus, ShoppingCart, X } from "lucide-react";
import {
  addPublicOrderItem,
  updatePublicOrderItemQty,
} from "@/app/o/[tableId]/actions";

type Category = { id: string; name: string; sort_order: number };
type MenuItem = { id: string; name: string; category_id: string | null; price: number };
type OrderItem = {
  id: string;
  menu_item_id: string | null;
  name: string;
  price: number;
  qty: number;
};

function rupiah(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export function PublicOrderClient({
  tableId,
  tableName,
  companyName,
  initialItems,
  categories,
  menuItems,
}: {
  tableId: string;
  tableName: string;
  companyName: string;
  initialItems: OrderItem[];
  categories: Category[];
  menuItems: MenuItem[];
}) {
  const [activeCat, setActiveCat] = useState<string | "all">("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // initialItems ke-refresh otomatis tiap ada action (lewat
  // revalidatePath), jadi ini selalu representasi terbaru dari DB.
  const items = initialItems;

  const filteredMenu = useMemo(() => {
    if (activeCat === "all") return menuItems;
    return menuItems.filter((m) => m.category_id === activeCat);
  }, [menuItems, activeCat]);

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;
  const itemCount = items.reduce((s, it) => s + it.qty, 0);

  function handleAdd(item: MenuItem) {
    startTransition(() => {
      addPublicOrderItem(tableId, {
        id: item.id,
        name: item.name,
        price: item.price,
      });
    });
  }

  function handleQty(itemId: string, current: number, delta: number) {
    startTransition(() => {
      updatePublicOrderItemQty(tableId, itemId, current + delta);
    });
  }

  return (
    <div className="min-h-screen bg-surface pb-28">
      <header className="sticky top-0 z-10 border-b border-surface-border bg-surface-card px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {companyName}
        </p>
        <h1 className="text-lg font-bold text-ink">{tableName}</h1>
      </header>

      <div className="px-4 py-4">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCat("all")}
            className={`flex-shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold ${
              activeCat === "all"
                ? "bg-accent text-white"
                : "bg-surface-card text-ink-muted"
            }`}
          >
            Semua
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`flex-shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold ${
                activeCat === c.id
                  ? "bg-accent text-white"
                  : "bg-surface-card text-ink-muted"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filteredMenu.map((item) => {
            const inCart = items.find((it) => it.menu_item_id === item.id);
            return (
              <button
                key={item.id}
                disabled={isPending}
                onClick={() => handleAdd(item)}
                className="relative rounded-2xl bg-surface-card p-3 text-left disabled:opacity-60"
              >
                {inCart && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                    {inCart.qty}
                  </span>
                )}
                <div className="mb-2 flex h-16 items-center justify-center rounded-lg bg-gradient-to-br from-surface-border to-surface text-xl">
                  🍽️
                </div>
                <h5 className="mb-1 text-sm font-semibold leading-tight text-ink">
                  {item.name}
                </h5>
                <p className="text-sm font-bold text-ink-muted">
                  {rupiah(item.price)}
                </p>
              </button>
            );
          })}
          {filteredMenu.length === 0 && (
            <p className="col-span-full py-16 text-center text-sm text-ink-muted">
              Belum ada menu di kategori ini.
            </p>
          )}
        </div>
      </div>

      {itemCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-4 bottom-4 z-20 flex items-center justify-between rounded-2xl bg-accent px-5 py-4 text-white shadow-lg"
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <ShoppingCart size={16} /> {itemCount} item
          </span>
          <span className="text-sm font-bold">{rupiah(total)}</span>
        </button>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/40">
          <div className="max-h-[80vh] w-full overflow-y-auto rounded-t-3xl bg-surface-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">Keranjang</h3>
              <button onClick={() => setCartOpen(false)} className="text-ink-muted">
                <X size={20} />
              </button>
            </div>

            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-muted">
                Keranjang kosong.
              </p>
            ) : (
              <div className="mb-4 flex flex-col gap-1">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between border-b border-surface-border py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">{it.name}</p>
                      <p className="text-xs text-ink-muted">
                        {rupiah(it.price)} / porsi
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          disabled={isPending}
                          onClick={() => handleQty(it.id, it.qty, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-surface-border"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-4 text-center text-sm font-medium">
                          {it.qty}
                        </span>
                        <button
                          disabled={isPending}
                          onClick={() => handleQty(it.id, it.qty, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-surface-border"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <p className="w-20 text-right text-sm font-bold text-ink">
                        {rupiah(it.price * it.qty)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-surface-border pt-3">
              <div className="mb-1 flex justify-between text-sm text-ink-muted">
                <span>Subtotal</span>
                <span>{rupiah(subtotal)}</span>
              </div>
              <div className="mb-2 flex justify-between text-sm text-ink-muted">
                <span>Pajak (10%)</span>
                <span>{rupiah(tax)}</span>
              </div>
              <div className="mb-4 flex justify-between text-base font-bold text-ink">
                <span>Total</span>
                <span>{rupiah(total)}</span>
              </div>
              <p className="mb-3 text-center text-xs text-ink-muted">
                Pesanan otomatis terkirim ke kasir setiap kali kamu menambah
                menu. Panggil staf kalau butuh bantuan atau siap membayar.
              </p>
              <button onClick={() => setCartOpen(false)} className="btn-primary w-full">
                Tambah Menu Lagi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
