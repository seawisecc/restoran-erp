import { createClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/get-active-company";
import { KdsClient } from "@/components/dapur/KdsClient";

export default async function DapurPage() {
  const supabase = await createClient();
  const companyId = await getActiveCompanyId();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, created_at, restaurant_tables(name), order_items(id, name, qty, kds_status)",
    )
    .eq("company_id", companyId)
    .eq("status", "open")
    .order("created_at", { ascending: true });

  return <KdsClient initialOrders={orders ?? []} />;
}
