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

/**
 * Konfirmasi pesanan sudah diserahkan ke pelanggan (dipakai untuk take
 * away). Semua item ikut ditandai siap, lalu order keluar dari antrian
 * di layar dapur. Order tetap 'open' sampai dibayar di kasir.
 */
export async function markOrderServed(orderId: string) {
  const supabase = await createClient();

  await supabase
    .from("order_items")
    .update({ kds_status: "ready" })
    .eq("order_id", orderId);

  const { error } = await supabase
    .from("orders")
    .update({ served_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
  revalidatePath("/dapur");
}
