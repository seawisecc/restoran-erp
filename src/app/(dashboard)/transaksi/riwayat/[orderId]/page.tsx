import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

function rupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function RiwayatDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, subtotal, tax, total, paid_at, created_at, restaurant_tables(name)",
    )
    .eq("id", params.orderId)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("id, name, price, qty")
    .eq("order_id", params.orderId)
    .order("created_at");

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/transaksi/riwayat"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-surface-card"
        >
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {order.restaurant_tables?.name ?? "Meja"}
          </h1>
          <p className="text-sm text-ink-muted">
            {order.paid_at ? formatDateTime(order.paid_at) : "-"}
          </p>
        </div>
        <span className="badge-success ml-auto">Lunas</span>
      </div>

      <div className="card mx-auto max-w-md overflow-hidden">
        <div className="p-5">
          {(items ?? []).map(
            (it: { id: string; name: string; price: number; qty: number }) => (
              <div
                key={it.id}
                className="flex items-start justify-between border-b border-surface-border py-2.5 last:border-b-0"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{it.name}</p>
                  <p className="text-xs text-ink-muted">
                    {it.qty} &times; {rupiah(it.price)}
                  </p>
                </div>
                <p className="text-sm font-bold text-ink">
                  {rupiah(it.price * it.qty)}
                </p>
              </div>
            ),
          )}
        </div>

        <div className="border-t border-surface-border bg-surface p-5">
          <div className="mb-1 flex justify-between text-sm text-ink-muted">
            <span>Subtotal</span>
            <span>{rupiah(order.subtotal)}</span>
          </div>
          <div className="mb-2 flex justify-between text-sm text-ink-muted">
            <span>Pajak (10%)</span>
            <span>{rupiah(order.tax)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-ink">
            <span>Total</span>
            <span>{rupiah(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
