export type CompanyRole = "owner" | "manager" | "kasir" | "staff";

export interface Company {
  id: string;
  name: string;
  slug: string;
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
