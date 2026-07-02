"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ActiveCompanyContext } from "@/types";

const CompanyContext = createContext<ActiveCompanyContext | null>(null);

/**
 * Bungkus layout dashboard dengan provider ini, isi-nya diambil di
 * Server Component (layout.tsx) dari tabel company_users, lalu di-pass
 * sebagai prop. Semua Client Component di bawahnya tinggal panggil
 * useCompany() buat tau lagi kerja di company mana + role apa.
 */
export function CompanyProvider({
  value,
  children,
}: {
  value: ActiveCompanyContext;
  children: ReactNode;
}) {
  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) {
    throw new Error("useCompany() harus dipanggil di dalam <CompanyProvider>");
  }
  return ctx;
}
