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
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          photo_url: string | null
          score: number
          permissions_granted: boolean
          last_health_sync: string | null
          last_error: string | null
          created_at: string
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Row']>
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