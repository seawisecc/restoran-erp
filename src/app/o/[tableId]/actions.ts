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
  const admin = createAdminClient() as any;

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
  const admin = createAdminClient() as any;
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

export async function addPublicOrderItem(
  tableId: string,
  menuItem: { id: string; name: string; price: number },
) {
  const { table, orderId } = await getOrCreateOrderForTable(tableId);
  const admin = createAdminClient() as any;

  // Validasi: menu yang dipesan harus benar-benar milik company yang
  // sama dengan meja ini. Ini mencegah orang iseng ngirim menuItemId
  // dari resto lain lewat request manual.
  const { data: menu } = await admin
    .from("menu_items")
    .select("id, company_id")
    .eq("id", menuItem.id)
    .eq("company_id", table.company_id)
    .maybeSingle();
  if (!menu) throw new Error("Menu tidak valid.");

  const { data: existingLine } = await admin
    .from("order_items")
    .select("id, qty")
    .eq("order_id", orderId)
    .eq("menu_item_id", menuItem.id)
    .limit(1)
    .maybeSingle();

  if (existingLine) {
    await admin
      .from("order_items")
      .update({ qty: existingLine.qty + 1 })
      .eq("id", existingLine.id);
  } else {
    await admin.from("order_items").insert({
      order_id: orderId,
      menu_item_id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      qty: 1,
    });
  }

  await recalcTotals(orderId);
  revalidatePath(`/o/${tableId}`);
  revalidatePath(`/transaksi/${orderId}`);
}

export async function updatePublicOrderItemQty(
  tableId: string,
  itemId: string,
  nextQty: number,
) {
  const admin = createAdminClient() as any;

  const { data: item } = await admin
    .from("order_items")
    .select("order_id")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return;

  if (nextQty <= 0) {
    await admin.from("order_items").delete().eq("id", itemId);
  } else {
    await admin.from("order_items").update({ qty: nextQty }).eq("id", itemId);
  }

  await recalcTotals(item.order_id);
  revalidatePath(`/o/${tableId}`);
  revalidatePath(`/transaksi/${item.order_id}`);
}
