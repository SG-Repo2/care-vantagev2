import { supabase } from '../../../utils/supabase';
import type { User } from '../../../core/auth/types/auth.types';
import type { HealthMetrics } from '../../../core/contexts/health/types';

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
}

export const mapUserToProfile = (user: User): Partial<UserProfile> => ({
  id: user.id,
  email: user.email || '',
  display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
  photo_url: user.user_metadata?.avatar_url || null,
  score: 0,
});

export const profileService = {
  async createProfile(user: User): Promise<UserProfile> {
    try {
      // First check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
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
        id: user.id, // Ensure this matches auth.uid()
        email: user.email || '',
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        photo_url: user.user_metadata?.avatar_url || null,
        device_info: {},
        permissions_granted: false
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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
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
      console.error('Error in getProfile:', error);
      throw error;
    }
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
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

  async updateScore(
    userId: string,
    metrics: {
      steps: number;
      distance: number;
      calories: number;
      heart_rate?: number;
    }
  ): Promise<UserProfile> {
    // Calculate health score based on metrics
    const score = this.calculateHealthScore(metrics);
    return this.updateProfile(userId, { score });
  },

  calculateHealthScore(metrics: {
    steps: number;
    distance: number;
    calories: number;
    heart_rate?: number;
  }): number {
    // Base score starts at 0
    let score = 0;

    // Steps contribution (up to 40 points)
    // 10000 steps is considered a good daily goal
    score += Math.min(40, (metrics.steps / 10000) * 40);

    // Distance contribution (up to 20 points)
    // 5 miles (8 km) is considered a good daily goal
    score += Math.min(20, (metrics.distance / 8000) * 20);

    // Calories contribution (up to 30 points)
    // 500 calories is considered a good daily burn goal
    score += Math.min(30, (metrics.calories / 500) * 30);

    // Heart rate contribution (up to 10 points)
    // Only if heart rate data is available
    if (metrics.heart_rate) {
      // Assuming a healthy heart rate range of 60-100 bpm
      const heartRateScore = metrics.heart_rate >= 60 && metrics.heart_rate <= 100 ? 10 : 5;
      score += heartRateScore;
    }

    // Round to nearest integer
    return Math.round(score);
  }
};
