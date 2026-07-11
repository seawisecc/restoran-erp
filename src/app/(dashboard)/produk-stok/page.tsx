import { createClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/get-active-company";
import { ProdukStokClient } from "@/components/produk-stok/ProdukStokClient";

export default async function ProdukStokPage() {
  const supabase = await createClient();
  const companyId = await getActiveCompanyId();

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name, sort_order")
      .eq("company_id", companyId)
      .order("sort_order"),
    supabase
      .from("menu_items")
      .select("id, name, category_id, price, unit, is_active, code")
      .eq("company_id", companyId)
      .order("name"),
  ]);

  return (
    <ProdukStokClient categories={categories ?? []} items={items ?? []} />
  );
}
