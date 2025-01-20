import { User } from '@supabase/supabase-js';
import { supabase } from '../../../utils/supabase';
import { Platform } from 'react-native';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  photo_url: string | null;
  score: number;
  permissions_granted?: boolean;
  last_health_sync?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface HealthMetricsUpdate {
  date: string;
  steps: number;
  distance: number;
  calories: number;
  heart_rate: number;
  last_updated: string;
}

type UserIdInput = string | User | { id: string; email?: string };

class ProfileService {
  async validateSession(): Promise<User> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      throw new Error('No valid session found. Please sign in again.');
    }
    return session.user;
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear any cached data or state here
      await this.clearLocalState();
    } catch (err) {
      console.error('Error signing out:', err);
      throw err;
    }
  }

  private async clearLocalState(): Promise<void> {
    try {
      // Clear any local storage or state related to the profile
      // This is a placeholder - add any necessary cleanup
      console.log('Clearing local profile state');
    } catch (err) {
      console.error('Error clearing local state:', err);
    }
  }

  private async waitForAuthRecord(userId: string): Promise<void> {
    const maxAttempts = 5;
    const baseDelay = 1000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const { data, error } = await supabase.rpc('check_auth_user_exists', { user_id: userId });
        
        if (!error && data === true) {
          return;
        }
        
        console.log(`Waiting for auth record, attempt ${attempt + 1} of ${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
      } catch (err) {
        console.error(`Error checking auth record (attempt ${attempt + 1}):`, err);
        if (attempt === maxAttempts - 1) throw err;
      }
    }
    
    throw new Error('Auth record not found after maximum attempts');
  }

  private getUserId(input: UserIdInput): string {
    if (typeof input === 'string') return input;
    if ('id' in input) return input.id;
    throw new Error('Invalid user ID input');
  }

  async getProfile(userId: UserIdInput): Promise<UserProfile | null> {
    try {
      // Validate session first
      await this.validateSession();

      const id = this.getUserId(userId);
      if (!id) {
        throw new Error('Invalid user ID provided');
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error getting profile:', error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error in getProfile:', err);
      throw err;
    }
  }

  async createProfile(userId: UserIdInput, email?: string): Promise<UserProfile> {
    try {
      // First verify the session is valid
      const sessionUser = await this.validateSession();
      const id = this.getUserId(userId);

      if (!id) {
        throw new Error('Invalid user ID provided');
      }

      // Get email from input or session
      const userEmail = email || 
        (typeof userId === 'object' && 'email' in userId ? userId.email : undefined) || 
        sessionUser.email;
      
      if (!userEmail) {
        throw new Error('Email is required for profile creation');
      }

      // Wait for auth record to exist
      await this.waitForAuthRecord(id);

      const timestamp = new Date().toISOString();
      
      // Try to get existing profile first
      const existingProfile = await this.getProfile(id);
      if (existingProfile && !existingProfile.deleted_at) {
        return existingProfile;
      }

      // Prepare profile data
      const profileData = {
        id,
        email: userEmail,
        display_name: null,
        photo_url: null,
        score: 0,
        permissions_granted: false,
        created_at: timestamp,
        updated_at: timestamp
      };

      // Create profile
      const { data, error } = await supabase
        .from('users')
        .upsert([profileData])
        .select('*')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create profile: No data returned');

      return data;
    } catch (err) {
      console.error('Error in createProfile:', err);
      throw err;
    }
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateScore(userId: string, newScore: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        score: newScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  }

  async uploadProfilePhoto(userId: string, photoUri: string): Promise<string> {
    const photoPath = `public/profile_photos/${userId}`;
    const photoFile = await fetch(photoUri);
    const photoBlob = await photoFile.blob();

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(photoPath, photoBlob, {
        upsert: true,
        contentType: 'image/jpeg'
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(photoPath);

    await this.updateProfile(userId, { photo_url: publicUrl });
    return publicUrl;
  }

  async updateHealthMetrics(userId: string, metrics: HealthMetricsUpdate): Promise<void> {
    try {
      // First validate user exists
      const profile = await this.getProfile(userId);
      if (!profile) {
        throw new Error('Cannot update health metrics: User profile does not exist');
      }

      const timestamp = new Date().toISOString();

      // Use the upsert function with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const { error: upsertError } = await supabase
            .rpc('upsert_health_metrics', {
              p_date: metrics.date,
              p_user_id: userId,
              p_calories: metrics.calories || 0,
              p_daily_score: 0, // Calculate this server-side
              p_distance: metrics.distance || 0,
              p_heart_rate: metrics.heart_rate || 0,
              p_steps: metrics.steps || 0,
              p_device_id: Platform.OS,
              p_source: 'app'
            });

          if (upsertError) {
            if (retryCount < maxRetries - 1) {
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              continue;
            }
            throw upsertError;
          }

          // Update sync time on success
          await this.updateProfile(userId, {
            last_health_sync: timestamp
          });
          
          break;
        } catch (err) {
          if (retryCount === maxRetries - 1) {
            throw err;
          }
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    } catch (err) {
      console.error('Error in updateHealthMetrics:', err);
      throw err;
    }
  }
}

export const profileService = new ProfileService();
