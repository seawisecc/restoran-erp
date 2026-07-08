import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PublicOrderClient } from "@/components/order-public/PublicOrderClient";

export default async function PublicOrderPage({
  params,
}: {
  params: { tableId: string };
}) {
  const admin = createAdminClient() as any;

  const { data: table } = await admin
    .from("restaurant_tables")
    .select("id, name, company_id")
    .eq("id", params.tableId)
    .maybeSingle();

  if (!table) notFound();

  const { data: company } = await admin
    .from("companies")
    .select("name, status")
    .eq("id", table.company_id)
    .maybeSingle();

  // Kalau company belum di-approve / udah ditolak / expired, jangan
  // tampilin menu order publiknya sama sekali.
  if (!company || company.status !== "approved") notFound();

  const { data: existingOrder } = await admin
    .from("orders")
    .select("id")
    .eq("table_id", params.tableId)
    .eq("status", "open")
    .limit(1)
    .maybeSingle();

  const orderId = existingOrder?.id ?? null;

  const { data: items } = orderId
    ? await admin
        .from("order_items")
        .select("id, menu_item_id, name, price, qty")
        .eq("order_id", orderId)
        .order("created_at")
    : { data: [] };

  const { data: categories } = await admin
    .from("menu_categories")
    .select("id, name, sort_order")
    .eq("company_id", table.company_id)
    .order("sort_order");

  const { data: menuItems } = await admin
    .from("menu_items")
    .select("id, name, category_id, price")
    .eq("company_id", table.company_id)
    .eq("is_active", true)
    .order("name");

  return (
    <PublicOrderClient
      tableId={table.id}
      tableName={table.name}
      companyName={company.name}
      initialItems={items ?? []}
      categories={categories ?? []}
      menuItems={menuItems ?? []}
    />
  );
}
