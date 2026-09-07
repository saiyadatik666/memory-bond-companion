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
      appointments: {
        Row: {
          created_at: string
          date: string
          id: string
          kind: string
          location: string | null
          notes: string | null
          time: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          kind?: string
          location?: string | null
          notes?: string | null
          time?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          kind?: string
          location?: string | null
          notes?: string | null
          time?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      caregiver_links: {
        Row: {
          caregiver_id: string
          created_at: string
          id: string
          senior_id: string
          status: string
        }
        Insert: {
          caregiver_id: string
          created_at?: string
          id?: string
          senior_id: string
          status?: string
        }
        Update: {
          caregiver_id?: string
          created_at?: string
          id?: string
          senior_id?: string
          status?: string
        }
        Relationships: []
      }
      daily_routines: {
        Row: {
          activity: string
          created_at: string
          done_date: string | null
          icon: string
          id: string
          time: string
          user_id: string
        }
        Insert: {
          activity: string
          created_at?: string
          done_date?: string | null
          icon?: string
          id?: string
          time?: string
          user_id: string
        }
        Update: {
          activity?: string
          created_at?: string
          done_date?: string | null
          icon?: string
          id?: string
          time?: string
          user_id?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_emergency: boolean
          name: string
          phone: string | null
          priority: number
          relationship: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_emergency?: boolean
          name: string
          phone?: string | null
          priority?: number
          relationship?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_emergency?: boolean
          name?: string
          phone?: string | null
          priority?: number
          relationship?: string | null
          user_id?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          created_at: string
          difficulty: string
          game_key: string
          id: string
          score: number
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty?: string
          game_key: string
          id?: string
          score?: number
          total?: number
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          game_key?: string
          id?: string
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      medicine_logs: {
        Row: {
          id: string
          medicine_id: string
          scheduled_time: string | null
          status: string
          taken_at: string
          user_id: string
        }
        Insert: {
          id?: string
          medicine_id: string
          scheduled_time?: string | null
          status?: string
          taken_at?: string
          user_id: string
        }
        Update: {
          id?: string
          medicine_id?: string
          scheduled_time?: string | null
          status?: string
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_logs_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_refills: {
        Row: {
          created_at: string
          id: string
          medicine_id: string
          note: string | null
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          medicine_id: string
          note?: string | null
          quantity: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          medicine_id?: string
          note?: string | null
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_refills_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          created_at: string
          daily_usage: number
          doctor: string | null
          dosage: string | null
          end_date: string | null
          frequency: string
          id: string
          instructions: string | null
          name: string
          notes: string | null
          refill_threshold: number
          start_date: string
          stock: number
          times: string[]
          unit: string
          updated_at: string
          user_id: string
          warn_days: number
        }
        Insert: {
          created_at?: string
          daily_usage?: number
          doctor?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          instructions?: string | null
          name: string
          notes?: string | null
          refill_threshold?: number
          start_date?: string
          stock?: number
          times?: string[]
          unit?: string
          updated_at?: string
          user_id: string
          warn_days?: number
        }
        Update: {
          created_at?: string
          daily_usage?: number
          doctor?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          instructions?: string | null
          name?: string
          notes?: string | null
          refill_threshold?: number
          start_date?: string
          stock?: number
          times?: string[]
          unit?: string
          updated_at?: string
          user_id?: string
          warn_days?: number
        }
        Relationships: []
      }
      memory_cues: {
        Row: {
          category: string
          created_at: string
          detail: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          detail?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          detail?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      memory_journal: {
        Row: {
          body: string | null
          created_at: string
          entry_date: string
          id: string
          kind: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          kind?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          kind?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          category: string
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          created_at: string
          font_size: string
          full_name: string
          high_contrast: boolean
          id: string
          language: string
          onboarded: boolean
          phone: string | null
          role: string
          updated_at: string
          voice_enabled: boolean
        }
        Insert: {
          age_range?: string | null
          created_at?: string
          font_size?: string
          full_name?: string
          high_contrast?: boolean
          id: string
          language?: string
          onboarded?: boolean
          phone?: string | null
          role?: string
          updated_at?: string
          voice_enabled?: boolean
        }
        Update: {
          age_range?: string | null
          created_at?: string
          font_size?: string
          full_name?: string
          high_contrast?: boolean
          id?: string
          language?: string
          onboarded?: boolean
          phone?: string | null
          role?: string
          updated_at?: string
          voice_enabled?: boolean
        }
        Relationships: []
      }
      reminder_logs: {
        Row: {
          id: string
          logged_at: string
          reminder_id: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          logged_at?: string
          reminder_id: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          logged_at?: string
          reminder_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          active: boolean
          created_at: string
          date: string | null
          id: string
          notes: string | null
          repeat: string
          time: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          date?: string | null
          id?: string
          notes?: string | null
          repeat?: string
          time?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          date?: string | null
          id?: string
          notes?: string | null
          repeat?: string
          time?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sos_events: {
        Row: {
          created_at: string
          demo: boolean
          id: string
          latitude: number | null
          location_status: string
          longitude: number | null
          notified: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          demo?: boolean
          id?: string
          latitude?: number | null
          location_status?: string
          longitude?: number | null
          notified?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          demo?: boolean
          id?: string
          latitude?: number | null
          location_status?: string
          longitude?: number | null
          notified?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access: { Args: { target_user: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
