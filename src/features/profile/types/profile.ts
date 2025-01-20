import type { Database } from '../../../types/supabase';

// Export types from the database schema
export type UserProfile = Database['public']['Tables']['users']['Row'];
export type UserProfileUpdate = {
  email?: string;
  display_name?: string | null;
  photo_url?: string | null;
  score?: number;
  permissions_granted?: boolean;
  last_health_sync?: string | null;
  last_error?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

// Health metrics update interface
export interface HealthMetricsUpdate {
  date: string;
  steps: number;
  distance: number;
  calories: number;
  heart_rate: number;
  last_updated: string;
}

// Service types
export type UserIdInput = string | { id: string; email?: string };

export interface ProfileServiceError extends Error {
  code?: string;
  details?: unknown;
}
