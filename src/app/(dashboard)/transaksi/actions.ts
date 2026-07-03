"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Catatan soal `as any`: sama seperti di modul Menu & Stok, hand-written
// Database types kita belum cocok sempurna dengan constraint generic
// versi terbaru @supabase/supabase-js untuk operasi tulis. RLS di
// database tetap jadi lapisan keamanan utama, jadi ini aman dipakai.

async function getActiveCompanyAndOutlet() {
  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login.");

  const { data: membership } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) throw new Error("User belum terhubung ke company manapun.");

  const { data: outlet } = await supabase
    .from("outlets")
    .select("id")
    .eq("company_id", membership.company_id)
    .limit(1)
    .maybeSingle();
  if (!outlet) throw new Error("Company ini belum punya outlet.");

  return { companyId: membership.company_id as string, outletId: outlet.id as string };
}

/**
 * Dipanggil pas kasir klik meja. Kalau meja itu udah ada order yang
 * masih 'open', langsung dipakai lagi (biar gak dobel order per meja).
 * Kalau belum ada, bikin order baru.
 */
export async function openOrCreateOrder(tableId: string) {
  const supabase = (await createClient()) as any;
  const { companyId, outletId } = await getActiveCompanyAndOutlet();

  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("table_id", tableId)
    .eq("status", "open")
    .limit(1)
    .maybeSingle();

  if (existing) {
    redirect(`/transaksi/${existing.id}`);
  }

  const { data: created, error } = await supabase
    .from("orders")
    .insert({
      company_id: companyId,
      outlet_id: outletId,
      table_id: tableId,
      status: "open",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/transaksi");
  redirect(`/transaksi/${created.id}`);
}

export async function addOrderItem(
  orderId: string,
  menuItem: { id: string; name: string; price: number },
) {
  const supabase = (await createClient()) as any;

  // Kalau item ini udah ada di order, tambahin qty-nya aja daripada
  // bikin baris baru.
  const { data: existingLine } = await supabase
    .from("order_items")
    .select("id, qty")
    .eq("order_id", orderId)
    .eq("menu_item_id", menuItem.id)
    .limit(1)
    .maybeSingle();

  if (existingLine) {
    await supabase
      .from("order_items")
      .update({ qty: existingLine.qty + 1 })
      .eq("id", existingLine.id);
  } else {
    await supabase.from("order_items").insert({
      order_id: orderId,
      menu_item_id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      qty: 1,
    });
  }

  await recalculateOrderTotals(orderId);
  revalidatePath(`/transaksi/${orderId}`);
}

export async function updateOrderItemQty(
  orderId: string,
  itemId: string,
  nextQty: number,
) {
  const supabase = (await createClient()) as any;

  if (nextQty <= 0) {
    await supabase.from("order_items").delete().eq("id", itemId);
  } else {
    await supabase.from("order_items").update({ qty: nextQty }).eq("id", itemId);
  }

  await recalculateOrderTotals(orderId);
  revalidatePath(`/transaksi/${orderId}`);
}

async function recalculateOrderTotals(orderId: string) {
  const supabase = (await createClient()) as any;

  const { data: items } = await supabase
    .from("order_items")
    .select("price, qty")
    .eq("order_id", orderId);

  const subtotal = (items ?? []).reduce(
    (sum: number, it: { price: number; qty: number }) => sum + it.price * it.qty,
    0,
  );
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  await supabase
    .from("orders")
    .update({ subtotal, tax, total })
    .eq("id", orderId);
}

export async function payOrder(orderId: string) {
  const supabase = (await createClient()) as any;

  const { error } = await supabase
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  revalidatePath("/transaksi");
  redirect("/transaksi");
}
