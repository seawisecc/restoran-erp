"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUpAndCreateCompany } from "./actions";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await signUpAndCreateCompany(formData);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="card w-full max-w-sm p-8">
      <h1 className="text-xl font-bold text-ink">RestoERP</h1>
      <p className="mb-6 text-sm text-ink-muted">Daftarkan restoran anda</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Nama Restoran
          </label>
          <input
            name="company_name"
            required
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="misal: Warung Makan Sedap"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="nama@resto.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Password</label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="Minimal 6 karakter"
          />
        </div>

        {error && <p className="text-sm text-accent-danger">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? "Memproses..." : "Daftar"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-muted">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-accent-link">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
