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
  created_at?: string;
  updated_at?: string;
}

export const mapUserToProfile = (user: User): Partial<UserProfile> => ({
  id: user.id,
  email: user.email || '',
  display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
  photo_url: user.user_metadata?.avatar_url || null,
});

export interface HealthMetricsEntry {
  id: string;
  user_id: string;
  date: string;
  steps: number;
  distance: number;
  calories: number;
  heart_rate: number | null;
  daily_score: number;
  weekly_score: number;
  monthly_score: number;
  streak_days: number;
  created_at?: string;
  updated_at?: string;
}

export const profileService = {
  async createProfile(user: User): Promise<UserProfile> {
    try {
      const profileData = {
        ...mapUserToProfile(user),
        device_info: {},
        permissions_granted: false
      };

      const { data, error } = await supabase
        .from('users')
        .insert([profileData])
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
    metrics: {
      date: string;
      steps: number;
      distance: number;
      heart_rate?: number;
      calories: number;
    }
  ): Promise<HealthMetricsEntry> {
    const { data, error } = await supabase
      .from('health_metrics')
      .upsert({
        user_id: userId,
        ...metrics,
        // The database will calculate the scores using the calculate_health_score function
        daily_score: 0, // This will be updated by the database trigger
        weekly_score: 0,
        monthly_score: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating health metrics:', error);
      throw error;
    }

    return data;
  },

  async getHealthMetrics(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<HealthMetricsEntry[]> {
    const { data, error } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching health metrics:', error);
      throw error;
    }

    return data || [];
  },

  async getLeaderboardRankings(
    periodType: 'daily' | 'weekly' | 'monthly',
    date: string
  ): Promise<any[]> {
    const { data, error } = await supabase
      .from('leaderboard_rankings')
      .select(`
        *,
        users:user_id (
          display_name,
          photo_url
        )
      `)
      .eq('period_type', periodType)
      .lte('start_date', date)
      .gte('end_date', date)
      .order('rank', { ascending: true });

    if (error) {
      console.error('Error fetching leaderboard rankings:', error);
      throw error;
    }

    return data || [];
  }
};
