"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  Package,
  Truck,
  BarChart3,
  Settings,
} from "lucide-react";

const menu = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/produk-stok", label: "Menu & Stok", icon: UtensilsCrossed },
  { href: "/transaksi", label: "Transaksi", icon: ShoppingCart },
  { href: "/pembelian", label: "Pembelian", icon: Package },
  { href: "/supplier", label: "Supplier", icon: Truck },
  { href: "/laporan", label: "Laporan", icon: BarChart3 },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-sidebar px-3 py-6 md:flex">
      <div className="mb-8 px-3">
        <h1 className="text-xl font-bold text-sidebar-foreground">
          RestoERP
        </h1>
        <p className="text-xs text-sidebar-muted">
          Sistem Manajemen Restoran
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {menu.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-sidebar-hover text-sidebar-foreground"
                  : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
