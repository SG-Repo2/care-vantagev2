import { supabase } from './supabaseClient';

interface HealthMetricsData {
  user_id: string;
  date: string;
  steps: number;
  distance: number;
  score: number;
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

  public async saveMetrics(metrics: HealthMetricsData): Promise<void> {
    const { error } = await supabase
      .from('health_metrics')
      .upsert([metrics], {
        onConflict: 'user_id,date'
      });

    if (error) throw error;
  }

  public async getLeaderboard(date: string) {
    const { data, error } = await supabase
      .from('health_metrics')
      .select(`
        user_id,
        steps,
        distance,
        score,
        users (
          display_name,
          photo_url
        )
      `)
      .eq('date', date)
      .order('score', { ascending: false });

    if (error) throw error;
    return data;
  }
}

export default HealthMetricsService.getInstance();
