import { createClient } from "@/lib/supabase/server";
import { PembelianClient } from "@/components/pembelian/PembelianClient";

export default async function PembelianPage() {
  const supabase = (await createClient()) as any;

  const { data: purchases } = await supabase
    .from("purchases")
    .select("id, status, total, created_at, received_at, suppliers(name)")
    .order("created_at", { ascending: false });

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name")
    .order("name");

  const { data: rawMaterials } = await supabase
    .from("raw_materials")
    .select("id, name, unit, stock_qty, min_stock")
    .order("name");

  return (
    <PembelianClient
      purchases={purchases ?? []}
      suppliers={suppliers ?? []}
      rawMaterials={rawMaterials ?? []}
    />
  );
}
