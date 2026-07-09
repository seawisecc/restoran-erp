"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

// ===================== OUTLET =====================

export async function createOutlet(formData: FormData) {
  const supabase = (await createClient()) as any;
  const companyId = await getActiveCompanyId();

  const name = (formData.get("name") as string)?.trim();
  const address = (formData.get("address") as string)?.trim() || null;

  if (!name) throw new Error("Nama outlet wajib diisi.");

  const { error } = await supabase.from("outlets").insert({
    company_id: companyId,
    name,
    address,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/pengaturan");
}

export async function updateOutlet(id: string, formData: FormData) {
  const supabase = (await createClient()) as any;

  const name = (formData.get("name") as string)?.trim();
  const address = (formData.get("address") as string)?.trim() || null;

  if (!name) throw new Error("Nama outlet wajib diisi.");

  const { error } = await supabase
    .from("outlets")
    .update({ name, address })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/pengaturan");
}

export async function toggleOutletActive(id: string, nextActive: boolean) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase
    .from("outlets")
    .update({ is_active: nextActive })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pengaturan");
}

// ===================== MEJA =====================

export async function createTable(formData: FormData) {
  const supabase = (await createClient()) as any;
  const companyId = await getActiveCompanyId();

  const outletId = formData.get("outlet_id") as string;
  const name = (formData.get("name") as string)?.trim();
  const seats = Number(formData.get("seats")) || 4;

  if (!outletId) throw new Error("Pilih outlet dulu.");
  if (!name) throw new Error("Nama/nomor meja wajib diisi.");

  const { error } = await supabase.from("restaurant_tables").insert({
    company_id: companyId,
    outlet_id: outletId,
    name,
    seats,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/pengaturan");
  revalidatePath("/transaksi");
}

export async function deleteTable(id: string) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase.from("restaurant_tables").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pengaturan");
  revalidatePath("/transaksi");
}

// ===================== LOYALTY =====================

export async function updateLoyaltySettings(formData: FormData) {
  const supabase = (await createClient()) as any;
  const companyId = await getActiveCompanyId();

  const earnRate = Number(formData.get("loyalty_earn_rate"));
  const redeemRate = Number(formData.get("loyalty_redeem_rate"));

  if (!Number.isFinite(earnRate) || earnRate <= 0) {
    throw new Error("Rate poin didapat harus lebih dari 0.");
  }
  if (!Number.isFinite(redeemRate) || redeemRate <= 0) {
    throw new Error("Rate poin ditukar harus lebih dari 0.");
  }

  const { error } = await supabase
    .from("companies")
    .update({
      loyalty_earn_rate: earnRate,
      loyalty_redeem_rate: redeemRate,
    })
    .eq("id", companyId);

  if (error) throw new Error(error.message);
  revalidatePath("/pengaturan");
}
