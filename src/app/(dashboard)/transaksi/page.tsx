import { createClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/get-active-company";
import { PosClient } from "@/components/transaksi/PosClient";

export default async function TransaksiPage({
  searchParams,
}: {
  searchParams: { outlet?: string };
}) {
  const supabase = await createClient();
  const companyId = await getActiveCompanyId();

  // Muat SEMUA data yang dibutuhkan POS sekali di sini: outlet, meja,
  // order terbuka, kategori & menu. Menu tidak akan di-fetch lagi tiap
  // buka meja — itu kunci "sat set"-nya (SPA, tanpa navigasi/refetch).
  const [
    { data: outlets },
    { data: tables },
    { data: openOrders },
    { data: categories },
    { data: menuItems },
    { data: paperRow, error: paperError },
  ] = await Promise.all([
    supabase
      .from("outlets")
      .select("id, name")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("restaurant_tables")
      .select("id, name, seats, outlet_id")
      .eq("company_id", companyId)
      .order("name"),
    supabase
      .from("orders")
      .select("id, table_id, created_at, outlet_id")
      .eq("company_id", companyId)
      .eq("status", "open"),
    supabase
      .from("menu_categories")
      .select("id, name, sort_order")
      .eq("company_id", companyId)
      .order("sort_order"),
    supabase
      .from("menu_items")
      .select("id, name, category_id, price")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name"),
    // Defensif: kalau migrasi 0011 belum jalan, jatuh ke default 80mm.
    supabase
      .from("companies")
      .select("receipt_paper")
      .eq("id", companyId)
      .maybeSingle(),
  ]);

  const receiptPaper =
    !paperError && paperRow?.receipt_paper ? paperRow.receipt_paper : "80mm";

  const initialOutletId = searchParams.outlet || outlets?.[0]?.id || null;

  return (
    <PosClient
      outlets={outlets ?? []}
      tables={tables ?? []}
      openOrders={openOrders ?? []}
      categories={categories ?? []}
      menuItems={menuItems ?? []}
      initialOutletId={initialOutletId}
      receiptPaper={receiptPaper}
    />
  );
}
