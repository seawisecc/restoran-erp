import { createClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/get-active-company";
import { RiwayatClient } from "@/components/transaksi/RiwayatClient";

export default async function RiwayatPage() {
  const supabase = await createClient();
  const companyId = await getActiveCompanyId();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, total, subtotal, tax, paid_at, restaurant_tables(name), order_items(count)",
    )
    .eq("company_id", companyId)
    .eq("status", "paid")
    .order("paid_at", { ascending: false });

  // Sama seperti di Laporan: paid_at nullable di database, tapi
  // selalu ada isinya buat order berstatus "paid". Filter di sini
  // biar tipe yang dikirim ke client component non-null.
  const validOrders = (orders ?? [])
    .filter((o): o is typeof o & { paid_at: string } => o.paid_at !== null)
    .map((o) => ({ ...o, paid_at: o.paid_at }));

  return <RiwayatClient orders={validOrders} />;
}
