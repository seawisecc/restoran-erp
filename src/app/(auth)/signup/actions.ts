"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type SignUpResult = { success: true } | { success: false; error: string };

/**
 * Alur onboarding self-service:
 * 1. Bikin akun user lewat Supabase Auth (client biasa, bukan admin)
 * 2. Bikin company + hubungkan user itu sebagai 'owner' + bikin 1
 *    outlet default — ini WAJIB pakai admin client (service role),
 *    karena user yang baru daftar belum punya baris apapun di
 *    company_users, jadi RLS bakal nolak insert langsung dari dia.
 *
 * Kalau step 2 gagal padahal step 1 udah sukses, user tetap punya
 * akun tapi belum ke-attach ke company manapun — nanti pas dia
 * login, layout dashboard bakal redirect balik ke /login karena
 * gak nemu membership. Kasus ini jarang terjadi tapi baik untuk
 * diketahui.
 */
export async function signUpAndCreateCompany(
  formData: FormData,
): Promise<SignUpResult> {
  const companyName = (formData.get("company_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!companyName) return { success: false, error: "Nama restoran wajib diisi." };
  if (!email || !password) {
    return { success: false, error: "Email dan password wajib diisi." };
  }
  if (password.length < 6) {
    return { success: false, error: "Password minimal 6 karakter." };
  }

  const supabase = await createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    return { success: false, error: signUpError.message };
  }

  const userId = signUpData.user?.id;
  if (!userId) {
    return { success: false, error: "Gagal membuat akun. Coba lagi." };
  }

  const admin = createAdminClient() as any;

  // Pastikan slug unik — kalau nama restoran bentrok, tambahin suffix.
  let slug = slugify(companyName) || "resto";
  const { data: existingSlug } = await admin
    .from("companies")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existingSlug) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const trialExpiresAt = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({
      name: companyName,
      slug,
      status: "pending",
      subscription_expires_at: trialExpiresAt,
    })
    .select("id")
    .single();

  if (companyError) {
    return { success: false, error: "Gagal membuat company: " + companyError.message };
  }

  const { error: memberError } = await admin.from("company_users").insert({
    company_id: company.id,
    user_id: userId,
    role: "owner",
  });

  if (memberError) {
    return {
      success: false,
      error: "Gagal menghubungkan akun ke company: " + memberError.message,
    };
  }

  const { error: outletError } = await admin.from("outlets").insert({
    company_id: company.id,
    name: "Outlet Utama",
  });

  if (outletError) {
    return {
      success: false,
      error: "Gagal membuat outlet default: " + outletError.message,
    };
  }

  return { success: true };
}
