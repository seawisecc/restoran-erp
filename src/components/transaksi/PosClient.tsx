"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Gift,
  History,
  Minus,
  Plus,
  Printer,
  ShoppingBag,
  X,
} from "lucide-react";
import {
  addOrderItem,
  getCustomerPoints,
  openExistingOrder,
  openTableOrder,
  openTakeawayOrder,
  payOrder,
  updateOrderItemQty,
} from "@/app/(dashboard)/transaksi/actions";
import { useCompany } from "@/components/providers/CompanyProvider";

type Table = { id: string; name: string; seats: number; outlet_id: string };
type OpenOrder = {
  id: string;
  table_id: string | null;
  created_at: string;
  outlet_id: string;
};
type ActiveOrder = {
  id: string;
  label: string;
  isTakeaway: boolean;
};
type Receipt = {
  label: string;
  items: OrderItem[];
  subtotal: number;
  service: number;
  tax: number;
  discountAmount: number;
  total: number;
  pointsEarned: number;
  pointsRedeemed: number;
  paidAt: string;
};
type Outlet = { id: string; name: string };
type Category = { id: string; name: string; sort_order: number };
type MenuItem = {
  id: string;
  name: string;
  category_id: string | null;
  price: number;
};
type OrderItem = {
  id: string;
  menu_item_id: string | null;
  name: string;
  price: number;
  qty: number;
};

function rupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}
/**
 * CSS cetak yang menyesuaikan ukuran kertas printer nota.
 * Aturan dasar (menyembunyikan elemen selain #struk-print) sudah ada di
 * globals.css — di sini kita atur lebar kertas, font, dan memastikan
 * struk tercetak penuh (bukan terpotong scroll modal) serta hitam pekat.
 */
function printCss(paper: string) {
  const isA4 = paper === "a4";
  const width = paper === "58mm" ? "58mm" : "80mm";

  const page = isA4
    ? "@page { size: A4; margin: 14mm; }"
    : `@page { size: ${width} auto; margin: 0; }`;

  const box = isA4
    ? "width: 100% !important; max-width: 150mm; font-size: 12px; padding: 0 !important;"
    : `width: ${width} !important; font-size: ${
        paper === "58mm" ? "9.5px" : "11px"
      }; padding: ${paper === "58mm" ? "2mm" : "3mm"} !important;`;

  return `
@media print {
  ${page}
  html, body { background: #fff !important; }
  /* Struk harus tercetak utuh — batas tinggi & scroll modal dilepas. */
  #struk-print {
    ${box}
    max-height: none !important;
    overflow: visible !important;
  }
  /* Printer thermal hanya hitam-putih: paksa teks pekat, buang dekorasi. */
  #struk-print, #struk-print * {
    color: #000 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
}
`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function timeAgo(iso: string) {
  const mins = Math.max(
    1,
    Math.round((Date.now() - new Date(iso).getTime()) / 60000),
  );
  if (mins < 60) return `${mins} menit lalu`;
  return `${Math.round(mins / 60)} jam lalu`;
}

export function PosClient({
  outlets,
  tables,
  openOrders,
  categories,
  menuItems,
  initialOutletId,
  receiptPaper,
}: {
  outlets: Outlet[];
  tables: Table[];
  openOrders: OpenOrder[];
  categories: Category[];
  menuItems: MenuItem[];
  initialOutletId: string | null;
  receiptPaper: string;
}) {
  const { company } = useCompany();
  const redeemRate = company.loyalty_redeem_rate;
  const earnRate = company.loyalty_earn_rate;
  const taxRate = company.tax_enabled ? Number(company.tax_rate) : 0;
  const serviceRate = company.service_enabled ? Number(company.service_rate) : 0;

  const [view, setView] = useState<"grid" | "order">("grid");
  const [activeOutletId, setActiveOutletId] = useState<string | null>(
    initialOutletId,
  );
  const [openState, setOpenState] = useState<OpenOrder[]>(openOrders);

  // ===== Order aktif =====
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [activeCat, setActiveCat] = useState<string | "all">("all");

  // Antrean tulis: semua perubahan item dikirim ke server BERURUTAN
  // supaya server melihat urutan yang benar (gak ada lost-update saat
  // tap cepat), tanpa bikin UI nunggu (UI update optimistik duluan).
  const writeQueue = useRef<Promise<unknown>>(Promise.resolve());
  function enqueue(fn: () => Promise<unknown>) {
    const next = writeQueue.current.then(fn).catch(() => {});
    writeQueue.current = next;
    return next;
  }
  const [, startTransition] = useTransition();
  const [payPending, startPayTransition] = useTransition();

  // ===== Loyalty =====
  const [phone, setPhone] = useState("");
  const [customerPoints, setCustomerPoints] = useState<number | null>(null);
  const [checkingPoints, setCheckingPoints] = useState(false);
  const [redeemChecked, setRedeemChecked] = useState(false);

  function resetLoyalty() {
    setPhone("");
    setCustomerPoints(null);
    setCheckingPoints(false);
    setRedeemChecked(false);
  }

  const orderByTable = useMemo(
    () => new Map(openState.map((o) => [o.table_id, o])),
    [openState],
  );

  const visibleTables = useMemo(() => {
    const list = tables.filter((t) => t.outlet_id === activeOutletId);
    return list.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );
  }, [tables, activeOutletId]);

  const filteredMenu = useMemo(() => {
    if (activeCat === "all") return menuItems;
    return menuItems.filter((m) => m.category_id === activeCat);
  }, [menuItems, activeCat]);

  // ===== Buka order (tanpa navigasi) =====
  function enterOrderView(label: string, isTakeaway: boolean) {
    setOrder({ id: "", label, isTakeaway });
    setCart([]);
    resetLoyalty();
    setActiveCat("all");
    setOrderLoading(true);
    setView("order");
  }

  function openTable(table: Table) {
    enterOrderView(table.name, false);
    startTransition(async () => {
      try {
        const res = await openTableOrder(table.id);
        setOrder({ id: res.orderId, label: table.name, isTakeaway: false });
        setCart(res.items);
        if (res.isNew) {
          setOpenState((prev) => [
            ...prev,
            {
              id: res.orderId,
              table_id: table.id,
              created_at: res.createdAt,
              outlet_id: table.outlet_id,
            },
          ]);
        }
      } catch {
        setView("grid");
        setOrder(null);
      } finally {
        setOrderLoading(false);
      }
    });
  }

  /** Pesanan bungkus/bawa pulang — order tanpa meja. */
  function openTakeaway() {
    if (!activeOutletId) return;
    enterOrderView("Take Away", true);
    startTransition(async () => {
      try {
        const res = await openTakeawayOrder(activeOutletId);
        setOrder({ id: res.orderId, label: "Take Away", isTakeaway: true });
        setCart([]);
        setOpenState((prev) => [
          ...prev,
          {
            id: res.orderId,
            table_id: null,
            created_at: res.createdAt,
            outlet_id: activeOutletId,
          },
        ]);
      } catch {
        setView("grid");
        setOrder(null);
      } finally {
        setOrderLoading(false);
      }
    });
  }

  /** Lanjutkan pesanan take away yang masih terbuka. */
  function resumeTakeaway(openOrder: OpenOrder, label: string) {
    enterOrderView(label, true);
    startTransition(async () => {
      try {
        const res = await openExistingOrder(openOrder.id);
        setOrder({ id: res.orderId, label, isTakeaway: true });
        setCart(res.items);
      } catch {
        setView("grid");
        setOrder(null);
      } finally {
        setOrderLoading(false);
      }
    });
  }

  function backToGrid() {
    setView("grid");
    setOrder(null);
    setCart([]);
    resetLoyalty();
  }

  // ===== Tambah / ubah item (optimistik + antrean tulis) =====
  function handleAdd(item: MenuItem) {
    if (!order?.id) return;
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

    enqueue(async () => {
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
    if (itemId.startsWith("temp-") || !order?.id) return;
    const next = current + delta;
    setCart((prev) =>
      next <= 0
        ? prev.filter((c) => c.id !== itemId)
        : prev.map((c) => (c.id === itemId ? { ...c, qty: next } : c)),
    );
    enqueue(() => Promise.resolve(updateOrderItemQty(order.id, itemId, next)));
  }

  async function handleCheckPoints() {
    const trimmed = phone.trim();
    if (!trimmed) return;
    setCheckingPoints(true);
    const points = await getCustomerPoints(trimmed);
    setCustomerPoints(points);
    setCheckingPoints(false);
  }

  // ===== Totals (optimistik, ikut pengaturan pajak/service) =====
  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const service = Math.round((subtotal * serviceRate) / 100);
  const tax = Math.round(((subtotal + service) * taxRate) / 100);
  const total = subtotal + service + tax;

  const maxRedeemablePoints = redeemRate > 0 ? Math.floor(total / redeemRate) : 0;
  const usablePoints =
    customerPoints !== null ? Math.min(customerPoints, maxRedeemablePoints) : 0;
  const discountAmount = redeemChecked ? usablePoints * redeemRate : 0;
  const finalTotal = total - discountAmount;
  const pointsToEarn = earnRate > 0 ? Math.floor(finalTotal / earnRate) : 0;

  function handlePay() {
    if (cart.length === 0 || !order?.id) return;
    if (!confirm(`Konfirmasi pembayaran ${rupiah(finalTotal)}?`)) return;
    const currentOrderId = order.id;
    const label = order.label;
    const itemsSnapshot = cart.map((c) => ({ ...c }));

    startPayTransition(async () => {
      // Pastikan semua penulisan item selesai dulu sebelum server
      // menghitung ulang total final.
      await writeQueue.current;
      const res = await payOrder(currentOrderId, {
        phone: phone.trim() || undefined,
        redeemPoints: redeemChecked ? usablePoints : 0,
      });
      setOpenState((prev) => prev.filter((o) => o.id !== currentOrderId));
      // Angka nota diambil dari hasil hitung server (bukan client),
      // supaya struk persis sama dengan yang tersimpan.
      setReceipt({
        label,
        items: itemsSnapshot,
        subtotal: res.subtotal,
        service: res.service,
        tax: res.tax,
        discountAmount: res.discountAmount,
        total: res.total,
        pointsEarned: res.pointsEarned,
        pointsRedeemed: res.pointsRedeemed,
        paidAt: res.paidAt,
      });
      backToGrid();
    });
  }

  // ===== Take away yang masih terbuka di outlet aktif =====
  const takeaways = useMemo(
    () =>
      openState
        .filter((o) => o.table_id === null && o.outlet_id === activeOutletId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [openState, activeOutletId],
  );

  const outletName = outlets.find((o) => o.id === activeOutletId)?.name ?? "";

  // ===== Nota =====
  const receiptModal = receipt ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <style dangerouslySetInnerHTML={{ __html: printCss(receiptPaper) }} />
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <p className="text-sm font-bold text-ink">Pembayaran Berhasil</p>
          <button
            onClick={() => setReceipt(null)}
            className="rounded-md p-1 text-ink-muted hover:text-ink"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Bagian yang ikut tercetak (lihat aturan @media print) */}
        <div
          id="struk-print"
          className="max-h-[65vh] overflow-y-auto bg-white px-6 py-5 text-[#1c2620]"
        >
          <div className="text-center">
            <p className="text-base font-bold">{company.name}</p>
            {outletName && (
              <p className="text-xs text-ink-muted">{outletName}</p>
            )}
          </div>

          <div className="my-3 border-t border-dashed border-surface-border" />

          <div className="flex justify-between text-xs text-ink-muted">
            <span className="font-semibold text-ink">{receipt.label}</span>
            <span>{formatDateTime(receipt.paidAt)}</span>
          </div>

          <div className="my-3 border-t border-dashed border-surface-border" />

          <div className="space-y-2">
            {receipt.items.map((it) => (
              <div key={it.id} className="flex justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="font-medium">{it.name}</p>
                  <p className="text-ink-muted">
                    {it.qty} × {rupiah(it.price)}
                  </p>
                </div>
                <span className="shrink-0 font-semibold">
                  {rupiah(it.price * it.qty)}
                </span>
              </div>
            ))}
          </div>

          <div className="my-3 border-t border-dashed border-surface-border" />

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-ink-muted">
              <span>Subtotal</span>
              <span>{rupiah(receipt.subtotal)}</span>
            </div>
            {receipt.service > 0 && (
              <div className="flex justify-between text-ink-muted">
                <span>Service</span>
                <span>{rupiah(receipt.service)}</span>
              </div>
            )}
            {receipt.tax > 0 && (
              <div className="flex justify-between text-ink-muted">
                <span>Pajak</span>
                <span>{rupiah(receipt.tax)}</span>
              </div>
            )}
            {receipt.discountAmount > 0 && (
              <div className="flex justify-between text-ink-muted">
                <span>Diskon Poin</span>
                <span>-{rupiah(receipt.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-surface-border pt-1.5 text-sm font-bold">
              <span>TOTAL</span>
              <span>{rupiah(receipt.total)}</span>
            </div>
          </div>

          {(receipt.pointsEarned > 0 || receipt.pointsRedeemed > 0) && (
            <>
              <div className="my-3 border-t border-dashed border-surface-border" />
              <div className="space-y-0.5 text-[11px] text-ink-muted">
                {receipt.pointsRedeemed > 0 && (
                  <p>Poin dipakai: {receipt.pointsRedeemed}</p>
                )}
                {receipt.pointsEarned > 0 && (
                  <p>Poin didapat: +{receipt.pointsEarned}</p>
                )}
              </div>
            </>
          )}

          <p className="mt-4 text-center text-[11px] text-ink-muted">
            Terima kasih atas kunjungan Anda.
          </p>
        </div>

        <div className="flex gap-2 border-t border-surface-border p-4">
          <button
            onClick={() => setReceipt(null)}
            className="flex-1 rounded-lg border border-surface-border py-2.5 text-sm font-semibold text-ink-muted hover:text-ink"
          >
            Selesai
          </button>
          <button
            onClick={() => window.print()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            <Printer size={15} /> Cetak Nota
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // ============================ RENDER ============================
  if (view === "order") {
    return (
      <div className="-m-4 flex min-h-[calc(100vh-64px)] flex-col md:-m-6 md:flex-row">
        {/* ===== Kiri: grid menu ===== */}
        <div className="flex-1 p-4 md:p-6">
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={backToGrid}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-surface-card"
              aria-label="Kembali ke meja"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-lg font-bold text-ink">Pilih Menu</h2>
            <span className="ml-auto rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-white">
              {order?.label ?? "Pesanan"}
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
                disabled={orderLoading}
                onClick={() => handleAdd(item)}
                className="rounded-2xl border-2 border-transparent bg-surface-card p-3 text-left transition-colors hover:border-accent active:scale-[0.98] disabled:opacity-50"
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
              Pesanan &mdash; {order?.label ?? "Pesanan"}
            </h3>
            <p className="text-xs text-ink-muted">
              {orderLoading ? "Menyiapkan..." : `${cart.length} item`}
            </p>
          </div>

          <div className="max-h-[35vh] flex-1 overflow-y-auto px-4 md:max-h-none">
            {cart.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-muted">
                {orderLoading
                  ? "Memuat pesanan meja..."
                  : "Belum ada item. Tap menu di sebelah kiri untuk menambah."}
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

          {/* Loyalty */}
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
                  Poin tersedia:{" "}
                  <span className="font-bold text-ink">{customerPoints}</span>
                </p>
                {maxRedeemablePoints > 0 && customerPoints > 0 && (
                  <label className="flex items-center gap-2 text-ink">
                    <input
                      type="checkbox"
                      checked={redeemChecked}
                      onChange={(e) => setRedeemChecked(e.target.checked)}
                    />
                    Pakai {usablePoints} poin (potongan{" "}
                    {rupiah(usablePoints * redeemRate)})
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
            {serviceRate > 0 && (
              <div className="mb-1 flex justify-between text-sm text-ink-muted">
                <span>Service ({serviceRate}%)</span>
                <span>{rupiah(service)}</span>
              </div>
            )}
            {taxRate > 0 && (
              <div className="mb-1 flex justify-between text-sm text-ink-muted">
                <span>Pajak ({taxRate}%)</span>
                <span>{rupiah(tax)}</span>
              </div>
            )}
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
              disabled={payPending || cart.length === 0}
              className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {payPending ? "Memproses..." : "Bayar"}
            </button>
          </div>
        </aside>
      </div>
    );
  }

  // ===== View: grid meja =====
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Pilih Meja</h1>
          <p className="text-sm text-ink-muted">
            {visibleTables.length} meja &middot;{" "}
            {visibleTables.filter((t) => orderByTable.has(t.id)).length} sedang
            terisi
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-surface-border" />{" "}
              Kosong
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-accent-warning" />{" "}
              Terisi
            </span>
          </div>
          <Link
            href="/transaksi/riwayat"
            className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-card px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink"
          >
            <History size={14} /> Riwayat
          </Link>
        </div>
      </div>

      {outlets.length > 1 && (
        <div className="mb-5 flex gap-2">
          {outlets.map((o) => (
            <button
              key={o.id}
              onClick={() => setActiveOutletId(o.id)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
                o.id === activeOutletId
                  ? "border-accent bg-accent text-white"
                  : "border-surface-border bg-surface-card text-ink-muted"
              }`}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}

      {/* ===== Take Away ===== */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink">Take Away</h2>
            <p className="text-xs text-ink-muted">
              Pesanan bungkus, tanpa meja
            </p>
          </div>
          <button
            onClick={openTakeaway}
            disabled={!activeOutletId}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            <ShoppingBag size={14} /> Pesanan Baru
          </button>
        </div>

        {takeaways.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
            {takeaways.map((o, i) => (
              <button
                key={o.id}
                onClick={() => resumeTakeaway(o, `Take Away #${i + 1}`)}
                className="flex items-center gap-2.5 rounded-xl border border-accent-peach/40 bg-accent-peachBg px-3 py-2.5 text-left transition-colors hover:border-accent-peach active:scale-[0.98]"
              >
                <ShoppingBag size={16} className="shrink-0 text-accent-peach" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-ink">
                    Take Away #{i + 1}
                  </p>
                  <p className="text-[10px] text-ink-muted">
                    {timeAgo(o.created_at)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <h2 className="mb-3 text-sm font-bold text-ink">Meja</h2>
      <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {visibleTables.map((t) => {
          const openOrder = orderByTable.get(t.id);
          const occupied = Boolean(openOrder);
          return (
            <button
              key={t.id}
              onClick={() => openTable(t)}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border font-bold transition-colors active:scale-[0.98] ${
                occupied
                  ? "border-accent-warning bg-accent-warningBg text-accent-warning"
                  : "border-surface-border bg-surface-card text-ink hover:border-accent"
              }`}
            >
              <span className="text-xl">{t.name}</span>
              <span className="text-[10px] font-medium opacity-80">
                {occupied ? timeAgo(openOrder!.created_at) : `${t.seats} kursi`}
              </span>
            </button>
          );
        })}
      </div>

      {visibleTables.length === 0 && (
        <div className="card p-10 text-center text-sm text-ink-muted">
          {outlets.length === 0
            ? "Belum ada outlet aktif. Tambahkan lewat menu Pengaturan."
            : "Belum ada meja di outlet ini. Tambahkan lewat menu Pengaturan."}
        </div>
      )}

      {receiptModal}
    </div>
  );
}
