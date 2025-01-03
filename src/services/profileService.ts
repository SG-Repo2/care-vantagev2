import { supabase } from '../utils/supabase';
import { Profile } from '../features/profile/types/profile';
import { User } from '../features/auth/types/auth';
import { MeasurementSystem, PrivacyLevel } from '../core/types/base';

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
      console.error('Error creating profile:', error);
      throw error;
    }

    return data;
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
  }
};
