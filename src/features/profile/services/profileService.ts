import { supabase } from '../../../utils/supabase';
import { User } from '../../../core/auth/types/auth.types';
import type { HealthMetrics } from '../../../core/contexts/health/types';

export type MeasurementSystem = 'metric' | 'imperial';
export type PrivacyLevel = 'private' | 'friends' | 'public';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  photo_url: string | null;
  settings: {
    measurementSystem: MeasurementSystem;
    notifications: boolean;
    privacyLevel: PrivacyLevel;
    dailyGoals: {
      steps: number;
      sleep: number;
      water: number;
    };
  };
  created_at?: string;
  updated_at?: string;
}

export const profileService = {
  async createProfile(user: User): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: user.id,
            email: user.email,
            display_name: user.displayName || user.email.split('@')[0],
            photo_url: user.photoURL || null,
            settings: {
              measurementSystem: 'metric',
              notifications: true,
              privacyLevel: 'private',
              dailyGoals: {
                steps: 10000,
                sleep: 480,
                water: 2000
              }
            }
          }
        ])
        .select()
        .single();

      if (error) {
        if (error.code === '42501') {
          throw new Error('Permission denied: Unable to create user profile. Please check database permissions.');
        } else if (error.code === '23505') {
          // If profile already exists, try to fetch it
          const { data: existingProfile, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (fetchError) throw fetchError;
          if (existingProfile) return existingProfile;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createProfile:', error);
      throw error;
    }
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      throw error;
    }

    return data;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    // Ensure we're not trying to update protected fields
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.email;
    delete safeUpdates.created_at;
    delete safeUpdates.updated_at;

    const { data, error } = await supabase
      .from('users')
      .update(safeUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    return data;
  },

  async updateProfilePhoto(userId: string, photoURL: string): Promise<UserProfile> {
    return this.updateProfile(userId, { photo_url: photoURL });
  },

  async updateHealthMetrics(
    userId: string, 
    date: string, 
    metrics: Pick<HealthMetrics, 'steps' | 'distance' | 'heartRate' | 'calories'>
  ): Promise<void> {
    const { error } = await supabase
      .from('health_metrics')
      .upsert({
        user_id: userId,
        date,
        ...metrics
      });

    if (error) {
      console.error('Error updating health metrics:', error);
      throw error;
    }
  }
};
