"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, ClipboardList, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { submitPublicOrder } from "@/app/o/[tableId]/actions";

type Category = { id: string; name: string; sort_order: number };
type MenuItem = { id: string; name: string; category_id: string | null; price: number };
type SubmittedItem = {
  id: string;
  menu_item_id: string | null;
  name: string;
  price: number;
  qty: number;
};
type CartItem = { id: string; name: string; price: number; qty: number };

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
  initialItems: SubmittedItem[];
  categories: Category[];
  menuItems: MenuItem[];
}) {
  const [activeCat, setActiveCat] = useState<string | "all">("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Item yang UDAH kekirim ke kasir (tersimpan di database).
  const submittedItems = initialItems;
  const submittedTotal = submittedItems.reduce((s, it) => s + it.price * it.qty, 0);
  const submittedCount = submittedItems.reduce((s, it) => s + it.qty, 0);

  const filteredMenu = useMemo(() => {
    if (activeCat === "all") return menuItems;
    return menuItems.filter((m) => m.category_id === activeCat);
  }, [menuItems, activeCat]);

  const cartSubtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const cartCount = cart.reduce((s, it) => s + it.qty, 0);

  function addToLocalCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, qty: c.qty + 1 } : c,
        );
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  }

  function changeLocalQty(itemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => (c.id === itemId ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0),
    );
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        await submitPublicOrder(tableId, cart);
        setCart([]);
        setJustSubmitted(true);
        setCartOpen(false);
        setTimeout(() => setJustSubmitted(false), 4500);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Gagal mengirim pesanan.");
      }
    });
  }

  return (
    <div className="min-h-screen bg-surface pb-28">
      <header className="sticky top-0 z-10 border-b border-surface-border bg-surface-card px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {companyName}
            </p>
            <h1 className="text-lg font-bold text-ink">{tableName}</h1>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-2 text-xs font-semibold text-ink-muted"
          >
            <ClipboardList size={14} /> Pesanan Saya
            {submittedCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-white">
                {submittedCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {justSubmitted && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-accent-successBg px-4 py-3 text-sm font-semibold text-accent-success">
          <CheckCircle2 size={18} />
          Pesanan berhasil dikirim ke dapur! Staf akan segera memproses.
        </div>
      )}

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
            const inCart = cart.find((c) => c.id === item.id);
            return (
              <button
                key={item.id}
                onClick={() => addToLocalCart(item)}
                className="relative rounded-2xl bg-surface-card p-3 text-left"
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

      {/* Sticky bar cuma muncul kalau ada item yang BELUM dikirim */}
      {cartCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-4 bottom-4 z-20 flex items-center justify-between rounded-2xl bg-accent px-5 py-4 text-white shadow-lg"
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <ShoppingCart size={16} /> {cartCount} item belum dikirim
          </span>
          <span className="text-sm font-bold">{rupiah(cartSubtotal)}</span>
        </button>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/40">
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-surface-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">Pesanan Kamu</h3>
              <button onClick={() => setCartOpen(false)} className="text-ink-muted">
                <X size={20} />
              </button>
            </div>

            {/* ===== Bagian 1: keranjang baru, belum dikirim ===== */}
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
              Belum Dikirim
            </div>
            {cart.length === 0 ? (
              <p className="mb-4 rounded-lg bg-surface py-6 text-center text-sm text-ink-muted">
                Belum ada menu baru dipilih. Tap menu di halaman utama buat
                nambah.
              </p>
            ) : (
              <div className="mb-4 flex flex-col gap-1">
                {cart.map((it) => (
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
                          onClick={() => changeLocalQty(it.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-surface-border"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-4 text-center text-sm font-medium">
                          {it.qty}
                        </span>
                        <button
                          onClick={() => changeLocalQty(it.id, 1)}
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
                <div className="flex justify-between pt-2 text-sm font-bold text-ink">
                  <span>Subtotal baru</span>
                  <span>{rupiah(cartSubtotal)}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={cart.length === 0 || isPending}
              className="btn-primary mb-6 w-full disabled:opacity-40"
            >
              {isPending ? "Mengirim..." : `Kirim Pesanan (${rupiah(cartSubtotal)})`}
            </button>

            {/* ===== Bagian 2: yang udah pernah dikirim (read-only) ===== */}
            {submittedItems.length > 0 && (
              <>
                <div className="mb-2 border-t border-surface-border pt-4 text-xs font-bold uppercase tracking-wide text-ink-muted">
                  Sudah Dikirim ke Dapur
                </div>
                <div className="flex flex-col gap-1">
                  {submittedItems.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between py-2 opacity-70"
                    >
                      <p className="text-sm text-ink">
                        {it.qty}&times; {it.name}
                      </p>
                      <p className="text-sm font-semibold text-ink">
                        {rupiah(it.price * it.qty)}
                      </p>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-surface-border pt-2 text-sm font-bold text-ink">
                    <span>Total sudah dikirim</span>
                    <span>{rupiah(submittedTotal)}</span>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs text-ink-muted">
                  Panggil staf kalau butuh bantuan atau siap membayar.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
