"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Narik company_id aktif dari user yang login. Dipakai di semua
 * Server Action di bawah supaya insert/update selalu ke-scope ke
 * company yang benar (RLS di database jadi lapisan pengaman kedua).
 */
async function getActiveCompanyId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login.");

  const { data: membership } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle<{ company_id: string }>();

  if (!membership) throw new Error("User belum terhubung ke company manapun.");
  return membership.company_id;
}

export async function createMenuItem(formData: FormData) {
  // Cast ke `any` khusus untuk operasi tulis di file ini — hand-written
  // Database types kita belum sempurna cocok dengan constraint generic
  // versi terbaru @supabase/supabase-js untuk insert/update/delete.
  // Query baca (select) di tempat lain tetap full type-safe seperti biasa.
  // RLS di database tetap jadi lapisan keamanan utama, jadi ini aman.
  const supabase = (await createClient()) as any;
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
  const supabase = (await createClient()) as any;
  const { error } = await supabase
    .from("menu_items")
    .update({ is_active: nextActive })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/produk-stok");
}

export async function deleteMenuItem(id: string) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase.from("menu_items").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/produk-stok");
}

export async function createMenuCategory(formData: FormData) {
  const supabase = (await createClient()) as any;
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