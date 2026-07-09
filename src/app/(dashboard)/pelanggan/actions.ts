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

export async function createCustomer(formData: FormData) {
  const supabase = (await createClient()) as any;
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
