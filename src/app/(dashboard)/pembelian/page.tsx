import { createClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/get-active-company";
import { PembelianClient } from "@/components/pembelian/PembelianClient";

export default async function PembelianPage() {
  const supabase = await createClient();
  const companyId = await getActiveCompanyId();

  const { data: purchases } = await supabase
    .from("purchases")
    .select("id, status, total, created_at, received_at, suppliers(name)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("company_id", companyId)
    .order("name");

  const { data: rawMaterials } = await supabase
    .from("raw_materials")
    .select("id, name, unit, stock_qty, min_stock")
    .eq("company_id", companyId)
    .order("name");

  return (
    <PembelianClient
      purchases={purchases ?? []}
      suppliers={suppliers ?? []}
      rawMaterials={rawMaterials ?? []}
    />
  );
}
