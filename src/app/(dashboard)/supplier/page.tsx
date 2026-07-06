import { createClient } from "@/lib/supabase/server";
import { SupplierClient } from "@/components/supplier/SupplierClient";

export default async function SupplierPage() {
  const supabase = (await createClient()) as any;

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name, contact_person, phone, address")
    .order("name");

  return <SupplierClient suppliers={suppliers ?? []} />;
}
