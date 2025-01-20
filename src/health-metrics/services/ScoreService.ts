import { BaseHealthMetrics } from '../types';
import { validateMetrics, calculateHealthScore } from '../../utils/HealthScoring';
import { supabase } from '../../utils/supabase';
import { Platform } from 'react-native';
export class ScoreService {
  private static instance: ScoreService;
  
  private constructor() {}
  
  static getInstance(): ScoreService {
    if (!this.instance) {
      this.instance = new ScoreService();
    }
    return this.instance;
  }

  /**
   * Calculate score locally for immediate feedback
   */
  calculateLocalScore(metrics: Partial<BaseHealthMetrics>): number {
    const validation = validateMetrics(metrics);
    if (!validation.isValid) {
      console.warn('Invalid metrics:', validation.errors);
      return 0;
    }

    const { totalScore } = calculateHealthScore(metrics);
    return totalScore;
  }

  /**
   * Get server-calculated score
   */
  async getServerScore(
    metrics: Partial<BaseHealthMetrics>
  ): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_health_score', {
        p_steps: metrics.steps || 0,
        p_distance: metrics.distance || 0,
        p_calories: metrics.calories || 0,
        p_heart_rate: metrics.heart_rate || 0
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error getting server score:', error);
      // Fallback to local calculation if server fails
      return this.calculateLocalScore(metrics);
    }
  }

  /**
   * Update health metrics with server-calculated score
   */
  async updateHealthMetrics(
    userId: string,
    metrics: BaseHealthMetrics,
    date: string
  ): Promise<{ success: boolean; score: number }> {
    // First validate metrics
    const validation = validateMetrics(metrics);
    if (!validation.isValid) {
      throw new Error('Invalid metrics: ' + JSON.stringify(validation.errors));
    }

    // Calculate local score for immediate feedback
    const localScore = this.calculateLocalScore(metrics);

    try {
      // Update metrics using RPC function
      const { data, error } = await supabase.rpc('upsert_health_metrics', {
        p_date: date,
        p_user_id: userId,
        p_calories: metrics.calories || 0,
        p_distance: metrics.distance || 0,
        p_heart_rate: metrics.heart_rate || 0,
        p_steps: metrics.steps || 0,
        p_device_id: Platform.OS,
        p_source: 'app'
      });

      if (error) throw error;

      // Return server-calculated score
      return {
        success: true,
        score: data.daily_score
      };
    } catch (error) {
      console.error('Error updating health metrics:', error);
      // Return local score if server update fails
      return {
        success: false,
        score: localScore
      };
    }
  }

  /**
   * Resolve any discrepancies between local and server scores
   */
  async reconcileScores(
    userId: string,
    date: string,
    localScore: number
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('health_metrics')
        .select('daily_score')
        .eq('user_id', userId)
        .eq('date', date)
        .maybeSingle();

      if (error) throw error;

      const serverScore = data?.daily_score ?? localScore;
      
      // If scores differ significantly (>5 points), log for investigation
      if (Math.abs(serverScore - localScore) > 5) {
        console.warn(
          'Score discrepancy detected:',
          { localScore, serverScore, userId, date }
        );
      }

      return serverScore;
    } catch (error) {
      console.error('Error reconciling scores:', error);
      return localScore;
    }
  }

  /**
   * Get current score with proper error handling
   */
  async getCurrentScore(userId: string, date: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('health_metrics')
        .select('daily_score')
        .eq('user_id', userId)
        .eq('date', date)
        .maybeSingle();

      if (error) throw error;
      return data?.daily_score ?? 0;
    } catch (error) {
      console.error('Error fetching current score:', error);
      return 0;
    }
  }
}

export const scoreService = ScoreService.getInstance();