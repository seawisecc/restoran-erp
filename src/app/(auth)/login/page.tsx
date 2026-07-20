"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChefHat, Sparkles, UtensilsCrossed } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signUpAndCreateCompany } from "../signup/actions";

const inputCls =
  "w-full rounded-xl border border-[#e2ddd3] bg-white px-4 py-3 text-sm text-[#1c2620] placeholder-[#9ca3af] outline-none transition focus:border-[#1e3a2c] focus:ring-2 focus:ring-[#1e3a2c]/30";

function Logo() {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1e3a2c]">
        <ChefHat size={22} className="text-white" strokeWidth={1.8} />
        <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[#c2632f]" />
      </div>
      <div className="leading-tight">
        <div className="font-bold text-[#1c2620]">Seawise Enterprise Apps</div>
        <div className="text-xs text-[#8a8f88]">Restaurants Edition</div>
      </div>
    </div>
  );
}

export default function Auth() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("login");

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Signup
  const [sName, setSName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPassword, setSPassword] = useState("");
  const [sLoading, setSLoading] = useState(false);
  const [sError, setSError] = useState<string | null>(null);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      setError("Email atau password salah.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setSLoading(true);
    setSError(null);
    const formData = new FormData();
    formData.set("company_name", sName);
    formData.set("email", sEmail.trim().toLowerCase());
    formData.set("password", sPassword);
    const result = await signUpAndCreateCompany(formData);
    if (!result.success) {
      setSError(result.error);
      setSLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className={`sw-auth ${mode === "signup" ? "active" : ""}`}>
      {/* ── Login form ── */}
      <div className="sw-form sw-form--login p-8 sm:p-10 md:p-12">
        <Logo />
        <h1 className="text-2xl font-bold text-[#1c2620]">Selamat datang</h1>
        <p className="mb-6 text-sm text-[#8a8f88]">
          Masuk untuk mengelola restoran Anda.
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1c2620]">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="nama@resto.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1c2620]">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-[#c0392b]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-[#1e3a2c] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#16281f] disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#8a8f88] md:hidden">
          Belum punya akun?{" "}
          <button
            type="button"
            onClick={() => setMode("signup")}
            className="font-semibold text-[#1e3a2c]"
          >
            Daftar restoran baru
          </button>
        </p>

        <Link
          href="/kenapa"
          className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-[#e2ddd3] bg-white/70 px-4 py-2.5 text-sm font-medium text-[#1c2620] transition-colors hover:border-[#1e3a2c]/40 hover:bg-white"
        >
          <Sparkles size={15} className="text-[#c2632f]" />
          Kenapa harus pakai aplikasi ini?
        </Link>
      </div>

      {/* ── Signup form ── */}
      <div className="sw-form sw-form--signup p-8 sm:p-10 md:p-12">
        <Logo />
        <h1 className="text-2xl font-bold text-[#1c2620]">Daftarkan restoran</h1>
        <p className="mb-6 text-sm text-[#8a8f88]">
          Mulai kelola outlet, menu, dan transaksi dalam satu platform.
        </p>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1c2620]">
              Nama Restoran
            </label>
            <input
              required
              value={sName}
              onChange={(e) => setSName(e.target.value)}
              className={inputCls}
              placeholder="misal: Warung Makan Sedap"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1c2620]">
              Email
            </label>
            <input
              type="email"
              required
              value={sEmail}
              onChange={(e) => setSEmail(e.target.value)}
              className={inputCls}
              placeholder="nama@resto.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1c2620]">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={sPassword}
              onChange={(e) => setSPassword(e.target.value)}
              className={inputCls}
              placeholder="Minimal 6 karakter"
            />
          </div>

          {sError && <p className="text-sm text-[#c0392b]">{sError}</p>}

          <button
            type="submit"
            disabled={sLoading}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-[#1e3a2c] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#16281f] disabled:opacity-60"
          >
            {sLoading ? "Memproses..." : "Daftar"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#8a8f88] md:hidden">
          Sudah punya akun?{" "}
          <button
            type="button"
            onClick={() => setMode("login")}
            className="font-semibold text-[#1e3a2c]"
          >
            Masuk di sini
          </button>
        </p>
      </div>

      {/* ── Sliding overlay (desktop) ── */}
      <div className="sw-overlay">
        {/* Terlihat saat mode LOGIN (default) → ajak daftar */}
        <div className="sw-overlay-face sw-overlay-face--signup">
          <UtensilsCrossed size={40} strokeWidth={1.6} className="mb-4" />
          <h2 className="text-2xl font-bold">Baru di sini?</h2>
          <p className="mt-2 max-w-xs text-sm text-white/80">
            Daftarkan restoran Anda dan nikmati POS, dapur, dan laporan dalam
            satu platform.
          </p>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className="mt-6 rounded-xl border border-white/70 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Daftar restoran baru
          </button>
        </div>

        {/* Terlihat saat mode SIGNUP → ajak masuk */}
        <div className="sw-overlay-face sw-overlay-face--login">
          <ChefHat size={40} strokeWidth={1.6} className="mb-4" />
          <h2 className="text-2xl font-bold">Sudah punya akun?</h2>
          <p className="mt-2 max-w-xs text-sm text-white/80">
            Masuk untuk melanjutkan mengelola outlet dan transaksi restoran
            Anda.
          </p>
          <button
            type="button"
            onClick={() => setMode("login")}
            className="mt-6 rounded-xl border border-white/70 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Masuk
          </button>
        </div>
      </div>
    </div>
  );
}
