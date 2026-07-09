"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_COMPANY_COOKIE } from "@/lib/constants";

/**
 * Pindah company aktif buat user yang punya akses ke lebih dari 1
 * company (misal konsultan/investor yang pegang beberapa resto).
 *
 * Validasi keamanan penting: kita cek dulu companyId yang diminta
 * BENERAN salah satu company yang user ini jadi anggotanya —  supaya
 * gak ada cara buat "nyelonong" ke company orang lain cuma dengan
 * kirim companyId sembarangan ke action ini.
 */
export async function switchCompany(companyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login.");

  const { data: membership } = await supabase
    .from("company_users")
    .select("id")
    .eq("user_id", user.id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (!membership) throw new Error("Anda tidak punya akses ke company ini.");

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_COMPANY_COOKIE, companyId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: "lax",
  });

  redirect("/dashboard");
}
