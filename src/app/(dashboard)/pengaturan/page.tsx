import { createClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/get-active-company";
import { PengaturanClient } from "@/components/pengaturan/PengaturanClient";

export default async function PengaturanPage() {
  const supabase = await createClient();
  const companyId = await getActiveCompanyId();

  const { data: outlets } = await supabase
    .from("outlets")
    .select("id, name, address, is_active")
    .eq("company_id", companyId)
    .order("name");

  const { data: tables } = await supabase
    .from("restaurant_tables")
    .select("id, name, seats, outlets(name)")
    .eq("company_id", companyId)
    .order("name");

  return <PengaturanClient outlets={outlets ?? []} tables={tables ?? []} />;
}
