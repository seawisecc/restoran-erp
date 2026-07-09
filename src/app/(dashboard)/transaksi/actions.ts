"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Catatan soal `as any`: sama seperti di modul Menu & Stok, hand-written
// Database types kita belum cocok sempurna dengan constraint generic
// versi terbaru @supabase/supabase-js untuk operasi tulis. RLS di
// database tetap jadi lapisan keamanan utama, jadi ini aman dipakai.

async function getActiveCompanyId() {
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

  return membership.company_id as string;
}

/**
 * Dipanggil pas kasir klik meja. Kalau meja itu udah ada order yang
 * masih 'open', langsung dipakai lagi (biar gak dobel order per meja).
 * Kalau belum ada, bikin order baru.
 *
 * Penting: outlet_id order diambil dari meja itu sendiri (bukan
 * ditebak/diasumsikan), supaya benar walau company punya banyak outlet.
 */
export async function openOrCreateOrder(tableId: string) {
  const supabase = (await createClient()) as any;
  const companyId = await getActiveCompanyId();

  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("id, outlet_id")
    .eq("id", tableId)
    .maybeSingle();
  if (!table) throw new Error("Meja tidak ditemukan.");

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
      outlet_id: table.outlet_id,
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

/**
 * Ngecek berapa poin yang dipunya pelanggan berdasarkan nomor HP.
 * Dipanggil pas kasir ngetik nomor HP di layar bayar, buat nunjukin
 * "pelanggan ini punya X poin" secara real-time.
 */
export async function getCustomerPoints(phone: string) {
  const supabase = (await createClient()) as any;
  const companyId = await getActiveCompanyId();

  const cleanPhone = phone.trim();
  if (!cleanPhone) return 0;

  const { data: customer } = await supabase
    .from("customers")
    .select("points")
    .eq("company_id", companyId)
    .eq("phone", cleanPhone)
    .maybeSingle();

  return customer?.points ?? 0;
}

export async function payOrder(
  orderId: string,
  loyalty?: { phone?: string; redeemPoints?: number },
) {
  const supabase = (await createClient()) as any;

  const { data: order } = await supabase
    .from("orders")
    .select("company_id, total")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) throw new Error("Order tidak ditemukan.");

  // Rate loyalty diambil dari pengaturan company (bisa diubah lewat
  // halaman Pengaturan), bukan angka tetap di kode — dan WAJIB
  // di-fetch dari database di sini (server), bukan dipercaya dari
  // input client, biar gak bisa dimanipulasi.
  const { data: companyRates } = await supabase
    .from("companies")
    .select("loyalty_earn_rate, loyalty_redeem_rate")
    .eq("id", order.company_id)
    .maybeSingle();

  const earnRate = Number(companyRates?.loyalty_earn_rate ?? 10000);
  const redeemRate = Number(companyRates?.loyalty_redeem_rate ?? 100);

  let customerId: string | null = null;
  let pointsEarned = 0;
  let pointsRedeemed = 0;
  let discountAmount = 0;
  let finalTotal = Number(order.total);

  const phone = loyalty?.phone?.trim();

  if (phone) {
    let { data: customer } = await supabase
      .from("customers")
      .select("id, points")
      .eq("company_id", order.company_id)
      .eq("phone", phone)
      .maybeSingle();

    if (!customer) {
      const { data: created, error: createError } = await supabase
        .from("customers")
        .insert({ company_id: order.company_id, phone, points: 0 })
        .select("id, points")
        .single();
      if (createError) throw new Error(createError.message);
      customer = created;
    }

    customerId = customer.id;

    const requestedRedeem = loyalty?.redeemPoints ?? 0;
    if (requestedRedeem > 0 && customer.points >= requestedRedeem) {
      pointsRedeemed = requestedRedeem;
      discountAmount = requestedRedeem * redeemRate;
      finalTotal = Math.max(0, finalTotal - discountAmount);
    }

    pointsEarned = earnRate > 0 ? Math.floor(finalTotal / earnRate) : 0;

    const newPointsBalance = customer.points - pointsRedeemed + pointsEarned;
    await supabase
      .from("customers")
      .update({ points: newPointsBalance })
      .eq("id", customerId);
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      customer_id: customerId,
      discount_amount: discountAmount,
      points_earned: pointsEarned,
      points_redeemed: pointsRedeemed,
      total: finalTotal,
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  revalidatePath("/transaksi");
  redirect("/transaksi");
}
