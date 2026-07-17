"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/get-active-company";

/**
 * Versi SPA dari openOrCreateOrder: TIDAK redirect, tapi MENGEMBALIKAN
 * orderId + daftar item yang sudah ada. Dipanggil pas kasir klik meja
 * di POS SPA — hasilnya dipakai buat langsung nampilin layar order
 * tanpa pindah halaman.
 */
export async function openTableOrder(tableId: string) {
  const supabase = await createClient();
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

  let orderId = existing?.id;
  let createdAt = new Date().toISOString();

  if (!orderId) {
    const { data: created, error } = await supabase
      .from("orders")
      .insert({
        company_id: companyId,
        outlet_id: table.outlet_id,
        table_id: tableId,
        status: "open",
      })
      .select("id, created_at")
      .single();
    if (error) throw new Error(error.message);
    orderId = created.id;
    createdAt = created.created_at;
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("id, menu_item_id, name, price, qty")
    .eq("order_id", orderId)
    .order("created_at");

  return {
    orderId,
    createdAt,
    isNew: !existing,
    items: items ?? [],
  };
}

export async function addOrderItem(
  orderId: string,
  menuItem: { id: string; name: string; price: number },
) {
  const supabase = await createClient();

  // Kalau item ini udah ada di order, tambahin qty-nya aja daripada
  // bikin baris baru.
  const { data: existingLine } = await supabase
    .from("order_items")
    .select("id, qty")
    .eq("order_id", orderId)
    .eq("menu_item_id", menuItem.id)
    .limit(1)
    .maybeSingle();

  let lineId = existingLine?.id ?? "";
  let lineQty = 1;

  if (existingLine) {
    lineQty = existingLine.qty + 1;
    await supabase
      .from("order_items")
      .update({ qty: lineQty })
      .eq("id", existingLine.id);
  } else {
    const { data: inserted } = await supabase
      .from("order_items")
      .insert({
        order_id: orderId,
        menu_item_id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        qty: 1,
      })
      .select("id, qty")
      .single();
    lineId = inserted?.id ?? "";
    lineQty = inserted?.qty ?? 1;
  }

  // CATATAN PERFORMA: sengaja TIDAK revalidatePath / recalcTotals di
  // sini. Client sudah pegang state keranjang optimistik & hitung total
  // sendiri, jadi tiap tap cukup 1 write ke DB (cepat). Total final
  // dihitung ulang secara otoritatif di payOrder. Ini yang bikin tombol
  // Bayar gak lagi "nunggu" beberapa detik tiap nambah item.
  return { id: lineId, qty: lineQty };
}

export async function updateOrderItemQty(
  orderId: string,
  itemId: string,
  nextQty: number,
) {
  const supabase = await createClient();

  if (nextQty <= 0) {
    await supabase.from("order_items").delete().eq("id", itemId);
  } else {
    await supabase.from("order_items").update({ qty: nextQty }).eq("id", itemId);
  }

  // Sama seperti addOrderItem: tanpa revalidate/recalc demi kecepatan.
  // Total otoritatif dihitung ulang saat payOrder.
}

/**
 * Ngecek berapa poin yang dipunya pelanggan berdasarkan nomor HP.
 * Dipanggil pas kasir ngetik nomor HP di layar bayar, buat nunjukin
 * "pelanggan ini punya X poin" secara real-time.
 */
export async function getCustomerPoints(phone: string) {
  const supabase = await createClient();
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
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("company_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) throw new Error("Order tidak ditemukan.");

  // Total dihitung ULANG di sini (server) dari order_items — karena
  // add/qty sengaja gak nyimpen total tiap tap (demi kecepatan). Ini
  // juga jadi sumber kebenaran biar gak bisa dimanipulasi dari client.
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("price, qty")
    .eq("order_id", orderId);
  const subtotal = (orderItems ?? []).reduce(
    (s: number, it: { price: number; qty: number }) => s + it.price * it.qty,
    0,
  );

  // Setting pajak & service diambil DEFENSIF: kalau kolom belum ada
  // (migrasi 0010 belum jalan), default = pajak 10%, tanpa service.
  let taxEnabled = true;
  let taxRate = 10;
  let serviceEnabled = false;
  let serviceRate = 0;
  const { data: chargeRow, error: chargeErr } = await supabase
    .from("companies")
    .select("tax_enabled, tax_rate, service_enabled, service_rate")
    .eq("id", order.company_id)
    .maybeSingle();
  if (!chargeErr && chargeRow) {
    taxEnabled = chargeRow.tax_enabled ?? true;
    taxRate = Number(chargeRow.tax_rate ?? 10);
    serviceEnabled = chargeRow.service_enabled ?? false;
    serviceRate = Number(chargeRow.service_rate ?? 0);
  }
  const service = serviceEnabled
    ? Math.round((subtotal * serviceRate) / 100)
    : 0;
  const tax = taxEnabled
    ? Math.round(((subtotal + service) * taxRate) / 100)
    : 0;
  const grossTotal = subtotal + service + tax;

  // Rate loyalty diambil dari pengaturan company (bisa diubah lewat
  // halaman Pengaturan), bukan angka tetap di kode.
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
  let finalTotal = grossTotal;

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
      subtotal,
      tax,
      total: finalTotal,
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  // Simpan service charge secara best-effort: kalau kolom `service`
  // belum ada (migrasi 0010 belum dijalankan) error-nya diabaikan
  // supaya proses bayar tetap sukses.
  if (service > 0) {
    await supabase.from("orders").update({ service }).eq("id", orderId);
  }

  // Tetap revalidate biar render server berikutnya fresh, tapi TIDAK
  // redirect — POS sekarang berupa SPA yang menangani UI setelah bayar
  // lewat state (tanpa navigasi).
  revalidatePath("/transaksi");
  return { success: true as const };
}
