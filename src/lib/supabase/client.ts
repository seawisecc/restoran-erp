import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";

/**
 * Dipakai di Client Components ("use client").
 * Contoh: form login, POS screen interaktif, KDS realtime.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
