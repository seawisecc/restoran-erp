/**
 * Tipe ini sekarang sudah ditulis manual supaya cocok dengan skema di
 * supabase/migrations/0001_init_multitenant.sql
 *
 * Ke depannya, kalau lo nambah tabel baru, tipe di sini juga perlu
 * di-update (manual, atau generate otomatis lewat Supabase CLI):
 *
 *   npx supabase login
 *   npx supabase link --project-ref <project-id>
 *   npm run supabase:types
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CompanyRole = "owner" | "manager" | "kasir" | "staff";

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
              Relationships: [];
      };
      company_users: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          role: CompanyRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          role?: CompanyRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string;
          role?: CompanyRole;
          created_at?: string;
        };
              Relationships: [];
      };
      outlets: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          address: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
              Relationships: [];
      };
      menu_categories: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
        };
              Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          company_id: string;
          category_id: string | null;
          code: string | null;
          name: string;
          unit: string;
          price: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          category_id?: string | null;
          code?: string | null;
          name: string;
          unit?: string;
          price?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          category_id?: string | null;
          code?: string | null;
          name?: string;
          unit?: string;
          price?: number;
          is_active?: boolean;
          created_at?: string;
        };
              Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_company_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
    };
    Enums: {
      company_role: CompanyRole;
    };
    CompositeTypes: Record<string, never>;
  };
}