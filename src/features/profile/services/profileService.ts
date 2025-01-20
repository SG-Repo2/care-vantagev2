import { User } from '@supabase/supabase-js';
import { supabase } from '../../../utils/supabase';
import { CreateProfileParams, UpdateProfileParams, UserProfile } from '../types/profile.types';
import { HealthMetrics } from '../../../health-metrics/types';
import { DateUtils } from '../../../utils/DateUtils';
import { Platform } from 'react-native';
import { PrivacyLevel } from '../../../core/types/base';

export interface UpdatePrivacyParams {
  privacy_level: PrivacyLevel;
}

export interface IProfileService {
  createProfile(user: User): Promise<UserProfile>;
  getProfile(userId: string): Promise<UserProfile | null>;
  updateProfile(userId: string, params: UpdateProfileParams): Promise<UserProfile>;
  validateUserAccess(userId: string): Promise<void>;
  updateHealthMetrics(userId: string, metrics: Partial<HealthMetrics>): Promise<void>;
  updatePrivacy(userId: string, privacy: PrivacyLevel): Promise<void>;
  getPrivacyLevel(userId: string): Promise<PrivacyLevel>;
}

class ProfileServiceImpl implements IProfileService {
  async createProfile(user: User): Promise<UserProfile> {
    try {
      // First verify the session is valid
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No valid session found. Please sign in again.');
      }

      const timestamp = new Date().toISOString();
      
      // Try to get existing profile first
      const { data: existingProfile, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (selectError) {
        console.error('Error checking existing profile:', selectError);
        throw selectError;
      }

      // If profile exists and is not deleted, return it
      if (existingProfile && !existingProfile.deleted_at) {
        return existingProfile;
      }

      // Prepare profile data
      const profileData: CreateProfileParams = {
        id: user.id,
        email: user.email || '',
        display_name: user.user_metadata?.full_name,
        permissions_granted: false,
        privacy_level: 'public', // Set default to public
        created_at: timestamp,
        updated_at: timestamp
      };

      // Try to create profile with retries
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase
            .from('users')
            .upsert([profileData])
            .select('*')
            .single();

          if (error) {
            if (error.code === '42501' && retryCount < maxRetries - 1) {
              console.log(`Retry attempt ${retryCount + 1} for profile creation`);
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
              continue;
            }
            throw error;
          }

          if (!data) {
            throw new Error('Failed to create profile: No data returned');
          }

          return data;
        } catch (err) {
          if (retryCount === maxRetries - 1) {
            throw err;
          }
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        }
      }

      throw new Error('Failed to create profile after maximum retry attempts');
    } catch (err) {
      console.error('Error in createProfile:', err);
      throw err;
    }
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error getting profile:', error);
      throw error;
    }

    return data;
  }

  async updateProfile(userId: string, params: UpdateProfileParams): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...params,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    return data;
  }

  async validateUserAccess(userId: string): Promise<void> {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error validating user access:', error);
        throw new Error('Failed to validate user access');
      }

      if (!profile) {
        // Try to get the auth user to auto-create profile if needed
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Auth error during validation:', authError);
          throw new Error('Authentication required');
        }

        if (user && user.id === userId) {
          // Auto-create profile for valid auth user
          await this.createProfile(user);
          return;
        }

        throw new Error('Profile not found');
      }

      if (profile.deleted_at) {
        throw new Error('Profile has been deleted');
      }

      // Validate permissions if needed
      if (!profile.permissions_granted) {
        console.warn('User permissions not granted:', userId);
      }
    } catch (err) {
      console.error('User validation error:', err);
      throw err;
    }
  }

  async updateHealthMetrics(userId: string, metrics: Partial<HealthMetrics>): Promise<void> {
    try {
      // First validate user access
      await this.validateUserAccess(userId);

      const timestamp = new Date().toISOString();
      const date = DateUtils.getLocalDateString();

      // Use the updated upsert function with parameters in the correct order
      const { data: result, error: upsertError } = await supabase
        .rpc('upsert_health_metrics', {
          p_date: date,                    // Required parameter first
          p_user_id: userId,               // Required parameter second
          p_calories: metrics.calories || 0,
          p_daily_score: metrics.daily_score || 0,
          p_distance: metrics.distance || 0,
          p_heart_rate: metrics.heart_rate || 0,
          p_steps: metrics.steps || 0,
          p_device_id: Platform.OS,        // Optional: use platform as device_id
          p_source: 'app'                  // Optional: default source
        });

      if (upsertError) {
        console.error('Error upserting health metrics:', upsertError);
        throw upsertError;
      }

      // Update sync time on success
      const { error: syncError } = await supabase
        .from('users')
        .update({
          last_health_sync: timestamp,
          updated_at: timestamp
        })
        .eq('id', userId);

      if (syncError) {
        console.warn('Failed to update sync timestamp:', syncError);
      }
    } catch (err) {
      console.error('Error in updateHealthMetrics:', err);
      throw err;
    }
  }

  async updatePrivacy(userId: string, privacy: PrivacyLevel): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          privacy_level: privacy,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update privacy:', err);
      throw err;
    }
  }

  async getPrivacyLevel(userId: string): Promise<PrivacyLevel> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('privacy_level')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.privacy_level || 'private';
    } catch (err) {
      console.error('Failed to get privacy level:', err);
      throw err;
    }
  }
}

export const profileService = new ProfileServiceImpl();
