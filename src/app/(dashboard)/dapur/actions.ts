"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type KdsStatus = "queued" | "preparing" | "ready";

export async function updateItemKdsStatus(itemId: string, nextStatus: KdsStatus) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("order_items")
    .update({ kds_status: nextStatus })
    .eq("id", itemId);

  if (error) throw new Error(error.message);
  revalidatePath("/dapur");
}
