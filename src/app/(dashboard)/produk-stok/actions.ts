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
