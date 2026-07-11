import { createClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/get-active-company";
import { PelangganClient } from "@/components/pelanggan/PelangganClient";

export default async function PelangganPage() {
  const supabase = await createClient();
  const companyId = await getActiveCompanyId();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, phone, name, points, created_at")
    .eq("company_id", companyId)
    .order("points", { ascending: false });

  return <PelangganClient customers={customers ?? []} />;
}
