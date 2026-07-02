import { createClient } from "@/lib/supabase/server";
import { ProdukStokClient } from "@/components/produk-stok/ProdukStokClient";

export default async function ProdukStokPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name, sort_order")
      .order("sort_order"),
    supabase
      .from("menu_items")
      .select("id, name, category_id, price, unit, is_active, code")
      .order("name"),
  ]);

  return (
    <ProdukStokClient categories={categories ?? []} items={items ?? []} />
  );
}
