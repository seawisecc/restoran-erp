"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * PENTING soal keamanan: semua fungsi di file ini dipanggil dari
 * halaman PUBLIK (tanpa login) yang diakses tamu lewat scan QR code.
 * Makanya di sini kita pakai admin client (service role) yang bypass
 * RLS — tapi setiap operasi WAJIB divalidasi manual di kode, gak
 * boleh percaya begitu aja sama tableId/menuItemId yang dikirim dari
 * browser. Prinsipnya: derive semua data (company_id, outlet_id) dari
 * tableId di database, jangan pernah terima company_id dari client.
 */

async function getOrCreateOrderForTable(tableId: string) {
  const admin = createAdminClient();

  const { data: table } = await admin
    .from("restaurant_tables")
    .select("id, company_id, outlet_id")
    .eq("id", tableId)
    .maybeSingle();

  if (!table) throw new Error("Meja tidak ditemukan.");

  const { data: existing } = await admin
    .from("orders")
    .select("id")
    .eq("table_id", tableId)
    .eq("status", "open")
    .limit(1)
    .maybeSingle();

  if (existing) return { table, orderId: existing.id as string };

  const { data: created, error } = await admin
    .from("orders")
    .insert({
      company_id: table.company_id,
      outlet_id: table.outlet_id,
      table_id: tableId,
      status: "open",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { table, orderId: created.id as string };
}

async function recalcTotals(orderId: string) {
  const admin = createAdminClient();
  const { data: items } = await admin
    .from("order_items")
    .select("price, qty")
    .eq("order_id", orderId);

  const subtotal = (items ?? []).reduce(
    (sum: number, it: { price: number; qty: number }) => sum + it.price * it.qty,
    0,
  );
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  await admin.from("orders").update({ subtotal, tax, total }).eq("id", orderId);
}

type CartItem = { id: string; name: string; price: number; qty: number };

/**
 * Dipanggil SEKALI pas tamu klik "Kirim Pesanan" — bukan tiap kali
 * tap menu. Sebelum ini, keranjang cuma hidup di state React sisi
 * browser, gak nyentuh database sama sekali.
 */
export async function submitPublicOrder(tableId: string, cartItems: CartItem[]) {
  if (cartItems.length === 0) throw new Error("Keranjang masih kosong.");

  const { table, orderId } = await getOrCreateOrderForTable(tableId);
  const admin = createAdminClient();

  // Validasi: semua menu yang dikirim harus beneran milik company
  // yang sama dengan meja ini.
  const menuIds = cartItems.map((c) => c.id);
  const { data: validMenus } = await admin
    .from("menu_items")
    .select("id")
    .in("id", menuIds)
    .eq("company_id", table.company_id);
  const validIds = new Set((validMenus ?? []).map((m: { id: string }) => m.id));

  for (const item of cartItems) {
    if (!validIds.has(item.id)) continue;

    const { data: existingLine } = await admin
      .from("order_items")
      .select("id, qty")
      .eq("order_id", orderId)
      .eq("menu_item_id", item.id)
      .limit(1)
      .maybeSingle();

    if (existingLine) {
      await admin
        .from("order_items")
        .update({ qty: existingLine.qty + item.qty })
        .eq("id", existingLine.id);
    } else {
      await admin.from("order_items").insert({
        order_id: orderId,
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
      });
    }
  }

  await recalcTotals(orderId);
  revalidatePath(`/o/${tableId}`);
  revalidatePath(`/transaksi/${orderId}`);

  return { success: true as const };
}
