export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          address: string | null
          created_at: string
          id: string
          loyalty_earn_rate: number
          loyalty_redeem_rate: number
          name: string
          service_enabled: boolean
          service_rate: number
          slug: string
          status: string
          subscription_expires_at: string | null
          tax_enabled: boolean
          tax_rate: number
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          loyalty_earn_rate?: number
          loyalty_redeem_rate?: number
          name: string
          service_enabled?: boolean
          service_rate?: number
          slug: string
          status?: string
          subscription_expires_at?: string | null
          tax_enabled?: boolean
          tax_rate?: number
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          loyalty_earn_rate?: number
          loyalty_redeem_rate?: number
          name?: string
          service_enabled?: boolean
          service_rate?: number
          slug?: string
          status?: string
          subscription_expires_at?: string | null
          tax_enabled?: boolean
          tax_rate?: number
        }
        Relationships: []
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          modules: string[] | null
          role: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          modules?: string[] | null
          role?: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          modules?: string[] | null
          role?: Database["public"]["Enums"]["company_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string | null
          phone: string
          points: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name?: string | null
          phone: string
          points?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string | null
          phone?: string
          points?: number
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_recipes: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          qty_used: number
          raw_material_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          qty_used?: number
          raw_material_id: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          qty_used?: number
          raw_material_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_recipes_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_recipes_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string | null
          code: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          price: number
          unit: string
        }
        Insert: {
          category_id?: string | null
          code?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price?: number
          unit?: string
        }
        Update: {
          category_id?: string | null
          code?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          kds_status: Database["public"]["Enums"]["kds_status"]
          menu_item_id: string | null
          name: string
          order_id: string
          price: number
          qty: number
        }
        Insert: {
          created_at?: string
          id?: string
          kds_status?: Database["public"]["Enums"]["kds_status"]
          menu_item_id?: string | null
          name: string
          order_id: string
          price: number
          qty?: number
        }
        Update: {
          created_at?: string
          id?: string
          kds_status?: Database["public"]["Enums"]["kds_status"]
          menu_item_id?: string | null
          name?: string
          order_id?: string
          price?: number
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          company_id: string
          created_at: string
          customer_id: string | null
          discount_amount: number
          id: string
          outlet_id: string
          paid_at: string | null
          points_earned: number
          points_redeemed: number
          service: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          table_id: string | null
          tax: number
          total: number
        }
        Insert: {
          company_id: string
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          id?: string
          outlet_id: string
          paid_at?: string | null
          points_earned?: number
          points_redeemed?: number
          service?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_id?: string | null
          tax?: number
          total?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          id?: string
          outlet_id?: string
          paid_at?: string | null
          points_earned?: number
          points_redeemed?: number
          service?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_id?: string | null
          tax?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      outlets: {
        Row: {
          address: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          address?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          address?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "outlets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          created_at: string
          id: string
          name: string
          price: number
          purchase_id: string
          qty: number
          raw_material_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          price?: number
          purchase_id: string
          qty?: number
          raw_material_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          price?: number
          purchase_id?: string
          qty?: number
          raw_material_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          company_id: string
          created_at: string
          id: string
          received_at: string | null
          status: Database["public"]["Enums"]["purchase_status"]
          supplier_id: string | null
          total: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          received_at?: string | null
          status?: Database["public"]["Enums"]["purchase_status"]
          supplier_id?: string | null
          total?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          received_at?: string | null
          status?: Database["public"]["Enums"]["purchase_status"]
          supplier_id?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_materials: {
        Row: {
          company_id: string
          cost_price: number
          created_at: string
          id: string
          min_stock: number
          name: string
          stock_qty: number
          unit: string
        }
        Insert: {
          company_id: string
          cost_price?: number
          created_at?: string
          id?: string
          min_stock?: number
          name: string
          stock_qty?: number
          unit?: string
        }
        Update: {
          company_id?: string
          cost_price?: number
          created_at?: string
          id?: string
          min_stock?: number
          name?: string
          stock_qty?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_materials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          outlet_id: string
          seats: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          outlet_id: string
          seats?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          outlet_id?: string
          seats?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_tables_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          company_id: string
          contact_person: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          company_id: string
          contact_person?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string
          contact_person?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_company_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      company_role: "owner" | "manager" | "kasir" | "staff"
      kds_status: "queued" | "preparing" | "ready"
      order_status: "open" | "paid" | "cancelled"
      purchase_status: "pending" | "received" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      company_role: ["owner", "manager", "kasir", "staff"],
      kds_status: ["queued", "preparing", "ready"],
      order_status: ["open", "paid", "cancelled"],
      purchase_status: ["pending", "received", "cancelled"],
    },
  },
} as const
