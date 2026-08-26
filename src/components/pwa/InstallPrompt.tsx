"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "resto-install-dismissed";

/**
 * Event `beforeinstallprompt` belum ada di lib DOM bawaan TypeScript.
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Tombol "Install App" untuk Chrome/Edge desktop & Android.
 *
 * Chrome sebenarnya sudah nampilin ikon install di address bar, tapi
 * banyak user gak ngeh. Komponen ini nangkep event beforeinstallprompt
 * lalu nawarin tombolnya secara eksplisit. Kalau app-nya sudah
 * ke-install (atau browsernya gak support, mis. Safari), komponen ini
 * gak render apa-apa.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onPrompt = (event: Event) => {
      // Cegah mini-infobar bawaan Chrome, simpen event-nya buat dipakai
      // pas user klik tombol di bawah.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => setDeferred(null);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferred) return null;

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    // Event cuma bisa dipakai sekali, apapun pilihan user.
    setDeferred(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDeferred(null);
  };

  return (
    // bottom-20 di mobile supaya gak ketiban MobileNav yang fixed di bawah.
    <div className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-card border border-surface-border bg-surface-card px-3 py-2 shadow-lg sm:bottom-6 sm:right-6">
      <button type="button" onClick={install} className="btn-primary gap-2">
        <Download className="h-4 w-4" />
        Install App
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Tutup tawaran install"
        className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
