/*
 * Service worker Resto & Cafe Management (Seawise Studio).
 *
 * Sengaja ditulis manual (tanpa Workbox) dan dibikin KONSERVATIF karena
 * ini aplikasi ERP multi-tenant:
 *
 * - Halaman & API TIDAK PERNAH di-cache. Data transaksi/stok harus selalu
 *   fresh, dan halaman berisi data tenant tertentu haram nyangkut di cache
 *   lalu kebaca user lain di device yang sama.
 * - Yang di-cache cuma aset statis yang memang immutable (/_next/static,
 *   ikon, font) plus halaman /offline sebagai fallback.
 *
 * Tujuan utamanya installability (biar bisa di-install di Chrome) +
 * pengalaman offline yang sopan, bukan aplikasi offline-first penuh.
 */

const VERSION = "v1";
const STATIC_CACHE = `resto-static-${VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Pakai reload biar gak ngambil dari HTTP cache browser yang basi.
      await Promise.all(
        PRECACHE_URLS.map((url) =>
          cache
            .add(new Request(url, { cache: "reload" }))
            .catch(() => undefined),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("resto-") && key !== STATIC_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

// Dipakai komponen ServiceWorkerRegister buat langsung mengaktifkan
// versi baru tanpa nunggu semua tab ditutup.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

/** Aset yang aman & berguna buat di-cache (immutable / jarang berubah). */
function isCacheableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:css|js|woff2?|png|jpg|jpeg|gif|svg|webp|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cross-origin (Supabase, Google Fonts, dll) — biarin lewat apa adanya.
  if (url.origin !== self.location.origin) return;

  // Navigasi halaman: selalu ke network. Kalau jaringan mati, kasih
  // halaman /offline. Responsnya sendiri gak pernah disimpan.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(STATIC_CACHE);
          const offline = await cache.match(OFFLINE_URL);
          return (
            offline ??
            new Response(
              "<h1>Offline</h1><p>Koneksi internet tidak tersedia.</p>",
              { headers: { "Content-Type": "text/html; charset=utf-8" } },
            )
          );
        }
      })(),
    );
    return;
  }

  // API & data route: jangan disentuh sama sekali.
  if (url.pathname.startsWith("/api/")) return;

  // Aset statis: cache-first, isi cache di belakang layar.
  if (isCacheableAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;

        try {
          const response = await fetch(request);
          if (response.ok && response.type === "basic") {
            cache.put(request, response.clone());
          }
          return response;
        } catch (error) {
          if (cached) return cached;
          throw error;
        }
      })(),
    );
  }
});
