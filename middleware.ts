import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Jalankan middleware di semua path KECUALI:
     * - static files (_next/static, _next/image)
     * - favicon
     * - aset PWA (service worker + manifest), harus bisa diambil
     *   tanpa kena refresh session sama sekali
     * - file gambar
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
