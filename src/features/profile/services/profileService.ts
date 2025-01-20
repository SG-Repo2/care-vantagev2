import { User } from '@supabase/supabase-js';
import { supabase } from '../../../utils/supabase';
import { CreateProfileParams, ProfileService, UpdateProfileParams, UserProfile } from '../types/profile.types';
import { HealthMetrics } from '../../../health-metrics/types';

class ProfileServiceImpl implements ProfileService {
  async createProfile(user: User): Promise<UserProfile> {
    try {
      const timestamp = new Date().toISOString();
      const profileData: CreateProfileParams = {
        id: user.id,
        email: user.email || '',
        display_name: user.user_metadata?.full_name,
        created_at: timestamp,
        updated_at: timestamp
      };

      // Try to get existing profile first
      const { data: existingProfile, error: selectError } = await supabase
        .from('users')
        .select()
        .eq('id', user.id)
        .maybeSingle();

      if (selectError) {
        console.error('Error checking existing profile:', selectError);
        throw selectError;
      }

      // If profile exists, return it
      if (existingProfile) {
        return existingProfile;
      }

      // Create new profile with proper auth context
      const { data, error } = await supabase
        .from('users')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        if (error.code === '42501') {
          throw new Error('Permission denied: Unable to create profile. Please ensure you are authenticated.');
        }
        console.error('Error creating profile:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Failed to create profile: No data returned');
      }

      return data;
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
    const profile = await this.getProfile(userId);
    
    if (!profile) {
      throw new Error('Profile not found');
    }

    if (profile.deleted_at) {
      throw new Error('Profile has been deleted');
    }
  }

  async updateHealthMetrics(userId: string, metrics: Partial<HealthMetrics>): Promise<void> {
    try {
      // First validate user access
      await this.validateUserAccess(userId);

      const timestamp = new Date().toISOString();

      // Insert or update health metrics
      const { error: metricsError } = await supabase
        .from('health_metrics')
        .upsert([{
          user_id: userId,
          ...metrics,
          updated_at: timestamp
        }]);

      if (metricsError) {
        // Update user profile with error, using null instead of undefined
        await this.updateProfile(userId, {
          last_error: metricsError.message || 'Unknown error updating health metrics',
          last_health_sync: timestamp
        });
        throw metricsError;
      }

      // Update last sync time on success, using null instead of undefined
      await this.updateProfile(userId, {
        last_error: null,
        last_health_sync: timestamp
      });
    } catch (err) {
      console.error('Error in updateHealthMetrics:', err);
      // Ensure we always update the error state
      await this.updateProfile(userId, {
        last_error: err instanceof Error ? err.message : 'Unknown error in health metrics update',
        last_health_sync: new Date().toISOString()
      }).catch(updateErr => {
        console.error('Failed to update error state:', updateErr);
      });
      throw err;
    }
  }
}

export const profileService = new ProfileServiceImpl();
