import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderClient } from "@/components/transaksi/OrderClient";

export default async function OrderPage({
  params,
}: {
  params: { orderId: string };
}) {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, company_id, status, subtotal, tax, total, restaurant_tables(name)")
    .eq("id", params.orderId)
    .maybeSingle();

  if (!order) notFound();

  // Sisa query saling independen — jalankan paralel biar buka meja
  // gak nunggu satu-satu (sekuensial sebelumnya bikin loading terasa lama).
  const [{ data: items }, { data: categories }, { data: menuItems }] =
    await Promise.all([
      supabase
        .from("order_items")
        .select("id, menu_item_id, name, price, qty")
        .eq("order_id", params.orderId)
        .order("created_at"),
      supabase
        .from("menu_categories")
        .select("id, name, sort_order")
        .eq("company_id", order.company_id)
        .order("sort_order"),
      supabase
        .from("menu_items")
        .select("id, name, category_id, price")
        .eq("company_id", order.company_id)
        .eq("is_active", true)
        .order("name"),
    ]);

  return (
    <OrderClient
      order={order}
      items={items ?? []}
      categories={categories ?? []}
      menuItems={menuItems ?? []}
    />
  );
}
