"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/get-active-company";

type PurchaseItemInput = { name: string; unit: string; qty: number; price: number };

/**
 * Bikin PO baru. Bahan baku dicari berdasarkan nama (case-insensitive);
 * kalau belum ada di tabel raw_materials, otomatis dibuatkan barunya.
 * Stok belum nambah di sini — baru nambah pas PO ditandai "Diterima".
 */
export async function createPurchase(data: {
  supplierId: string | null;
  items: PurchaseItemInput[];
}) {
  const supabase = await createClient();
  const companyId = await getActiveCompanyId();

  if (data.items.length === 0) throw new Error("Minimal 1 item pembelian.");

  const total = data.items.reduce((sum, it) => sum + it.qty * it.price, 0);

  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({
      company_id: companyId,
      supplier_id: data.supplierId,
      status: "pending",
      total,
    })
    .select("id")
    .single();

  if (purchaseError) throw new Error(purchaseError.message);

  for (const item of data.items) {
    // cari raw material yang namanya cocok (case-insensitive) di company ini
    const { data: existingMaterial } = await supabase
      .from("raw_materials")
      .select("id")
      .eq("company_id", companyId)
      .ilike("name", item.name.trim())
      .limit(1)
      .maybeSingle();

    let rawMaterialId = existingMaterial?.id as string | undefined;

    if (!rawMaterialId) {
      const { data: newMaterial, error: materialError } = await supabase
        .from("raw_materials")
        .insert({
          company_id: companyId,
          name: item.name.trim(),
          unit: item.unit || "pcs",
          stock_qty: 0,
          min_stock: 0,
        })
        .select("id")
        .single();
      if (materialError) throw new Error(materialError.message);
      rawMaterialId = newMaterial.id;
    }

    const { error: itemError } = await supabase.from("purchase_items").insert({
      purchase_id: purchase.id,
      raw_material_id: rawMaterialId,
      name: item.name.trim(),
      qty: item.qty,
      price: item.price,
    });
    if (itemError) throw new Error(itemError.message);
  }

  revalidatePath("/pembelian");
}

/**
 * Tandai PO sebagai diterima. Ini yang bikin stok bahan baku
 * beneran nambah — jangan dijalankan 2x untuk PO yang sama
 * (barangnya bakal ke-double-count).
 */
export async function receivePurchase(purchaseId: string) {
  const supabase = await createClient();

  const { data: purchase } = await supabase
    .from("purchases")
    .select("status")
    .eq("id", purchaseId)
    .maybeSingle();

  if (!purchase) throw new Error("Pembelian tidak ditemukan.");
  if (purchase.status === "received") return; // sudah pernah diterima, jangan dobel

  const { data: items } = await supabase
    .from("purchase_items")
    .select("raw_material_id, qty, price")
    .eq("purchase_id", purchaseId);

  for (const item of items ?? []) {
    if (!item.raw_material_id) continue;
    const { data: material } = await supabase
      .from("raw_materials")
      .select("stock_qty, cost_price")
      .eq("id", item.raw_material_id)
      .maybeSingle();
    if (!material) continue;

    const oldStock = Number(material.stock_qty);
    const oldCost = Number(material.cost_price);
    const incomingQty = Number(item.qty);
    const incomingPrice = Number(item.price);

    const newStock = oldStock + incomingQty;
    // Weighted average: gabungin nilai stok lama + nilai barang baru
    // masuk, dibagi total qty. Kalau stok lama 0, cost baru = harga
    // beli terakhir aja.
    const newCost =
      newStock > 0
        ? (oldStock * oldCost + incomingQty * incomingPrice) / newStock
        : incomingPrice;

    await supabase
      .from("raw_materials")
      .update({ stock_qty: newStock, cost_price: newCost })
      .eq("id", item.raw_material_id);
  }

  const { error } = await supabase
    .from("purchases")
    .update({ status: "received", received_at: new Date().toISOString() })
    .eq("id", purchaseId);

  if (error) throw new Error(error.message);

  revalidatePath("/pembelian");
}

export async function cancelPurchase(purchaseId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("purchases")
    .update({ status: "cancelled" })
    .eq("id", purchaseId);
  if (error) throw new Error(error.message);
  revalidatePath("/pembelian");
}
