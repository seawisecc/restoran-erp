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

export async function createSupplier(formData: FormData) {
  const supabase = (await createClient()) as any;
  const companyId = await getActiveCompanyId();

  const name = (formData.get("name") as string)?.trim();
  const contactPerson = (formData.get("contact_person") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;

  if (!name) throw new Error("Nama supplier wajib diisi.");

  const { error } = await supabase.from("suppliers").insert({
    company_id: companyId,
    name,
    contact_person: contactPerson,
    phone,
    address,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/supplier");
}

export async function deleteSupplier(id: string) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/supplier");
}
