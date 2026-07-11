import { createClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/get-active-company";
import { LaporanClient } from "@/components/laporan/LaporanClient";

export default async function LaporanPage() {
  const supabase = await createClient();
  const companyId = await getActiveCompanyId();

  const { data: paidOrders } = await supabase
    .from("orders")
    .select("id, total, paid_at")
    .eq("company_id", companyId)
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

  // Secara logika paid_at selalu ada isinya buat order berstatus
  // "paid" (di-set otomatis pas payOrder dijalankan) — tapi kolomnya
  // sendiri di database nullable (karena order yang belum dibayar
  // emang belum punya paid_at). Filter di sini biar tipe data yang
  // dikirim ke client component bener-bener non-null.
  const validOrders = (paidOrders ?? [])
    .filter((o): o is typeof o & { paid_at: string } => o.paid_at !== null)
    .map((o) => ({ id: o.id, total: o.total, paid_at: o.paid_at }));

  return (
    <LaporanClient
      orders={validOrders}
      orderItems={orderItems ?? []}
    />
  );
}
