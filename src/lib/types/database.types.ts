/**
 * File ini SEMENTARA ditulis manual sebagai placeholder.
 *
 * Setelah skema database (tabel companies, company_users, dst) dibuat di
 * Supabase, generate ulang file ini secara otomatis dengan:
 *
 *   npx supabase login
 *   npx supabase link --project-ref <project-id>
 *   npm run supabase:types
 *
 * Jangan edit manual setelah di-generate — biar selalu sinkron dengan
 * skema database yang sebenarnya.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
