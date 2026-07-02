"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(`[DEBUG] ${error.message}`);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="card w-full max-w-sm p-8">
      <h1 className="text-xl font-bold text-ink">RestoERP</h1>
      <p className="mb-6 text-sm text-ink-muted">Masuk ke akun anda</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="nama@resto.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-accent-danger">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
