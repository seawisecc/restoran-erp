import { createClient } from "@/lib/supabase/server";
import { LaporanClient } from "@/components/laporan/LaporanClient";

export default async function LaporanPage() {
  const supabase = (await createClient()) as any;

  const { data: paidOrders } = await supabase
    .from("orders")
    .select("id, total, paid_at")
    .eq("status", "paid")
    .order("paid_at", { ascending: true });

  const orderIds = (paidOrders ?? []).map((o: { id: string }) => o.id);

  const { data: orderItems } =
    orderIds.length > 0
      ? await supabase
          .from("order_items")
          .select("order_id, name, qty, price")
          .in("order_id", orderIds)
      : { data: [] };

  return (
    <LaporanClient
      orders={paidOrders ?? []}
      orderItems={orderItems ?? []}
    />
  );
}
