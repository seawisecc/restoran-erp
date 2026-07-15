"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, Gift, Minus, Plus } from "lucide-react";
import {
  addOrderItem,
  getCustomerPoints,
  payOrder,
  updateOrderItemQty,
} from "@/app/(dashboard)/transaksi/actions";
import { useCompany } from "@/components/providers/CompanyProvider";

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
  const { company } = useCompany();
  const redeemRate = company.loyalty_redeem_rate;
  const earnRate = company.loyalty_earn_rate;

  const [activeCat, setActiveCat] = useState<string | "all">("all");
  const [isPending, startTransition] = useTransition();

  // ===== Keranjang optimistic =====
  // `cart` adalah sumber tampilan langsung: tiap tap menu / ubah qty
  // meng-update state ini SEKETIKA, lalu server action jalan di
  // belakang. Jadi kasir gak nunggu round-trip server tiap tap.
  const [cart, setCart] = useState<OrderItem[]>(items);
  const pendingCount = useRef(0);

  // Sinkronkan ulang dari server hanya saat tidak ada aksi berjalan,
  // supaya data optimistic gak ketimpa hasil lama.
  useEffect(() => {
    if (pendingCount.current === 0) setCart(items);
  }, [items]);

  function runAction(fn: () => Promise<unknown>) {
    pendingCount.current += 1;
    startTransition(async () => {
      try {
        await fn();
      } finally {
        pendingCount.current -= 1;
      }
    });
  }

  // ===== Loyalty poin =====
  const [phone, setPhone] = useState("");
  const [customerPoints, setCustomerPoints] = useState<number | null>(null);
  const [checkingPoints, setCheckingPoints] = useState(false);
  const [redeemChecked, setRedeemChecked] = useState(false);

  const filteredMenu = useMemo(() => {
    if (activeCat === "all") return menuItems;
    return menuItems.filter((m) => m.category_id === activeCat);
  }, [menuItems, activeCat]);

  function handleAdd(item: MenuItem) {
    // Update tampilan seketika.
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menu_item_id === item.id ? { ...c, qty: c.qty + 1 } : c,
        );
      }
      return [
        ...prev,
        {
          id: `temp-${item.id}`,
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          qty: 1,
        },
      ];
    });

    // Persist di belakang, lalu ganti id sementara dengan id asli.
    runAction(async () => {
      const res = await addOrderItem(order.id, {
        id: item.id,
        name: item.name,
        price: item.price,
      });
      if (res?.id) {
        setCart((prev) =>
          prev.map((c) =>
            c.menu_item_id === item.id ? { ...c, id: res.id, qty: res.qty } : c,
          ),
        );
      }
    });
  }

  function handleQty(itemId: string, current: number, delta: number) {
    // Baris yang masih pakai id sementara belum punya id asli di DB —
    // tunggu rekonsiliasi add dulu (jendela ini sangat singkat).
    if (itemId.startsWith("temp-")) return;

    const next = current + delta;
    setCart((prev) =>
      next <= 0
        ? prev.filter((c) => c.id !== itemId)
        : prev.map((c) => (c.id === itemId ? { ...c, qty: next } : c)),
    );

    runAction(() => updateOrderItemQty(order.id, itemId, next));
  }

  async function handleCheckPoints() {
    const trimmed = phone.trim();
    if (!trimmed) return;
    setCheckingPoints(true);
    const points = await getCustomerPoints(trimmed);
    setCustomerPoints(points);
    setCheckingPoints(false);
  }

  // Total dihitung dari keranjang optimistic (bukan dari order di
  // server), supaya angka langsung ikut berubah tiap tap tanpa nunggu
  // server recalc.
  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  // Poin yang bisa dipakai dibatasi biar diskonnya gak lebih gede
  // dari total belanja.
  const maxRedeemablePoints = redeemRate > 0 ? Math.floor(total / redeemRate) : 0;
  const usablePoints =
    customerPoints !== null ? Math.min(customerPoints, maxRedeemablePoints) : 0;
  const discountAmount = redeemChecked ? usablePoints * redeemRate : 0;
  const finalTotal = total - discountAmount;
  const pointsToEarn = earnRate > 0 ? Math.floor(finalTotal / earnRate) : 0;

  function handlePay() {
    if (cart.length === 0) return;
    if (!confirm(`Konfirmasi pembayaran ${rupiah(finalTotal)}?`)) return;
    startTransition(() => {
      payOrder(order.id, {
        phone: phone.trim() || undefined,
        redeemPoints: redeemChecked ? usablePoints : 0,
      });
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
              onClick={() => handleAdd(item)}
              className="rounded-2xl border-2 border-transparent bg-surface-card p-3 text-left transition-colors hover:border-accent active:scale-[0.98]"
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
          <p className="text-xs text-ink-muted">{cart.length} item</p>
        </div>

        <div className="max-h-[35vh] flex-1 overflow-y-auto px-4 md:max-h-none">
          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              Belum ada item. Tap menu di sebelah kiri untuk menambah.
            </p>
          ) : (
            cart.map((it) => (
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
                      onClick={() => handleQty(it.id, it.qty, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-surface-border active:scale-95"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-medium">{it.qty}</span>
                    <button
                      onClick={() => handleQty(it.id, it.qty, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-surface-border active:scale-95"
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

        {/* ===== Loyalty poin ===== */}
        <div className="border-t border-surface-border p-4">
          <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
            <Gift size={13} /> Nomor HP Pelanggan (opsional)
          </label>
          <div className="flex gap-2">
            <input
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setCustomerPoints(null);
                setRedeemChecked(false);
              }}
              placeholder="08123456789"
              className="flex-1 rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={handleCheckPoints}
              disabled={!phone.trim() || checkingPoints}
              className="rounded-lg border border-surface-border px-3 py-2 text-xs font-semibold text-ink-muted disabled:opacity-50"
            >
              {checkingPoints ? "..." : "Cek"}
            </button>
          </div>

          {customerPoints !== null && (
            <div className="mt-2 rounded-lg bg-surface p-2.5 text-xs">
              <p className="mb-1 text-ink-muted">
                Poin tersedia: <span className="font-bold text-ink">{customerPoints}</span>
              </p>
              {maxRedeemablePoints > 0 && customerPoints > 0 && (
                <label className="flex items-center gap-2 text-ink">
                  <input
                    type="checkbox"
                    checked={redeemChecked}
                    onChange={(e) => setRedeemChecked(e.target.checked)}
                  />
                  Pakai {usablePoints} poin (potongan {rupiah(usablePoints * redeemRate)})
                </label>
              )}
              {pointsToEarn > 0 && (
                <p className="mt-1 text-accent-success">
                  +{pointsToEarn} poin akan didapat dari transaksi ini
                </p>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-surface-border p-4">
          <div className="mb-1 flex justify-between text-sm text-ink-muted">
            <span>Subtotal</span>
            <span>{rupiah(subtotal)}</span>
          </div>
          <div className="mb-1 flex justify-between text-sm text-ink-muted">
            <span>Pajak (10%)</span>
            <span>{rupiah(tax)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="mb-1 flex justify-between text-sm text-accent-success">
              <span>Diskon Poin</span>
              <span>-{rupiah(discountAmount)}</span>
            </div>
          )}
          <div className="mb-3 flex justify-between text-base font-bold text-ink">
            <span>Total</span>
            <span>{rupiah(finalTotal)}</span>
          </div>
          <button
            onClick={handlePay}
            disabled={isPending || cart.length === 0}
            className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-50"
          >
            Bayar
          </button>
        </div>
      </aside>
    </div>
  );
}
