export type CompanyRole = "owner" | "manager" | "kasir" | "staff";

export type CompanyStatus = "pending" | "approved" | "rejected";

export interface Company {
  id: string;
  name: string;
  slug: string;
  status: CompanyStatus;
  subscription_expires_at: string | null;
  loyalty_earn_rate: number;
  loyalty_redeem_rate: number;
  created_at: string;
  // URL logo usaha (dicetak di kepala nota). null = belum ada.
  logo_url: string | null;
  // Pengaturan biaya transaksi (pajak & service charge).
  tax_enabled: boolean;
  tax_rate: number;
  service_enabled: boolean;
  service_rate: number;
}

export interface CompanyUser {
  id: string;
  company_id: string;
  user_id: string;
  role: CompanyRole;
  full_name: string | null;
  modules: string[] | null;
  is_active: boolean;
}

export interface ActiveCompanyContext {
  company: Company;
  role: CompanyRole;
  // Modul yang boleh diakses user aktif. null = akses penuh (owner).
  modules: string[] | null;
}
