"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, Minus, Plus } from "lucide-react";
import {
  addOrderItem,
  payOrder,
  updateOrderItemQty,
} from "@/app/(dashboard)/transaksi/actions";

type Category = { id: string; name: string; sort_order: number };
type MenuItem = { id: string; name: string; category_id: string | null; price: number };
type OrderItem = { id: string; menu_item_id: string | null; name: string; price: number; qty: number };
type Order = {
  id: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  restaurant_tables: { name: string } | null;
};

function rupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export function OrderClient({
  order,
  items,
  categories,
  menuItems,
}: {
  order: Order;
  items: OrderItem[];
  categories: Category[];
  menuItems: MenuItem[];
}) {
  const [activeCat, setActiveCat] = useState<string | "all">("all");
  const [isPending, startTransition] = useTransition();

  const filteredMenu = useMemo(() => {
    if (activeCat === "all") return menuItems;
    return menuItems.filter((m) => m.category_id === activeCat);
  }, [menuItems, activeCat]);

  function handleAdd(item: MenuItem) {
    startTransition(() => {
      addOrderItem(order.id, { id: item.id, name: item.name, price: item.price });
    });
  }

  function handleQty(itemId: string, current: number, delta: number) {
    startTransition(() => {
      updateOrderItemQty(order.id, itemId, current + delta);
    });
  }

  function handlePay() {
    if (items.length === 0) return;
    if (!confirm(`Konfirmasi pembayaran ${rupiah(order.total)}?`)) return;
    startTransition(() => {
      payOrder(order.id);
    });
  }

  return (
    <div className="-m-4 flex min-h-[calc(100vh-64px)] flex-col md:-m-6 md:flex-row">
      {/* ===== Kiri: grid menu ===== */}
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/transaksi"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-surface-card"
          >
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h2 className="text-lg font-bold text-ink">Pilih Menu</h2>
          </div>
          <span className="ml-auto rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-white">
            {order.restaurant_tables?.name ?? "Meja"}
          </span>
        </div>

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

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              disabled={isPending}
              onClick={() => handleAdd(item)}
              className="rounded-2xl border-2 border-transparent bg-surface-card p-3 text-left hover:border-accent disabled:opacity-60"
            >
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
          ))}
          {filteredMenu.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-ink-muted">
              Belum ada menu di kategori ini.
            </p>
          )}
        </div>
      </div>

      {/* ===== Kanan: keranjang ===== */}
      <aside className="flex w-full flex-col border-t border-surface-border bg-surface-card md:w-80 md:border-l md:border-t-0">
        <div className="p-4">
          <h3 className="text-base font-bold text-ink">
            Pesanan &mdash; {order.restaurant_tables?.name ?? "Meja"}
          </h3>
          <p className="text-xs text-ink-muted">{items.length} item</p>
        </div>

        <div className="max-h-[40vh] flex-1 overflow-y-auto px-4 md:max-h-none">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              Belum ada item. Tap menu di sebelah kiri untuk menambah.
            </p>
          ) : (
            items.map((it) => (
              <div
                key={it.id}
                className="flex items-start justify-between border-b border-surface-border py-2.5"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{it.name}</p>
                  <p className="text-xs text-ink-muted">
                    {rupiah(it.price)} / porsi
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <button
                      disabled={isPending}
                      onClick={() => handleQty(it.id, it.qty, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-surface-border"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-medium">{it.qty}</span>
                    <button
                      disabled={isPending}
                      onClick={() => handleQty(it.id, it.qty, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-surface-border"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-bold text-ink">
                  {rupiah(it.price * it.qty)}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-surface-border p-4">
          <div className="mb-1 flex justify-between text-sm text-ink-muted">
            <span>Subtotal</span>
            <span>{rupiah(order.subtotal)}</span>
          </div>
          <div className="mb-2 flex justify-between text-sm text-ink-muted">
            <span>Pajak (10%)</span>
            <span>{rupiah(order.tax)}</span>
          </div>
          <div className="mb-3 flex justify-between text-base font-bold text-ink">
            <span>Total</span>
            <span>{rupiah(order.total)}</span>
          </div>
          <button
            onClick={handlePay}
            disabled={isPending || items.length === 0}
            className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-50"
          >
            Bayar
          </button>
        </div>
      </aside>
    </div>
  );
}
