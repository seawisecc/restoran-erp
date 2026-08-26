import type { MetadataRoute } from "next";

/**
 * Web App Manifest — bikin app ini bisa di-install (PWA) lewat Chrome,
 * Edge, maupun "Add to Home Screen" di Android/iOS.
 *
 * Next.js serve file ini di /manifest.webmanifest (dirujuk otomatis dari
 * metadata.manifest di src/app/layout.tsx).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Resto & Cafe Management by Seawise Studio",
    short_name: "Resto Manager",
    description:
      "Sistem manajemen restoran & kafe: kasir per meja, layar dapur real-time, QR order, stok & HPP per porsi, sampai laporan dalam satu platform.",
    id: "/dashboard",
    // Dibuka langsung ke dashboard. Kalau session-nya habis, middleware
    // yang lempar ke /login.
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#eef0ea",
    theme_color: "#1e3a2c",
    lang: "id",
    dir: "ltr",
    categories: ["business", "food", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Kasir / Transaksi",
        short_name: "Kasir",
        url: "/transaksi",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Layar Dapur (KDS)",
        short_name: "Dapur",
        url: "/dapur",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Laporan",
        short_name: "Laporan",
        url: "/laporan",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
