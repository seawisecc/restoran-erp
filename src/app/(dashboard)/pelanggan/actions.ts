"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/get-active-company";

export async function createCustomer(formData: FormData) {
  const supabase = await createClient();
  const companyId = await getActiveCompanyId();

  const phone = (formData.get("phone") as string)?.trim();
  const name = (formData.get("name") as string)?.trim() || null;

  if (!phone) throw new Error("Nomor HP wajib diisi.");

  const { error } = await supabase.from("customers").insert({
    company_id: companyId,
    phone,
    name,
    points: 0,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Pelanggan dengan nomor HP ini sudah terdaftar.");
    }
    throw new Error(error.message);
  }

  revalidatePath("/pelanggan");
}
