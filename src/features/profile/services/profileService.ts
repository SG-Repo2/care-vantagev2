import { supabase } from '../../../utils/supabase';
import { Profile } from '../types/profile';
import { User } from '../../auth/types/auth';
import { MeasurementSystem, PrivacyLevel } from '../../../core/types/base';

export interface HealthMetrics {
  steps: number;
  distance: number;
  heartrate: number;
  calories: number;
}

function calculateHealthScore(metrics: HealthMetrics): number {
  // Base weights for each metric
  const weights = {
    steps: 0.4,      // 40% weight for steps
    distance: 0.2,   // 20% weight for distance
    heartrate: 0.2,  // 20% weight for heart rate
    calories: 0.2    // 20% weight for calories
  };

  // Normalize metrics to a 0-100 scale
  const normalizedSteps = Math.min(metrics.steps / 10000 * 100, 100); // 10000 steps as target
  const normalizedDistance = Math.min(metrics.distance / 8 * 100, 100); // 8km as target
  const normalizedHeartrate = calculateHeartrateScore(metrics.heartrate);
  const normalizedCalories = Math.min(metrics.calories / 500 * 100, 100); // 500 calories as target

  // Calculate weighted score
  const score = Math.round(
    normalizedSteps * weights.steps +
    normalizedDistance * weights.distance +
    normalizedHeartrate * weights.heartrate +
    normalizedCalories * weights.calories
  );

  return Math.min(Math.max(score, 0), 100); // Ensure score is between 0 and 100
}

function calculateHeartrateScore(heartrate: number): number {
  // Optimal heart rate zones (simplified)
  if (heartrate >= 60 && heartrate <= 100) {
    return 100; // Perfect resting heart rate
  } else if (heartrate < 60) {
    return Math.max(60, heartrate) / 60 * 100; // Score for low heart rate
  } else {
    return Math.max(0, (180 - heartrate) / 80 * 100); // Score decreases as heart rate increases above 100
  }
}

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
  },

  async updateHealthMetrics(userId: string, date: string, metrics: HealthMetrics): Promise<void> {
    const { error } = await supabase
      .from('health_metrics')
      .upsert({
        user_id: userId,
        date,
        steps: metrics.steps,
        distance: metrics.distance,
        heartrate: metrics.heartrate,
        calories: metrics.calories,
        score: calculateHealthScore(metrics)
      });

    if (error) {
      console.error('Error updating health metrics:', error);
      throw error;
    }
  },

  async getHealthMetrics(userId: string, date: string): Promise<HealthMetrics | null> {
    const { data, error } = await supabase
      .from('health_metrics')
      .select('steps, distance, heartrate, calories')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching health metrics:', error);
      throw error;
    }

    return data;
  },

  async getDailyHealthMetrics(userId: string, startDate: string, endDate: string): Promise<HealthMetrics[]> {
    const { data, error } = await supabase
      .from('health_metrics')
      .select('steps, distance, heartrate, calories, date')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching daily health metrics:', error);
      throw error;
    }

    return data || [];
  }
};
