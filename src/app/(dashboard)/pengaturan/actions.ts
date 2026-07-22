"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveCompanyId } from "@/lib/get-active-company";
import type { Database } from "@/lib/types/database.types";

type CompanyUpdate = Database["public"]["Tables"]["companies"]["Update"];

// Hanya owner yang boleh mengubah profil resto & mengelola pengguna.
async function assertOwner(companyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login.");

  const { data: membership } = await supabase
    .from("company_users")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership?.role !== "owner") {
    throw new Error("Hanya pemilik yang boleh melakukan aksi ini.");
  }
}

/**
 * Update baris `companies` dengan aman.
 *
 * Kenapa pakai admin client: kalau RLS pada tabel companies tidak
 * mengizinkan UPDATE dari user biasa, PostgREST TIDAK melempar error —
 * dia balas sukses dengan 0 baris terubah. Akibatnya penyimpanan gagal
 * diam-diam dan nilainya terlihat "balik lagi". Kita sudah memverifikasi
 * pemanggilnya owner lewat assertOwner(), jadi aman memakai service role.
 *
 * `.select("id")` dipakai untuk MEMASTIKAN memang ada baris yang berubah;
 * kalau kosong, kita lempar error yang jelas alih-alih diam.
 */
async function updateCompanyRow(companyId: string, patch: CompanyUpdate) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("companies")
    .update(patch)
    .eq("id", companyId)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error(
      "Pengaturan gagal disimpan — data restoran tidak ditemukan atau tidak bisa diubah.",
    );
  }
}

// ===================== PROFIL RESTO =====================

export async function updateCompanyProfile(formData: FormData) {
  const companyId = await getActiveCompanyId();
  await assertOwner(companyId);

  const name = (formData.get("name") as string)?.trim();
  const address = (formData.get("address") as string)?.trim() || null;
  if (!name) throw new Error("Nama restoran wajib diisi.");

  await updateCompanyRow(companyId, { name, address });
  revalidatePath("/pengaturan");
  revalidatePath("/dashboard");
}

/**
 * Simpan URL logo usaha. File-nya sudah diunggah ke Supabase Storage
 * dari sisi client; di sini kita cukup menyimpan URL-nya (atau null
 * saat logo dihapus). Owner-only + verifikasi baris.
 */
export async function saveCompanyLogo(logoUrl: string | null) {
  const companyId = await getActiveCompanyId();
  await assertOwner(companyId);

  const clean = logoUrl?.trim() || null;
  await updateCompanyRow(companyId, { logo_url: clean });

  revalidatePath("/pengaturan");
  revalidatePath("/transaksi");
  revalidatePath("/", "layout");
}

// ===================== PAJAK & SERVICE =====================

export async function updateChargeSettings(formData: FormData) {
  const companyId = await getActiveCompanyId();
  await assertOwner(companyId);

  const taxEnabled = formData.get("tax_enabled") === "on";
  const serviceEnabled = formData.get("service_enabled") === "on";
  const taxRate = Number(formData.get("tax_rate"));
  const serviceRate = Number(formData.get("service_rate"));

  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
    throw new Error("Rate pajak harus 0–100%.");
  }
  if (!Number.isFinite(serviceRate) || serviceRate < 0 || serviceRate > 100) {
    throw new Error("Rate service harus 0–100%.");
  }

  await updateCompanyRow(companyId, {
    tax_enabled: taxEnabled,
    tax_rate: taxRate,
    service_enabled: serviceEnabled,
    service_rate: serviceRate,
  });

  revalidatePath("/pengaturan");
  revalidatePath("/transaksi");
  // Layout dashboard yang menyuplai setting ini ke layar kasir.
  revalidatePath("/", "layout");
}

// ===================== NOTA / PRINTER =====================

const VALID_PAPERS = ["58mm", "80mm", "a4"] as const;

export async function updateReceiptSettings(formData: FormData) {
  const companyId = await getActiveCompanyId();
  await assertOwner(companyId);

  const paper = String(formData.get("receipt_paper") || "80mm");
  if (!VALID_PAPERS.includes(paper as (typeof VALID_PAPERS)[number])) {
    throw new Error("Ukuran kertas tidak valid.");
  }

  await updateCompanyRow(companyId, { receipt_paper: paper });
  revalidatePath("/pengaturan");
  revalidatePath("/transaksi");
}

// ===================== MANAJEMEN PENGGUNA =====================

const VALID_ROLES = ["owner", "manager", "kasir", "staff"] as const;

function parseModules(formData: FormData, role: string): string[] | null {
  // Owner selalu akses penuh -> modules null.
  if (role === "owner") return null;
  return formData.getAll("modules").map((m) => String(m));
}

export async function createTeamUser(formData: FormData) {
  const companyId = await getActiveCompanyId();
  await assertOwner(companyId);

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const fullName = (formData.get("full_name") as string)?.trim() || null;
  const role = (formData.get("role") as string) || "kasir";

  if (!email || !password) throw new Error("Email dan password wajib diisi.");
  if (password.length < 6) throw new Error("Password minimal 6 karakter.");
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    throw new Error("Role tidak valid.");
  }

  const admin = createAdminClient();

  // Buat akun login (langsung terkonfirmasi biar bisa langsung dipakai).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createErr) throw new Error(createErr.message);

  const userId = created.user?.id;
  if (!userId) throw new Error("Gagal membuat akun.");

  const { error: memberErr } = await admin.from("company_users").insert({
    company_id: companyId,
    user_id: userId,
    role: role as (typeof VALID_ROLES)[number],
    full_name: fullName,
    modules: parseModules(formData, role),
    is_active: true,
  });
  if (memberErr) throw new Error(memberErr.message);

  revalidatePath("/pengaturan");
}

export async function updateTeamUser(membershipId: string, formData: FormData) {
  const companyId = await getActiveCompanyId();
  await assertOwner(companyId);

  const fullName = (formData.get("full_name") as string)?.trim() || null;
  const role = (formData.get("role") as string) || "kasir";
  const isActive = formData.get("is_active") === "on";
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    throw new Error("Role tidak valid.");
  }

  const admin = createAdminClient();

  // Pastikan membership ini memang milik company yang aktif (cegah
  // edit lintas-tenant).
  const { data: row } = await admin
    .from("company_users")
    .select("id, company_id")
    .eq("id", membershipId)
    .maybeSingle();
  if (!row || row.company_id !== companyId) {
    throw new Error("Data pengguna tidak ditemukan.");
  }

  const { error } = await admin
    .from("company_users")
    .update({
      full_name: fullName,
      role: role as (typeof VALID_ROLES)[number],
      modules: parseModules(formData, role),
      is_active: isActive,
    })
    .eq("id", membershipId);
  if (error) throw new Error(error.message);

  revalidatePath("/pengaturan");
}

export async function deleteTeamUser(membershipId: string) {
  const companyId = await getActiveCompanyId();
  await assertOwner(companyId);

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("company_users")
    .select("id, company_id, role")
    .eq("id", membershipId)
    .maybeSingle();
  if (!row || row.company_id !== companyId) {
    throw new Error("Data pengguna tidak ditemukan.");
  }
  if (row.role === "owner") {
    throw new Error("Pemilik tidak bisa dihapus.");
  }

  const { error } = await admin
    .from("company_users")
    .delete()
    .eq("id", membershipId);
  if (error) throw new Error(error.message);

  revalidatePath("/pengaturan");
}

// ===================== OUTLET =====================

export async function createOutlet(formData: FormData) {
  const supabase = await createClient();
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
  const supabase = await createClient();

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
  const supabase = await createClient();
  const { error } = await supabase
    .from("outlets")
    .update({ is_active: nextActive })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pengaturan");
}

// ===================== MEJA =====================

export async function createTable(formData: FormData) {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { error } = await supabase.from("restaurant_tables").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pengaturan");
  revalidatePath("/transaksi");
}

// ===================== LOYALTY =====================

export async function updateLoyaltySettings(formData: FormData) {
  const companyId = await getActiveCompanyId();
  await assertOwner(companyId);

  const earnRate = Number(formData.get("loyalty_earn_rate"));
  const redeemRate = Number(formData.get("loyalty_redeem_rate"));

  if (!Number.isFinite(earnRate) || earnRate <= 0) {
    throw new Error("Rate poin didapat harus lebih dari 0.");
  }
  if (!Number.isFinite(redeemRate) || redeemRate <= 0) {
    throw new Error("Rate poin ditukar harus lebih dari 0.");
  }

  await updateCompanyRow(companyId, {
    loyalty_earn_rate: earnRate,
    loyalty_redeem_rate: redeemRate,
  });

  revalidatePath("/pengaturan");
  revalidatePath("/", "layout");
}
