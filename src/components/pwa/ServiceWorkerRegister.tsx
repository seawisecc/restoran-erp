"use client";

import { useEffect } from "react";

/**
 * Daftarin /sw.js sekali di root layout. Tanpa service worker yang punya
 * fetch handler, Chrome gak nawarin opsi "Install app".
 *
 * Registrasi sengaja ditunda sampai window load supaya gak rebutan
 * bandwidth sama render pertama.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator))
      return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          // Kalau ada versi baru yang udah keburu ke-install, langsung
          // aktifin biar user gak kebagian SW basi berhari-hari.
          if (registration.waiting) {
            registration.waiting.postMessage("SKIP_WAITING");
          }
        })
        .catch(() => {
          // Registrasi gagal (mis. browser lama / http non-localhost).
          // Aplikasi tetap jalan normal, jadi cukup diabaikan.
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
