import { createClient } from "@/lib/supabase/server";
import { RiwayatClient } from "@/components/transaksi/RiwayatClient";

export default async function RiwayatPage() {
  const supabase = (await createClient()) as any;

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, total, subtotal, tax, paid_at, restaurant_tables(name), order_items(count)",
    )
    .eq("status", "paid")
    .order("paid_at", { ascending: false });

  return <RiwayatClient orders={orders ?? []} />;
}
