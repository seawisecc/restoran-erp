import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database.types";

/**
 * Dipakai di Server Components, Server Actions, dan Route Handlers.
 * Selalu buat instance BARU di tiap request (jangan disimpan sebagai
 * singleton global), karena cookie session beda-beda per request/user.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as CookieOptions),
            );
          } catch {
            // setAll dipanggil dari Server Component (bukan Server Action /
            // Route Handler) — aman diabaikan kalau middleware sudah
            // menangani refresh session.
          }
        },
      },
    },
  );
}
