import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderClient } from "@/components/transaksi/OrderClient";

export default async function OrderPage({
  params,
}: {
  params: { orderId: string };
}) {
  const supabase = (await createClient()) as any;

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, subtotal, tax, total, restaurant_tables(name)")
    .eq("id", params.orderId)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("id, menu_item_id, name, price, qty")
    .eq("order_id", params.orderId)
    .order("created_at");

  const { data: categories } = await supabase
    .from("menu_categories")
    .select("id, name, sort_order")
    .order("sort_order");

  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("id, name, category_id, price")
    .eq("is_active", true)
    .order("name");

  return (
    <OrderClient
      order={order}
      items={items ?? []}
      categories={categories ?? []}
      menuItems={menuItems ?? []}
    />
  );
}
