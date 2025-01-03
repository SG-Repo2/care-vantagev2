import { supabase } from '../utils/supabase';
import { Profile } from '../features/profile/types/profile';
import { User } from '../features/auth/types/auth';
import { MeasurementSystem, PrivacyLevel } from '../core/types/base';

export const profileService = {
  async createProfile(user: User) {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: user.id,
          email: user.email,
          display_name: user.displayName || '',
          photo_url: '',
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

  async getProfile(userId: string) {
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

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    return data;
  }
};
