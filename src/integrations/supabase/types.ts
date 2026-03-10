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
      activities: {
        Row: {
          description: string
          entity_id: string
          entity_type: string
          id: string
          timestamp: string
          type: string
          user: string
        }
        Insert: {
          description?: string
          entity_id?: string
          entity_type?: string
          id?: string
          timestamp?: string
          type?: string
          user?: string
        }
        Update: {
          description?: string
          entity_id?: string
          entity_type?: string
          id?: string
          timestamp?: string
          type?: string
          user?: string
        }
        Relationships: []
      }
      carrier_documents: {
        Row: {
          carrier_id: string
          created_at: string
          document_data: Json
          id: string
          load_id: string
          signed_at: string | null
          signed_by_name: string
          status: string
          type: string
        }
        Insert: {
          carrier_id: string
          created_at?: string
          document_data?: Json
          id?: string
          load_id: string
          signed_at?: string | null
          signed_by_name?: string
          status?: string
          type?: string
        }
        Update: {
          carrier_id?: string
          created_at?: string
          document_data?: Json
          id?: string
          load_id?: string
          signed_at?: string | null
          signed_by_name?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "carrier_documents_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_documents_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_portal_users: {
        Row: {
          carrier_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          carrier_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          carrier_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carrier_portal_users_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      carriers: {
        Row: {
          address: string
          carrier_packet_uploaded: boolean
          city: string
          company_name: string
          created_at: string
          dot_number: string
          email: string
          equipment_types: string[]
          factoring_company: string
          factoring_remit_to: string
          id: string
          insurance_cert_uploaded: boolean
          insurance_expiry: string
          insurance_provider: string
          mc_number: string
          notes: string
          packet_status: string
          phone: string
          state: string
          w9_uploaded: boolean
          zip: string
        }
        Insert: {
          address?: string
          carrier_packet_uploaded?: boolean
          city?: string
          company_name: string
          created_at?: string
          dot_number?: string
          email?: string
          equipment_types?: string[]
          factoring_company?: string
          factoring_remit_to?: string
          id?: string
          insurance_cert_uploaded?: boolean
          insurance_expiry?: string
          insurance_provider?: string
          mc_number?: string
          notes?: string
          packet_status?: string
          phone?: string
          state?: string
          w9_uploaded?: boolean
          zip?: string
        }
        Update: {
          address?: string
          carrier_packet_uploaded?: boolean
          city?: string
          company_name?: string
          created_at?: string
          dot_number?: string
          email?: string
          equipment_types?: string[]
          factoring_company?: string
          factoring_remit_to?: string
          id?: string
          insurance_cert_uploaded?: boolean
          insurance_expiry?: string
          insurance_provider?: string
          mc_number?: string
          notes?: string
          packet_status?: string
          phone?: string
          state?: string
          w9_uploaded?: boolean
          zip?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          email: string
          first_name: string
          id: string
          is_primary: boolean
          last_name: string
          phone: string
          shipper_id: string
          title: string
        }
        Insert: {
          email?: string
          first_name?: string
          id?: string
          is_primary?: boolean
          last_name?: string
          phone?: string
          shipper_id: string
          title?: string
        }
        Update: {
          email?: string
          first_name?: string
          id?: string
          is_primary?: boolean
          last_name?: string
          phone?: string
          shipper_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_shipper_id_fkey"
            columns: ["shipper_id"]
            isOneToOne: false
            referencedRelation: "shippers"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          expires_at: string
          id: string
          load_id: string | null
          signed_at: string
          signed_by_name: string
          status: string
          terms: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          expires_at?: string
          id?: string
          load_id?: string | null
          signed_at?: string
          signed_by_name?: string
          status?: string
          terms?: string
          title?: string
          type?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          expires_at?: string
          id?: string
          load_id?: string | null
          signed_at?: string
          signed_by_name?: string
          status?: string
          terms?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          name: string
          subject: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          completed: boolean
          date: string
          id: string
          notes: string
          shipper_id: string
        }
        Insert: {
          completed?: boolean
          date?: string
          id?: string
          notes?: string
          shipper_id: string
        }
        Update: {
          completed?: boolean
          date?: string
          id?: string
          notes?: string
          shipper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_shipper_id_fkey"
            columns: ["shipper_id"]
            isOneToOne: false
            referencedRelation: "shippers"
            referencedColumns: ["id"]
          },
        ]
      }
      lanes: {
        Row: {
          destination: string
          equipment_type: string
          id: string
          notes: string
          origin: string
          rate: number
          shipper_id: string
        }
        Insert: {
          destination?: string
          equipment_type?: string
          id?: string
          notes?: string
          origin?: string
          rate?: number
          shipper_id: string
        }
        Update: {
          destination?: string
          equipment_type?: string
          id?: string
          notes?: string
          origin?: string
          rate?: number
          shipper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lanes_shipper_id_fkey"
            columns: ["shipper_id"]
            isOneToOne: false
            referencedRelation: "shippers"
            referencedColumns: ["id"]
          },
        ]
      }
      loads: {
        Row: {
          carrier_id: string | null
          carrier_rate: number
          created_at: string
          delivery_date: string
          destination: string
          equipment_type: string
          id: string
          invoice_amount: number
          invoice_date: string
          invoice_number: string
          load_number: string
          notes: string
          origin: string
          payment_status: string
          pickup_date: string
          pod_uploaded: boolean
          reference_number: string
          shipper_id: string
          shipper_rate: number
          status: string
          weight: number
        }
        Insert: {
          carrier_id?: string | null
          carrier_rate?: number
          created_at?: string
          delivery_date?: string
          destination?: string
          equipment_type?: string
          id?: string
          invoice_amount?: number
          invoice_date?: string
          invoice_number?: string
          load_number?: string
          notes?: string
          origin?: string
          payment_status?: string
          pickup_date?: string
          pod_uploaded?: boolean
          reference_number?: string
          shipper_id: string
          shipper_rate?: number
          status?: string
          weight?: number
        }
        Update: {
          carrier_id?: string | null
          carrier_rate?: number
          created_at?: string
          delivery_date?: string
          destination?: string
          equipment_type?: string
          id?: string
          invoice_amount?: number
          invoice_date?: string
          invoice_number?: string
          load_number?: string
          notes?: string
          origin?: string
          payment_status?: string
          pickup_date?: string
          pod_uploaded?: boolean
          reference_number?: string
          shipper_id?: string
          shipper_rate?: number
          status?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "loads_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loads_shipper_id_fkey"
            columns: ["shipper_id"]
            isOneToOne: false
            referencedRelation: "shippers"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_calls: {
        Row: {
          assigned_sales_rep: string
          call_attempt_number: number
          call_date: string
          call_outcome: string
          contact_name: string
          contact_title: string
          created_at: string
          direct_phone: string
          email: string
          id: string
          next_follow_up_date: string
          next_step: string
          notes: string
          pain_point: string
          shipper_id: string
        }
        Insert: {
          assigned_sales_rep?: string
          call_attempt_number?: number
          call_date?: string
          call_outcome?: string
          contact_name?: string
          contact_title?: string
          created_at?: string
          direct_phone?: string
          email?: string
          id?: string
          next_follow_up_date?: string
          next_step?: string
          notes?: string
          pain_point?: string
          shipper_id: string
        }
        Update: {
          assigned_sales_rep?: string
          call_attempt_number?: number
          call_date?: string
          call_outcome?: string
          contact_name?: string
          contact_title?: string
          created_at?: string
          direct_phone?: string
          email?: string
          id?: string
          next_follow_up_date?: string
          next_step?: string
          notes?: string
          pain_point?: string
          shipper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_calls_shipper_id_fkey"
            columns: ["shipper_id"]
            isOneToOne: false
            referencedRelation: "shippers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_tasks: {
        Row: {
          cadence_day: number | null
          completed: boolean
          completed_at: string
          created_at: string
          description: string
          due_date: string
          id: string
          shipper_id: string
          template_id: string | null
          title: string
          type: string
        }
        Insert: {
          cadence_day?: number | null
          completed?: boolean
          completed_at?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          shipper_id: string
          template_id?: string | null
          title?: string
          type?: string
        }
        Update: {
          cadence_day?: number | null
          completed?: boolean
          completed_at?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          shipper_id?: string
          template_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_tasks_shipper_id_fkey"
            columns: ["shipper_id"]
            isOneToOne: false
            referencedRelation: "shippers"
            referencedColumns: ["id"]
          },
        ]
      }
      shippers: {
        Row: {
          address: string
          city: string
          company_name: string
          created_at: string
          credit_limit: number
          direct_phone: string | null
          email: string
          estimated_monthly_loads: number | null
          id: string
          last_contact_date: string | null
          next_follow_up: string | null
          notes: string
          payment_terms: string
          phone: string
          sales_stage: string
          shipping_manager_name: string | null
          state: string
          zip: string
        }
        Insert: {
          address?: string
          city?: string
          company_name: string
          created_at?: string
          credit_limit?: number
          direct_phone?: string | null
          email?: string
          estimated_monthly_loads?: number | null
          id?: string
          last_contact_date?: string | null
          next_follow_up?: string | null
          notes?: string
          payment_terms?: string
          phone?: string
          sales_stage?: string
          shipping_manager_name?: string | null
          state?: string
          zip?: string
        }
        Update: {
          address?: string
          city?: string
          company_name?: string
          created_at?: string
          credit_limit?: number
          direct_phone?: string | null
          email?: string
          estimated_monthly_loads?: number | null
          id?: string
          last_contact_date?: string | null
          next_follow_up?: string | null
          notes?: string
          payment_terms?: string
          phone?: string
          sales_stage?: string
          shipping_manager_name?: string | null
          state?: string
          zip?: string
        }
        Relationships: []
      }
      stage_change_logs: {
        Row: {
          changed_at: string
          changed_by: string
          from_stage: string
          id: string
          shipper_id: string
          to_stage: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string
          from_stage?: string
          id?: string
          shipper_id: string
          to_stage?: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          from_stage?: string
          id?: string
          shipper_id?: string
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_change_logs_shipper_id_fkey"
            columns: ["shipper_id"]
            isOneToOne: false
            referencedRelation: "shippers"
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_carrier_portal_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
