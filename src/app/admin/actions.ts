"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Dipanggil di awal tiap action buat mastiin yang manggil action ini
 * beneran super admin — pengecekan kedua selain gate di layout.tsx,
 * biar aman walau action-nya suatu saat dipanggil dari tempat lain.
 */
async function assertSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login.");

  const { data: adminRow } = await supabase
    .from("platform_admins")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) throw new Error("Bukan super admin.");
}

export async function approveCompany(companyId: string) {
  await assertSuperAdmin();
  const admin = createAdminClient();

  const { data: company } = await admin
    .from("companies")
    .select("subscription_expires_at")
    .eq("id", companyId)
    .maybeSingle();

  const updates: { status: "approved"; subscription_expires_at?: string } = {
    status: "approved",
  };

  // Kalau belum ada masa aktif sama sekali (data lama / edge case),
  // kasih default 30 hari dari sekarang biar gak nyangkut null.
  if (!company?.subscription_expires_at) {
    updates.subscription_expires_at = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
  }

  const { error } = await admin
    .from("companies")
    .update(updates)
    .eq("id", companyId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function rejectCompany(companyId: string) {
  await assertSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("companies")
    .update({ status: "rejected" })
    .eq("id", companyId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/**
 * Perpanjang masa aktif. Kalau langganan masih berlaku, nambahin dari
 * tanggal expired yang sekarang (biar gak "kepotong" hari yang masih
 * sisa). Kalau udah lewat, ngitungnya mulai dari hari ini.
 */
export async function extendSubscription(companyId: string, days: number) {
  await assertSuperAdmin();
  const admin = createAdminClient();

  const { data: company } = await admin
    .from("companies")
    .select("subscription_expires_at")
    .eq("id", companyId)
    .maybeSingle();

  const currentExpiry = company?.subscription_expires_at
    ? new Date(company.subscription_expires_at)
    : null;
  const now = new Date();
  const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const newExpiry = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  const { error } = await admin
    .from("companies")
    .update({ subscription_expires_at: newExpiry.toISOString() })
    .eq("id", companyId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function setSubscriptionDate(companyId: string, isoDate: string) {
  await assertSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("companies")
    .update({ subscription_expires_at: new Date(isoDate).toISOString() })
    .eq("id", companyId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}