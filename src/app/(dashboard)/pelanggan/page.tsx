import { createClient } from "@/lib/supabase/server";
import { PelangganClient } from "@/components/pelanggan/PelangganClient";

export default async function PelangganPage() {
  const supabase = (await createClient()) as any;

  const { data: customers } = await supabase
    .from("customers")
    .select("id, phone, name, points, created_at")
    .order("points", { ascending: false });

  return <PelangganClient customers={customers ?? []} />;
}
