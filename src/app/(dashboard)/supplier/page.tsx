import { createClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/get-active-company";
import { SupplierClient } from "@/components/supplier/SupplierClient";

export default async function SupplierPage() {
  const supabase = await createClient();
  const companyId = await getActiveCompanyId();

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name, contact_person, phone, address")
    .eq("company_id", companyId)
    .order("name");

  return <SupplierClient suppliers={suppliers ?? []} />;
}
