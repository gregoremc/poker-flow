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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: string
          metadata: Json | null
          organization_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      buy_ins: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_bonus: boolean
          organization_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          player_id: string
          session_id: string | null
          table_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          is_bonus?: boolean
          organization_id?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          player_id: string
          session_id?: string | null
          table_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          is_bonus?: boolean
          organization_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          player_id?: string
          session_id?: string | null
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buy_ins_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buy_ins_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buy_ins_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buy_ins_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      cancelled_buy_ins: {
        Row: {
          amount: number
          cancelled_at: string
          created_at: string
          id: string
          organization_id: string | null
          original_buy_in_id: string | null
          payment_method: string
          player_id: string
          player_name: string
          session_id: string | null
          table_id: string | null
          table_name: string | null
        }
        Insert: {
          amount: number
          cancelled_at?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          original_buy_in_id?: string | null
          payment_method: string
          player_id: string
          player_name: string
          session_id?: string | null
          table_id?: string | null
          table_name?: string | null
        }
        Update: {
          amount?: number
          cancelled_at?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          original_buy_in_id?: string | null
          payment_method?: string
          player_id?: string
          player_name?: string
          session_id?: string | null
          table_id?: string | null
          table_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cancelled_buy_ins_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancelled_buy_ins_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_outs: {
        Row: {
          chip_value: number
          created_at: string
          id: string
          organization_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          player_id: string
          profit: number
          session_id: string | null
          table_id: string
          total_buy_in: number
        }
        Insert: {
          chip_value: number
          created_at?: string
          id?: string
          organization_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          player_id: string
          profit: number
          session_id?: string | null
          table_id: string
          total_buy_in: number
        }
        Update: {
          chip_value?: number
          created_at?: string
          id?: string
          organization_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          player_id?: string
          profit?: number
          session_id?: string | null
          table_id?: string
          total_buy_in?: number
        }
        Relationships: [
          {
            foreignKeyName: "cash_outs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_outs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_outs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_outs_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          closed_at: string | null
          created_at: string
          final_chip_inventory: Json | null
          id: string
          initial_chip_inventory: Json | null
          is_open: boolean
          name: string
          notes: string | null
          organization_id: string | null
          responsible: string | null
          session_date: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          final_chip_inventory?: Json | null
          id?: string
          initial_chip_inventory?: Json | null
          is_open?: boolean
          name?: string
          notes?: string | null
          organization_id?: string | null
          responsible?: string | null
          session_date: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          final_chip_inventory?: Json | null
          id?: string
          initial_chip_inventory?: Json | null
          is_open?: boolean
          name?: string
          notes?: string | null
          organization_id?: string | null
          responsible?: string | null
          session_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chip_types: {
        Row: {
          color: string
          created_at: string
          id: string
          organization_id: string | null
          sort_order: number
          value: number
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          organization_id?: string | null
          sort_order?: number
          value: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          sort_order?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "chip_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      club_settings: {
        Row: {
          club_name: string
          created_at: string
          credit_limit_per_player: number
          id: string
          logo_url: string | null
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          club_name?: string
          created_at?: string
          credit_limit_per_player?: number
          id?: string
          logo_url?: string | null
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          club_name?: string
          created_at?: string
          credit_limit_per_player?: number
          id?: string
          logo_url?: string | null
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_records: {
        Row: {
          amount: number
          buy_in_id: string | null
          created_at: string
          id: string
          is_paid: boolean
          notes: string | null
          organization_id: string | null
          paid_at: string | null
          player_id: string
        }
        Insert: {
          amount: number
          buy_in_id?: string | null
          created_at?: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          organization_id?: string | null
          paid_at?: string | null
          player_id: string
        }
        Update: {
          amount?: number
          buy_in_id?: string | null
          created_at?: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          organization_id?: string | null
          paid_at?: string | null
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_records_buy_in_id_fkey"
            columns: ["buy_in_id"]
            isOneToOne: false
            referencedRelation: "buy_ins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_records_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_payouts: {
        Row: {
          amount: number
          created_at: string
          dealer_id: string
          id: string
          organization_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          session_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          dealer_id: string
          id?: string
          organization_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          session_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          dealer_id?: string
          id?: string
          organization_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealer_payouts_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_payouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_payouts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_tips: {
        Row: {
          amount: number
          created_at: string
          dealer_id: string
          id: string
          notes: string | null
          organization_id: string | null
          session_id: string | null
          table_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          dealer_id: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          session_id?: string | null
          table_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          dealer_id?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          session_id?: string | null
          table_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealer_tips_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_tips_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_tips_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_tips_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      dealers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string | null
          total_tips: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id?: string | null
          total_tips?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string | null
          total_tips?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dealers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      payment_receipts: {
        Row: {
          amount: number
          created_at: string
          credit_record_id: string
          id: string
          organization_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          player_id: string
          session_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          credit_record_id: string
          id?: string
          organization_id?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          player_id: string
          session_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          credit_record_id?: string
          id?: string
          organization_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          player_id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_receipts_credit_record_id_fkey"
            columns: ["credit_record_id"]
            isOneToOne: false
            referencedRelation: "credit_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_receipts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_receipts_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_receipts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      player_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          organization_id: string | null
          player_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          organization_id?: string | null
          player_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          organization_id?: string | null
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_attachments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          cpf: string | null
          created_at: string
          credit_balance: number
          credit_limit: number
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          organization_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          credit_balance?: number
          credit_limit?: number
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          credit_balance?: number
          credit_limit?: number
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rake_entries: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          organization_id: string | null
          session_id: string | null
          table_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          session_id?: string | null
          table_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          session_id?: string | null
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rake_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rake_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rake_entries_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string | null
          session_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id?: string | null
          session_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string | null
          session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      payment_method:
        | "pix"
        | "cash"
        | "debit"
        | "credit"
        | "credit_fiado"
        | "bonus"
        | "fichas"
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
      app_role: ["admin", "user"],
      payment_method: [
        "pix",
        "cash",
        "debit",
        "credit",
        "credit_fiado",
        "bonus",
        "fichas",
      ],
    },
  },
} as const
