import { supabase } from '../utils/supabase';

interface HealthMetricsData {
  user_id: string;
  date: string;
  steps: number;
  distance: number;
  score?: number; // Optional since we'll calculate it
}

interface UserProfile {
  id: string;
  display_name: string;
  photo_url: string;
  settings: {
    privacyLevel: string;
    measurementSystem: string;
  };
}

interface LeaderboardEntry {
  user_id: string;
  steps: number;
  distance: number;
  score: number;
  users: UserProfile[];
}

interface FormattedLeaderboardEntry {
  user_id: string;
  steps: number;
  distance: number;
  score: number;
  user: UserProfile;
}

class HealthMetricsService {
  private static instance: HealthMetricsService;

  private constructor() {}

  public static getInstance(): HealthMetricsService {
    if (!HealthMetricsService.instance) {
      HealthMetricsService.instance = new HealthMetricsService();
    }
    return HealthMetricsService.instance;
  }

  private calculateScore(steps: number, distance: number): number {
    // Base score calculation:
    // - Steps: 50% weight (10,000 steps = 50 points)
    // - Distance: 50% weight (5km = 50 points)
    const stepScore = Math.min(50, (steps / 10000) * 50);
    const distanceScore = Math.min(50, (distance / 5) * 50);
    
    // Round to nearest integer
    return Math.round(stepScore + distanceScore);
  }

  public async saveMetrics(metrics: HealthMetricsData): Promise<void> {
    const score = this.calculateScore(metrics.steps, metrics.distance);

    const { error } = await supabase
      .from('health_metrics')
      .upsert([{
        ...metrics,
        score,
        updated_at: new Date().toISOString()
      }], {
        onConflict: 'user_id,date'
      });

    if (error) throw error;
  }

  public async getLeaderboard(date: string): Promise<FormattedLeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('health_metrics')
      .select(`
        user_id,
        steps,
        distance,
        score,
        users (
          id,
          display_name,
          photo_url,
          settings
        )
      `)
      .eq('date', date)
      .order('score', { ascending: false })
      .limit(100); // Limit to top 100 users for performance

    if (error) throw error;
    
    // Filter and transform the data
    return (data || [])
      .filter(entry => 
        entry.users?.[0]?.settings?.privacyLevel !== 'private' &&
        entry.users?.[0]?.display_name &&
        entry.steps !== null &&
        entry.distance !== null &&
        entry.score !== null
      )
      .map(entry => ({
        user_id: entry.user_id,
        steps: entry.steps,
        distance: entry.distance,
        score: entry.score,
        user: entry.users[0]
      }));
  }

  public async getUserMetrics(userId: string, date: string): Promise<HealthMetricsData | null> {
    const { data, error } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return null;
      }
      throw error;
    }

    return data;
  }
}

export default HealthMetricsService.getInstance();
