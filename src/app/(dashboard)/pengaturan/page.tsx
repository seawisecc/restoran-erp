import { createClient } from "@/lib/supabase/server";
import { PengaturanClient } from "@/components/pengaturan/PengaturanClient";

export default async function PengaturanPage() {
  const supabase = (await createClient()) as any;

  const { data: outlets } = await supabase
    .from("outlets")
    .select("id, name, address, is_active")
    .order("name");

  const { data: tables } = await supabase
    .from("restaurant_tables")
    .select("id, name, seats, outlets(name)")
    .order("name");

  return <PengaturanClient outlets={outlets ?? []} tables={tables ?? []} />;
}
