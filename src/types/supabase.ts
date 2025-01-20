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
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          photo_url: string | null
          device_info: Json | null
          permissions_granted: boolean
          last_error: string | null
          last_health_sync: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          score: number | null
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Row']>
      }
      health_metrics: {
        Row: {
          id: string
          user_id: string
          date: string
          steps: number | null
          distance: number | null
          calories: number | null
          heart_rate: number | null
          daily_score: number | null
          weekly_score: number | null
          streak_days: number | null
          last_updated: string | null
          created_at: string
          updated_at: string
          version: number
        }
        Insert: Omit<Database['public']['Tables']['health_metrics']['Row'], 'id' | 'created_at' | 'updated_at' | 'version'>
        Update: Partial<Database['public']['Tables']['health_metrics']['Row']>
      }
      health_metrics_history: {
        Row: {
          id: string
          metric_id: string
          user_id: string
          date: string
          steps: number | null
          distance: number | null
          calories: number | null
          heart_rate: number | null
          daily_score: number | null
          weekly_score: number | null
          streak_days: number | null
          version: number
          changed_at: string
          change_type: string
          changed_by: string
          device_id: string | null
          source: string | null
        }
        Insert: Omit<Database['public']['Tables']['health_metrics_history']['Row'], 'id' | 'changed_at'>
        Update: Partial<Database['public']['Tables']['health_metrics_history']['Row']>
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type: string
          achieved_at: string
          metadata: Json | null
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
      upsert_health_metrics: {
        Args: {
          p_date: string
          p_user_id: string
          p_calories?: number
          p_daily_score?: number
          p_distance?: number
          p_heart_rate?: number
          p_steps?: number
          p_device_id?: string
          p_source?: string
        }
        Returns: Database['public']['Tables']['health_metrics']['Row']
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}