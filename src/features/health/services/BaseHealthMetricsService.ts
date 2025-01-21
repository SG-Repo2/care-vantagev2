import { supabase } from '../../../utils/supabase';
import { DateUtils } from '../../../utils/DateUtils';
import { validateMetrics, calculateHealthScore } from '../../../utils/HealthScoring';
import { HealthMetrics, HealthMetricsValidation, UserId } from '../providers/types';
import { HealthMetricsService } from './HealthMetricsService';
import { syncQueue } from './SyncQueue';
export class BaseHealthMetricsService implements HealthMetricsService {
  private static instance: BaseHealthMetricsService;

  private constructor() {}

  static getInstance(): BaseHealthMetricsService {
    if (!this.instance) {
      this.instance = new BaseHealthMetricsService();
    }
    return this.instance;
  }

  async getMetrics(userId: UserId, date: string): Promise<HealthMetrics> {
    const { data, error } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error) throw error;
    if (!data) {
      throw new Error('No metrics found for the specified date');
    }

    return data as HealthMetrics;
  }

  async updateMetrics(userId: UserId, metrics: Partial<HealthMetrics>): Promise<void> {
    const validation = this.validateMetrics(metrics);
    if (!validation.isValid) {
      throw new Error('Invalid metrics data: ' + JSON.stringify(validation.errors));
    }

    const { totalScore } = calculateHealthScore(metrics);
    const date = DateUtils.getLocalDateString();

    const { error } = await supabase
      .from('health_metrics')
      .upsert({
        user_id: userId,
        date,
        ...metrics,
        daily_score: totalScore,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,date'
      });

    if (error) throw error;
  }

  validateMetrics(metrics: Partial<HealthMetrics>): HealthMetricsValidation {
    return validateMetrics(metrics);
  }

  async syncOfflineData(): Promise<void> {
    await syncQueue.processQueue();
  }

  async getProviderData(source: 'apple_health' | 'health_connect'): Promise<HealthMetrics> {
    // This would be implemented by platform-specific providers
    throw new Error('Method not implemented in base service');
  }
}