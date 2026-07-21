"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/get-active-company";

/**
 * Narik company_id aktif dari user yang login. Dipakai di semua
 * Server Action di bawah supaya insert/update selalu ke-scope ke
 * company yang benar (RLS di database jadi lapisan pengaman kedua).
 */
export async function createMenuItem(formData: FormData) {
  const supabase = await createClient();
  const companyId = await getActiveCompanyId();

  const name = (formData.get("name") as string)?.trim();
  const categoryId = (formData.get("category_id") as string) || null;
  const price = Number(formData.get("price"));
  const unit = (formData.get("unit") as string)?.trim() || "porsi";

  if (!name) throw new Error("Nama menu wajib diisi.");
  if (!Number.isFinite(price) || price < 0) throw new Error("Harga tidak valid.");

  const { error } = await supabase.from("menu_items").insert({
    company_id: companyId,
    category_id: categoryId,
    name,
    price,
    unit,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/produk-stok");
}

export async function toggleMenuItemActive(id: string, nextActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ is_active: nextActive })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/produk-stok");
}

export async function deleteMenuItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/produk-stok");
}

export async function createMenuCategory(formData: FormData) {
  const supabase = await createClient();
  const companyId = await getActiveCompanyId();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Nama kategori wajib diisi.");

  const { error } = await supabase.from("menu_categories").insert({
    company_id: companyId,
    name,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/produk-stok");
}

export async function updateMenuCategory(id: string, name: string) {
  const supabase = await createClient();
  const companyId = await getActiveCompanyId();

  const clean = name.trim();
  if (!clean) throw new Error("Nama kategori wajib diisi.");

  const { error } = await supabase
    .from("menu_categories")
    .update({ name: clean })
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) throw new Error(error.message);
  revalidatePath("/produk-stok");
  revalidatePath("/transaksi");
}

/**
 * Hapus kategori. Menu yang memakainya TIDAK ikut terhapus — cukup
 * dilepas jadi "Tanpa kategori", supaya tidak ada menu yang hilang
 * gara-gara kategorinya dirapikan.
 */
export async function deleteMenuCategory(id: string) {
  const supabase = await createClient();
  const companyId = await getActiveCompanyId();

  await supabase
    .from("menu_items")
    .update({ category_id: null })
    .eq("category_id", id)
    .eq("company_id", companyId);

  const { error } = await supabase
    .from("menu_categories")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) throw new Error(error.message);
  revalidatePath("/produk-stok");
  revalidatePath("/transaksi");
}

// ===================== RESEP (buat hitung HPP) =====================

export async function getMenuItemRecipe(menuItemId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("menu_item_recipes")
    .select("id, raw_material_id, qty_used, raw_materials(name, unit, cost_price)")
    .eq("menu_item_id", menuItemId);

  return data ?? [];
}

/**
 * Nyimpen resep satu menu sekaligus — hapus semua baris lama, ganti
 * dengan yang baru. Lebih simpel daripada nge-diff satu-satu, dan
 * resep emang jarang diedit jadi gak masalah soal efisiensi.
 */
export async function saveMenuItemRecipe(
  menuItemId: string,
  lines: { rawMaterialId: string; qtyUsed: number }[],
) {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("menu_item_recipes")
    .delete()
    .eq("menu_item_id", menuItemId);
  if (deleteError) throw new Error(deleteError.message);

  const validLines = lines.filter((l) => l.rawMaterialId && l.qtyUsed > 0);

  if (validLines.length > 0) {
    const { error: insertError } = await supabase.from("menu_item_recipes").insert(
      validLines.map((l) => ({
        menu_item_id: menuItemId,
        raw_material_id: l.rawMaterialId,
        qty_used: l.qtyUsed,
      })),
    );
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath("/produk-stok");
  revalidatePath("/laporan");
}
