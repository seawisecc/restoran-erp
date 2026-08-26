import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Offline",
  description: "Koneksi internet tidak tersedia.",
};

/**
 * Fallback yang dipakai service worker waktu user buka halaman dalam
 * kondisi offline. Sengaja statis penuh (tanpa query ke Supabase) supaya
 * bisa di-precache.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-peachBg">
          <WifiOff className="h-6 w-6 text-accent-peach" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-ink">
          Kamu sedang offline
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Aplikasi butuh koneksi internet untuk menampilkan data transaksi,
          stok, dan laporan. Cek koneksi kamu, lalu coba lagi.
        </p>
        <a href="/dashboard" className="btn-primary mt-6">
          Coba lagi
        </a>
      </div>
    </main>
  );
}
