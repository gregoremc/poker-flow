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
      buy_ins: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_bonus: boolean
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
          payment_method?: Database["public"]["Enums"]["payment_method"]
          player_id?: string
          session_id?: string | null
          table_id?: string
        }
        Relationships: [
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
      cash_outs: {
        Row: {
          chip_value: number
          created_at: string
          id: string
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
          payment_method?: Database["public"]["Enums"]["payment_method"]
          player_id?: string
          profit?: number
          session_id?: string | null
          table_id?: string
          total_buy_in?: number
        }
        Relationships: [
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
          responsible?: string | null
          session_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      chip_types: {
        Row: {
          color: string
          created_at: string
          id: string
          sort_order: number
          value: number
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          sort_order?: number
          value: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          sort_order?: number
          value?: number
        }
        Relationships: []
      }
      club_settings: {
        Row: {
          club_name: string
          created_at: string
          credit_limit_per_player: number
          id: string
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          club_name?: string
          created_at?: string
          credit_limit_per_player?: number
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          club_name?: string
          created_at?: string
          credit_limit_per_player?: number
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      credit_records: {
        Row: {
          amount: number
          buy_in_id: string | null
          created_at: string
          id: string
          is_paid: boolean
          notes: string | null
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
          payment_method: Database["public"]["Enums"]["payment_method"]
          session_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          dealer_id: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          session_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          dealer_id?: string
          id?: string
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
          session_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          dealer_id: string
          id?: string
          notes?: string | null
          session_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          dealer_id?: string
          id?: string
          notes?: string | null
          session_id?: string | null
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
            foreignKeyName: "dealer_tips_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
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
          total_tips: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          total_tips?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          total_tips?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_receipts: {
        Row: {
          amount: number
          created_at: string
          credit_record_id: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          player_id: string
          session_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          credit_record_id: string
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          player_id: string
          session_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          credit_record_id?: string
          id?: string
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
      players: {
        Row: {
          created_at: string
          credit_balance: number
          credit_limit: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credit_balance?: number
          credit_limit?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credit_balance?: number
          credit_limit?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      rake_entries: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          session_id: string | null
          table_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          session_id?: string | null
          table_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          session_id?: string | null
          table_id?: string
        }
        Relationships: [
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
          session_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          session_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      payment_method:
        | "pix"
        | "cash"
        | "debit"
        | "credit"
        | "credit_fiado"
        | "bonus"
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
      payment_method: [
        "pix",
        "cash",
        "debit",
        "credit",
        "credit_fiado",
        "bonus",
      ],
    },
  },
} as const
