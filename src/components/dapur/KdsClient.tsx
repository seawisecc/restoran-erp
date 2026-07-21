"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markOrderServed, updateItemKdsStatus } from "@/app/(dashboard)/dapur/actions";
import { formatQueue } from "@/lib/queue";

type KdsStatus = "queued" | "preparing" | "ready";
type OrderItem = { id: string; name: string; qty: number; kds_status: KdsStatus };
type Order = {
  id: string;
  created_at: string;
  queue_number: number | null;
  customer_name: string | null;
  served_at: string | null;
  restaurant_tables: { name: string } | null;
  order_items: OrderItem[];
};

// Klik item buat maju ke status berikutnya. Klik lagi pas udah
// "Siap" bakal reset balik ke "Antre" — jaga-jaga kalau kepencet
// gak sengaja.
const nextStatus: Record<KdsStatus, KdsStatus> = {
  queued: "preparing",
  preparing: "ready",
  ready: "queued",
};

const statusConfig: Record<KdsStatus, { label: string; cls: string }> = {
  queued: {
    label: "Antre",
    cls: "border-surface-border bg-surface text-ink-muted",
  },
  preparing: {
    label: "Diproses",
    cls: "border-accent-warning bg-accent-warningBg text-accent-warning",
  },
  ready: {
    label: "Siap",
    cls: "border-accent-success bg-accent-successBg text-accent-success",
  },
};

/** Ringkasan status satu pesanan untuk ditampilkan di ticker antrian. */
function orderProgress(items: OrderItem[]) {
  if (items.length === 0) return "Belum ada item";
  if (items.every((i) => i.kds_status === "ready")) return "Siap diambil";
  if (items.some((i) => i.kds_status === "preparing")) return "Sedang dimasak";
  return "Menunggu";
}

function timeAgo(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} menit lalu`;
  return `${Math.round(mins / 60)} jam lalu`;
}

export function KdsClient({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Langganan Realtime — begitu ada perubahan di order_items/orders
  // (dari POS, QR Order, atau kasir laen), layar ini otomatis
  // refresh sendiri tanpa perlu reload manual.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("kds-live-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  function handleCycle(itemId: string, current: KdsStatus) {
    startTransition(() => {
      updateItemKdsStatus(itemId, nextStatus[current]);
    });
  }

  const orders = initialOrders;
  // Antrian take away = pesanan tanpa meja yang BELUM diserahkan.
  // Setelah dapur menekan "Diserahkan", pesanan keluar dari antrian.
  const takeaways = orders.filter((o) => !o.restaurant_tables && !o.served_at);

  function handleServed(orderId: string, label: string) {
    if (!confirm(`Konfirmasi pesanan ${label} sudah diserahkan?`)) return;
    startTransition(() => {
      markOrderServed(orderId);
    });
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dapur</h1>
          <p className="text-sm text-ink-muted">
            {orders.length} pesanan aktif &middot; update otomatis real-time
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-accent-success">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent-success" />
          Live
        </span>
      </div>

      {/* ── Ticker antrian take away ──
          Pesanan tanpa meja digeser terus-menerus di strip ini supaya
          dapur selalu melihat nomor antrian yang harus disiapkan.
          Arahkan kursor ke strip untuk menghentikan gerakannya. */}
      {takeaways.length > 0 && (
        <div className="mb-5 rounded-2xl border border-accent-peach/30 bg-accent-peachBg">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-accent-peach">
              <ShoppingBag size={13} /> Antrian Take Away
            </span>
            <span className="shrink-0 rounded-full bg-accent-peach px-2 py-0.5 text-[10px] font-bold text-white">
              {takeaways.length}
            </span>
            <div className="sw-ticker min-w-0 flex-1">
              <div className="sw-ticker-track">
                {[...takeaways, ...takeaways].map((o, i) => (
                  <div
                    key={`${o.id}-${i}`}
                    className="mr-3 flex items-center gap-2.5 whitespace-nowrap rounded-xl bg-white px-3 py-1.5"
                  >
                    <span className="flex h-7 shrink-0 items-center justify-center rounded-lg bg-accent-peach px-2 text-[11px] font-bold text-white">
                      {formatQueue(o.queue_number)}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-xs font-bold text-ink">
                        {o.customer_name || formatQueue(o.queue_number)}
                      </span>
                      <span className="text-[10px] text-ink-muted">
                        {o.order_items.length} item &middot;{" "}
                        {orderProgress(o.order_items)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="card p-16 text-center text-sm text-ink-muted">
          Belum ada pesanan aktif. Pesanan baru dari Kasir atau QR Order
          bakal otomatis muncul di sini.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {orders.map((order) => {
            const allReady =
              order.order_items.length > 0 &&
              order.order_items.every((it) => it.kds_status === "ready");
            return (
              <div
                key={order.id}
                className={`card overflow-hidden border-2 ${
                  allReady ? "border-accent-success" : "border-transparent"
                }`}
              >
                <div className="flex items-center justify-between bg-surface px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    {!order.restaurant_tables && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-peach text-[10px] font-bold text-white">
                        {order.queue_number ?? "–"}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">
                        {order.restaurant_tables?.name ?? "Take Away"}
                      </p>
                      {!order.restaurant_tables && order.customer_name && (
                        <p className="truncate text-[10px] text-ink-muted">
                          {order.customer_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="shrink-0 text-xs text-ink-muted">
                    {order.served_at ? "Diserahkan" : timeAgo(order.created_at)}
                  </p>
                </div>
                <div className="p-3">
                  {order.order_items.length === 0 ? (
                    <p className="py-4 text-center text-xs text-ink-muted">
                      Belum ada item.
                    </p>
                  ) : (
                    order.order_items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleCycle(item.id, item.kds_status)}
                        disabled={isPending}
                        className={`mb-2 flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm last:mb-0 disabled:opacity-60 ${
                          statusConfig[item.kds_status].cls
                        }`}
                      >
                        <span className="font-medium">
                          {item.qty}&times; {item.name}
                        </span>
                        <span className="text-xs font-bold">
                          {statusConfig[item.kds_status].label}
                        </span>
                      </button>
                    ))
                  )}

                  {/* Take away perlu konfirmasi serah terima — masakan
                      "siap" belum tentu sudah diambil pelanggan. */}
                  {!order.restaurant_tables &&
                    order.order_items.length > 0 &&
                    (order.served_at ? (
                      <p className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-accent-successBg py-2 text-xs font-bold text-accent-success">
                        <Check size={13} /> Sudah diserahkan
                      </p>
                    ) : (
                      <button
                        onClick={() =>
                          handleServed(
                            order.id,
                            order.customer_name ||
                              formatQueue(order.queue_number),
                          )
                        }
                        disabled={isPending}
                        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent py-2.5 text-xs font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
                      >
                        <Check size={14} /> Konfirmasi Diserahkan
                      </button>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
