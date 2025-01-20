import { User } from '@supabase/supabase-js';
import { HealthMetrics } from '../../../health-metrics/types';

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  permissions_granted: boolean;
  last_health_sync?: string;
  last_error?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateProfileParams {
  id: string;
  email: string;
  display_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateProfileParams extends Partial<UserProfile> {
  permissions_granted?: boolean;
}

export interface ProfileService {
  createProfile(user: User): Promise<UserProfile>;
  getProfile(userId: string): Promise<UserProfile | null>;
  updateProfile(userId: string, params: UpdateProfileParams): Promise<UserProfile>;
  validateUserAccess(userId: string): Promise<void>;
  updateHealthMetrics(userId: string, metrics: Partial<HealthMetrics>): Promise<void>;
}