import { createClient } from "@/lib/supabase/server";
import { TableGridClient } from "@/components/transaksi/TableGridClient";

export default async function TransaksiPage() {
  const supabase = (await createClient()) as any;

  const { data: tables } = await supabase
    .from("restaurant_tables")
    .select("id, name, seats")
    .order("name");

  const { data: openOrders } = await supabase
    .from("orders")
    .select("id, table_id, created_at")
    .eq("status", "open");

  return (
    <TableGridClient
      tables={tables ?? []}
      openOrders={openOrders ?? []}
    />
  );
}
