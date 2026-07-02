"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  BarChart3,
  Menu,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/transaksi", label: "Kasir", icon: ShoppingCart },
  { href: "/produk-stok", label: "Menu", icon: UtensilsCrossed },
  { href: "/laporan", label: "Laporan", icon: BarChart3 },
  { href: "/pengaturan", label: "Lainnya", icon: Menu },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-surface-border bg-surface-card md:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${
              active ? "text-accent" : "text-ink-muted"
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
