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
}

export interface CompanyUser {
  id: string;
  company_id: string;
  user_id: string;
  role: CompanyRole;
}

export interface ActiveCompanyContext {
  company: Company;
  role: CompanyRole;
}
