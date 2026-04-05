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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          created_at: string
          description: string | null
          end_time: string | null
          id: string
          start_time: string
          status: string
          student_id: string
          title: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          start_time: string
          status?: string
          student_id: string
          title: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          start_time?: string
          status?: string
          student_id?: string
          title?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          arm: number | null
          assessed_at: string
          body_fat: number | null
          chest: number | null
          created_at: string
          hips: number | null
          id: string
          notes: string | null
          student_id: string
          thigh: number | null
          trainer_id: string
          waist: number | null
          weight: number | null
        }
        Insert: {
          arm?: number | null
          assessed_at?: string
          body_fat?: number | null
          chest?: number | null
          created_at?: string
          hips?: number | null
          id?: string
          notes?: string | null
          student_id: string
          thigh?: number | null
          trainer_id: string
          waist?: number | null
          weight?: number | null
        }
        Update: {
          arm?: number | null
          assessed_at?: string
          body_fat?: number | null
          chest?: number | null
          created_at?: string
          hips?: number | null
          id?: string
          notes?: string | null
          student_id?: string
          thigh?: number | null
          trainer_id?: string
          waist?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          check_date: string
          created_at: string
          id: string
          notes: string | null
          student_id: string
          training_done: boolean
          user_id: string
          weight: number | null
        }
        Insert: {
          check_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          student_id: string
          training_done?: boolean
          user_id: string
          weight?: number | null
        }
        Update: {
          check_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          student_id?: string
          training_done?: boolean
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          reference_month: string
          status: string
          student_id: string
          trainer_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          reference_month: string
          status?: string
          student_id: string
          trainer_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          reference_month?: string
          status?: string
          student_id?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          category: string
          created_at: string
          id: string
          notes: string | null
          photo_url: string
          student_id: string
          taken_at: string
          uploaded_by: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          notes?: string | null
          photo_url: string
          student_id: string
          taken_at?: string
          uploaded_by: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          notes?: string | null
          photo_url?: string
          student_id?: string
          taken_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      protocols: {
        Row: {
          active: boolean
          content: string
          created_at: string
          id: string
          student_id: string
          title: string
          trainer_id: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          content: string
          created_at?: string
          id?: string
          student_id: string
          title: string
          trainer_id: string
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          content?: string
          created_at?: string
          id?: string
          student_id?: string
          title?: string
          trainer_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocols_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          age: number | null
          created_at: string
          email: string | null
          full_name: string
          goal: string | null
          health_history: string | null
          height: number | null
          id: string
          notes: string | null
          trainer_id: string
          updated_at: string
          user_id: string | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          created_at?: string
          email?: string | null
          full_name: string
          goal?: string | null
          health_history?: string | null
          height?: number | null
          id?: string
          notes?: string | null
          trainer_id: string
          updated_at?: string
          user_id?: string | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          created_at?: string
          email?: string | null
          full_name?: string
          goal?: string | null
          health_history?: string | null
          height?: number | null
          id?: string
          notes?: string | null
          trainer_id?: string
          updated_at?: string
          user_id?: string | null
          weight?: number | null
        }
        Relationships: []
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
    }
    Enums: {
      app_role: "admin" | "student"
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
      app_role: ["admin", "student"],
    },
  },
} as const
