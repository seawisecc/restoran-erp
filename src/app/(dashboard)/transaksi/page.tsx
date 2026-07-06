import { createClient } from "@/lib/supabase/server";
import { TableGridClient } from "@/components/transaksi/TableGridClient";

export default async function TransaksiPage({
  searchParams,
}: {
  searchParams: { outlet?: string };
}) {
  const supabase = (await createClient()) as any;

  const { data: outlets } = await supabase
    .from("outlets")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  const activeOutletId = searchParams.outlet || outlets?.[0]?.id || null;

  const { data: tables } = activeOutletId
    ? await supabase
        .from("restaurant_tables")
        .select("id, name, seats")
        .eq("outlet_id", activeOutletId)
        .order("name")
    : { data: [] };

  const { data: openOrders } = activeOutletId
    ? await supabase
        .from("orders")
        .select("id, table_id, created_at")
        .eq("status", "open")
        .eq("outlet_id", activeOutletId)
    : { data: [] };

  return (
    <TableGridClient
      tables={tables ?? []}
      openOrders={openOrders ?? []}
      outlets={outlets ?? []}
      activeOutletId={activeOutletId}
    />
  );
}
