import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_COMPANY_COOKIE } from "@/lib/constants";

/**
 * SATU-SATUNYA sumber kebenaran soal "company mana yang lagi aktif"
 * buat user yang login. Dipakai di SEMUA halaman (page.tsx) dan
 * Server Actions yang butuh scope data ke company tertentu.
 *
 * Kenapa ini penting: RLS di database cuma mastiin user bisa akses
 * SALAH SATU company yang dia jadi anggotanya — RLS gak tau/peduli
 * company mana yang lagi "aktif" di UI (itu concept aplikasi, bukan
 * database). Kalau query cuma ngandelin RLS tanpa filter company_id
 * eksplisit, user yang punya akses ke >1 company bakal lihat data
 * CAMPURAN dari semua company yang dia punya akses — makanya di
 * SETIAP query yang company-scoped, WAJIB tambahin
 * .eq("company_id", await getActiveCompanyId()) secara eksplisit.
 */
export async function getActiveCompanyId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login.");

  const { data: memberships } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", user.id);

  const ids = (memberships ?? []).map((m: { company_id: string }) => m.company_id);
  if (ids.length === 0) throw new Error("User belum terhubung ke company manapun.");

  const cookieStore = await cookies();
  const preferred = cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value;

  if (preferred && ids.includes(preferred)) return preferred;
  return ids[0];
}
