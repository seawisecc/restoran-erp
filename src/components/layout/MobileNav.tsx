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
import { useCompany } from "@/components/providers/CompanyProvider";
import { canAccessModule } from "@/lib/modules";

const items = [
  { href: "/dashboard", key: "dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/transaksi", key: "transaksi", label: "Kasir", icon: ShoppingCart },
  { href: "/produk-stok", key: "produk-stok", label: "Menu", icon: UtensilsCrossed },
  { href: "/laporan", key: "laporan", label: "Laporan", icon: BarChart3 },
  { href: "/pengaturan", key: "pengaturan", label: "Lainnya", icon: Menu },
];

export function MobileNav() {
  const pathname = usePathname();
  const { modules } = useCompany();
  const visibleItems = items.filter((i) => canAccessModule(modules, i.key));

  return (
    // z-30 supaya selalu di atas konten (kartu keranjang, dsb), dan
    // padding safe-area biar tidak ketutup home indicator iPhone.
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-surface-border bg-surface-card md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {visibleItems.map(({ href, label, icon: Icon }) => {
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
