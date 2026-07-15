"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  Flame,
  Package,
  Truck,
  BarChart3,
  Settings,
  Users,
  ChefHat,
  PanelLeftClose,
  PanelLeft,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/components/providers/CompanyProvider";
import { canAccessModule } from "@/lib/modules";

const menu = [
  { href: "/dashboard", key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/produk-stok", key: "produk-stok", label: "Menu & Stok", icon: UtensilsCrossed },
  { href: "/transaksi", key: "transaksi", label: "Transaksi", icon: ShoppingCart },
  { href: "/dapur", key: "dapur", label: "Dapur", icon: Flame },
  { href: "/pelanggan", key: "pelanggan", label: "Pelanggan", icon: Users },
  { href: "/pembelian", key: "pembelian", label: "Pembelian", icon: Package },
  { href: "/supplier", key: "supplier", label: "Supplier", icon: Truck },
  { href: "/laporan", key: "laporan", label: "Laporan", icon: BarChart3 },
  { href: "/pengaturan", key: "pengaturan", label: "Pengaturan", icon: Settings },
];

const STORAGE_KEY = "sw_sidebar_collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { modules } = useCompany();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Owner (modules null) lihat semua; user lain cuma modul yang diberi.
  const visibleMenu = menu.filter((m) => canAccessModule(modules, m.key));

  // Pulihkan preferensi collapse dari kunjungan sebelumnya.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* localStorage tidak tersedia — abaikan */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* abaikan */
      }
      return next;
    });
  }

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={`hidden shrink-0 flex-col bg-sidebar py-6 transition-[width] duration-200 md:flex ${
        collapsed ? "w-20 px-2" : "w-64 px-3"
      }`}
    >
      {/* Brand */}
      <div
        className={`mb-4 flex items-center ${
          collapsed ? "justify-center px-0" : "gap-3 px-3"
        }`}
      >
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent">
          <ChefHat size={22} className="text-white" strokeWidth={1.8} />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-accent-peach" />
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-sm font-semibold text-sidebar-foreground">
              Seawise Enterprise
            </h1>
            <p className="truncate text-xs text-sidebar-muted">
              Restaurants Edition
            </p>
          </div>
        )}
      </div>

      {/* Tombol minimize/perbesar */}
      <button
        onClick={toggleCollapsed}
        title={collapsed ? "Perbesar sidebar" : "Perkecil sidebar"}
        className={`mb-4 flex items-center rounded-xl border border-white/10 bg-white/[0.06] py-2.5 text-sidebar-muted transition hover:bg-white/10 ${
          collapsed ? "justify-center px-0" : "justify-between px-3"
        }`}
      >
        {!collapsed && (
          <span className="text-xs font-medium text-sidebar-foreground">
            Sembunyikan
          </span>
        )}
        {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={16} />}
      </button>

      {/* Menu */}
      <nav className="flex flex-1 flex-col gap-1">
        {visibleMenu.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center rounded-lg py-2.5 text-sm transition-colors ${
                collapsed ? "justify-center px-0" : "gap-3 px-3"
              } ${
                active
                  ? "bg-sidebar-hover text-sidebar-foreground"
                  : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="mt-2 border-t border-white/10 pt-3">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title={collapsed ? "Keluar" : undefined}
          className={`flex w-full items-center rounded-lg py-2.5 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-white disabled:opacity-60 ${
            collapsed ? "justify-center px-0" : "gap-3 px-3"
          }`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && (
            <span className="truncate">
              {loggingOut ? "Keluar..." : "Keluar"}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
