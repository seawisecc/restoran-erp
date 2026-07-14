"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateItemKdsStatus } from "@/app/(dashboard)/dapur/actions";

type KdsStatus = "queued" | "preparing" | "ready";
type OrderItem = { id: string; name: string; qty: number; kds_status: KdsStatus };
type Order = {
  id: string;
  created_at: string;
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
                  <p className="text-sm font-bold text-ink">
                    {order.restaurant_tables?.name ?? "Meja"}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {timeAgo(order.created_at)}
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
