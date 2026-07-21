import { createClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/get-active-company";
import { startOfDayWib } from "@/lib/queue";
import { KdsClient } from "@/components/dapur/KdsClient";

const SELECT =
  "id, created_at, queue_number, customer_name, served_at, restaurant_tables(name), order_items(id, name, qty, kds_status)";

export default async function DapurPage() {
  const supabase = await createClient();
  const companyId = await getActiveCompanyId();

  // Dapur menampilkan dua kelompok:
  // 1. Semua pesanan yang masih 'open' (dine-in maupun take away).
  // 2. Take away yang SUDAH DIBAYAR tapi belum dikonfirmasi diserahkan.
  //
  // Poin 2 penting: pelanggan take away sering bayar dulu lalu menunggu
  // makanannya. Kalau hanya memfilter status 'open', pesanan langsung
  // lenyap dari layar dapur begitu dibayar padahal belum dimasak.
  // Dibatasi hari ini supaya pesanan lama yang lupa dikonfirmasi tidak
  // menumpuk di layar.
  //
  // Sengaja dua query terpisah (bukan satu filter or/and bertingkat)
  // supaya sederhana dan tidak rawan salah parsing.
  const [{ data: openOrders }, { data: paidTakeaways }] = await Promise.all([
    supabase
      .from("orders")
      .select(SELECT)
      .eq("company_id", companyId)
      .eq("status", "open")
      .order("created_at", { ascending: true }),
    supabase
      .from("orders")
      .select(SELECT)
      .eq("company_id", companyId)
      .eq("status", "paid")
      .is("table_id", null)
      .is("served_at", null)
      .gte("created_at", startOfDayWib())
      .order("created_at", { ascending: true }),
  ]);

  const orders = [...(openOrders ?? []), ...(paidTakeaways ?? [])].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );

  return <KdsClient initialOrders={orders} />;
}
