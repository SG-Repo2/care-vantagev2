import { User } from '@supabase/supabase-js';
import { supabase } from '../../../utils/supabase';
import { CreateProfileParams, ProfileService, UpdateProfileParams, UserProfile } from '../types/profile.types';
import { HealthMetrics } from '../../../health-metrics/types';

class ProfileServiceImpl implements ProfileService {
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
      const date = new Date().toISOString().split('T')[0];

      // Insert or update health metrics
      const { error: metricsError } = await supabase
        .from('health_metrics')
        .upsert([{
          user_id: userId,
          date,
          ...metrics,
          updated_at: timestamp
        }]);

      if (metricsError) {
        console.error('Error updating health metrics:', metricsError);
        throw metricsError;
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
}

export const profileService = new ProfileServiceImpl();
