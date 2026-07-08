"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function UserMenu({ email }: { email: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white"
      >
        {email.charAt(0).toUpperCase()}
      </button>

      {open && (
        <>
          {/* Backdrop buat nutup dropdown pas klik di luar */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 z-20 w-56 rounded-lg border border-surface-border bg-surface-card p-1.5 shadow-lg">
            <p className="truncate px-2.5 py-2 text-xs text-ink-muted">{email}</p>
            <div className="my-1 border-t border-surface-border" />
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-accent-danger hover:bg-surface"
            >
              <LogOut size={14} />
              {loggingOut ? "Keluar..." : "Keluar"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
