export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      health_metrics: {
        Row: {
          id: string
          user_id: string
          metric_type: string
          value: number
          timestamp: string
          source: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['health_metrics']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['health_metrics']['Row']>
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string | null
          avatar_url: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_profiles']['Row']>
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type: string
          achieved_at: string
          metadata: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['achievements']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['achievements']['Row']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}