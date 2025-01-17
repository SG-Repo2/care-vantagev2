import { supabase } from '@utils/supabase';
import type { UserId } from '../../../health-metrics/types';
import { userValidationService, UserValidationError } from '../../../health-metrics/services/UserValidationService';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  photo_url: string | null;
  device_info: Record<string, any>;
  permissions_granted: boolean;
  score: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export const mapUserToProfile = (user: User): Partial<UserProfile> => ({
  id: user.id,
  email: user.email || '',
  display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
  photo_url: user.user_metadata?.avatar_url || null,
  score: 0,
});

export const profileService = {
  async validateUserAccess(userId: string): Promise<void> {
    const { isValid, error } = await userValidationService.validateUser(userId as UserId);
    if (!isValid) {
      throw error || new UserValidationError('Invalid user access');
    }
  },

  async createProfile(user: User): Promise<UserProfile> {
    try {
      // First check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .is('deleted_at', null)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing profile:', fetchError);
        throw fetchError;
      }

      if (existingProfile) {
        console.log('Found existing profile:', existingProfile);
        return existingProfile;
      }

      // Create new profile if it doesn't exist
      const profileData = {
        id: user.id,
        email: user.email || '',
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        photo_url: user.user_metadata?.avatar_url || null,
        device_info: {},
        permissions_granted: false,
        deleted_at: null
      };

      const { data, error } = await supabase
        .from('users')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw new Error(`Failed to create profile: ${error.message}`);
      }

      if (!data) {
        throw new Error('No profile data returned after creation');
      }

      console.log('Created new profile:', data);
      return data;
    } catch (error) {
      console.error('Error in createProfile:', error);
      throw error;
    }
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      await this.validateUserAccess(userId);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Profile not found for user:', userId);
          return null;
        }
        console.error('Error fetching profile:', error);
        throw error;
      }

      return data;
    } catch (error) {
      if (error instanceof UserValidationError) {
        throw error;
      }
      console.error('Error in getProfile:', error);
      throw error;
    }
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    await this.validateUserAccess(userId);

    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.email;
    delete safeUpdates.created_at;
    delete safeUpdates.updated_at;
    delete safeUpdates.deleted_at;

    const { data, error } = await supabase
      .from('users')
      .update(safeUpdates)
      .eq('id', userId)
      .is('deleted_at', null)
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

  async updateScore(
    userId: string,
    metrics: {
      steps: number;
      distance: number;
      calories: number;
      heart_rate?: number;
    }
  ): Promise<UserProfile> {
    await this.validateUserAccess(userId);
    const score = this.calculateHealthScore(metrics);
    return this.updateProfile(userId, { score });
  },

  async deleteAccount(userId: string): Promise<void> {
    await this.validateUserAccess(userId);

    const { error } = await supabase
      .rpc('soft_delete_user', { user_id: userId });

    if (error) {
      console.error('Error deleting account:', error);
      throw error;
    }

    // Clear validation cache for this user
    userValidationService.clearCache(userId);
  },

  calculateHealthScore(metrics: {
    steps: number;
    distance: number;
    calories: number;
    heart_rate?: number;
  }): number {
    let score = 0;

    // Steps contribution (up to 40 points)
    score += Math.min(40, (metrics.steps / 10000) * 40);

    // Distance contribution (up to 20 points)
    score += Math.min(20, (metrics.distance / 8000) * 20);

    // Calories contribution (up to 30 points)
    score += Math.min(30, (metrics.calories / 500) * 30);

    // Heart rate contribution (up to 10 points)
    if (metrics.heart_rate) {
      const heartRateScore = metrics.heart_rate >= 60 && metrics.heart_rate <= 100 ? 10 : 5;
      score += heartRateScore;
    }

    return Math.round(score);
  }
};
