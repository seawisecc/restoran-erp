import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/**
 * Base URL untuk link preview.
 *
 * PENTING: jangan pakai VERCEL_URL sebagai pilihan utama. VERCEL_URL
 * berisi URL unik per-deployment (mis. restoran-abc123-seawise.vercel.app)
 * yang di akun tim dilindungi Deployment Protection — crawler WhatsApp/
 * Facebook bakal dapat halaman login Vercel, bukan gambar, sehingga
 * preview-nya kosong.
 *
 * Urutan yang benar:
 * 1. NEXT_PUBLIC_SITE_URL  — domain final (set manual, paling pasti)
 * 2. VERCEL_PROJECT_PRODUCTION_URL — domain produksi proyek di Vercel
 * 3. VERCEL_URL — cadangan terakhir (preview deployment)
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

const title = "Seawise Enterprise Apps — Restaurants Edition";
const description =
  "Sistem manajemen restoran: kasir per meja, layar dapur real-time, QR order, stok & HPP per porsi, sampai laporan dalam satu platform.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s · Seawise Restaurants Edition",
  },
  description,
  applicationName: "Seawise Restaurants Edition",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "Seawise Enterprise Apps",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
