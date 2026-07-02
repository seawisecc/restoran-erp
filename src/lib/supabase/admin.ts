import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

/**
 * PERINGATAN: client ini pakai SERVICE_ROLE_KEY yang BYPASS semua RLS policy.
 *
 * Jangan pernah:
 * - Import file ini di Client Component
 * - Expose SUPABASE_SERVICE_ROLE_KEY dengan prefix NEXT_PUBLIC_
 *
 * Hanya pakai untuk operasi admin yang memang harus lintas-tenant, contoh:
 * - Proses onboarding company baru (bikin row companies + company_users
 *   pertama, sebelum user itu sendiri punya akses RLS)
 * - Cron job / webhook billing
 * - Superadmin dashboard (kalau nanti ada, buat lo pantau semua tenant)
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
