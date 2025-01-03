import { BaseDAO } from '../BaseDAO';
import { Logger } from '../../../utils/error/Logger';

export interface HealthMetric {
  id: string;
  user_id: string;
  metric_type: HealthMetricType;
  value: number;
  unit: string;
  timestamp: string;
  source: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export enum HealthMetricType {
  STEPS = 'steps',
  DISTANCE = 'distance',
  CALORIES = 'calories',
  HEART_RATE = 'heart_rate',
  ACTIVE_MINUTES = 'active_minutes',
  SLEEP = 'sleep',
  WATER = 'water',
  WEIGHT = 'weight',
}

interface MetricSummary {
  total: number;
  average: number;
  min: number;
  max: number;
  count: number;
}

interface DateRange {
  start: string;
  end: string;
}

export class HealthMetricsDAO extends BaseDAO<HealthMetric> {
  protected tableName = 'health_metrics';

  /**
   * Creates multiple health metrics in a batch
   */
  public async createBatch(metrics: Partial<HealthMetric>[]): Promise<HealthMetric[]> {
    try {
      const timestamp = new Date().toISOString();
      const metricsWithTimestamp = metrics.map(metric => ({
        ...metric,
        created_at: timestamp,
        updated_at: timestamp,
      }));

      const { data: results, error } = await this.supabase
        .from(this.tableName)
        .insert(metricsWithTimestamp)
        .select();

      if (error) throw this.handleError(error);
      if (!results) throw new Error('Failed to create metrics batch');

      Logger.info(`Created ${results.length} health metrics`);
      return results;
    } catch (error) {
      Logger.error('Failed to create metrics batch', { error, count: metrics.length });
      throw this.handleError(error);
    }
  }

  /**
   * Gets metrics for a specific user and type within a date range
   */
  public async getUserMetrics(
    userId: string,
    metricType: HealthMetricType,
    dateRange: DateRange
  ): Promise<HealthMetric[]> {
    try {
      const { data: metrics, error } = await this.supabase
        .from(this.tableName)
        .select()
        .eq('user_id', userId)
        .eq('metric_type', metricType)
        .gte('timestamp', dateRange.start)
        .lte('timestamp', dateRange.end)
        .order('timestamp', { ascending: true });

      if (error) throw this.handleError(error);
      return metrics || [];
    } catch (error) {
      Logger.error('Failed to get user metrics', { 
        error, userId, metricType, dateRange 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Gets the latest metric of a specific type for a user
   */
  public async getLatestMetric(
    userId: string,
    metricType: HealthMetricType
  ): Promise<HealthMetric | null> {
    try {
      const { data: metric, error } = await this.supabase
        .from(this.tableName)
        .select()
        .eq('user_id', userId)
        .eq('metric_type', metricType)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) throw this.handleError(error);
      return metric;
    } catch (error) {
      Logger.error('Failed to get latest metric', { error, userId, metricType });
      throw this.handleError(error);
    }
  }

  /**
   * Gets a summary of metrics for a specific type and date range
   */
  public async getMetricsSummary(
    userId: string,
    metricType: HealthMetricType,
    dateRange: DateRange
  ): Promise<MetricSummary> {
    try {
      const { data: summary, error } = await this.supabase
        .rpc('get_metrics_summary', {
          p_user_id: userId,
          p_metric_type: metricType,
          p_start_date: dateRange.start,
          p_end_date: dateRange.end,
        });

      if (error) throw this.handleError(error);
      
      return summary || {
        total: 0,
        average: 0,
        min: 0,
        max: 0,
        count: 0,
      };
    } catch (error) {
      Logger.error('Failed to get metrics summary', { 
        error, userId, metricType, dateRange 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Gets daily totals for a metric type within a date range
   */
  public async getDailyTotals(
    userId: string,
    metricType: HealthMetricType,
    dateRange: DateRange
  ): Promise<Array<{ date: string; total: number }>> {
    try {
      const { data: totals, error } = await this.supabase
        .rpc('get_daily_metric_totals', {
          p_user_id: userId,
          p_metric_type: metricType,
          p_start_date: dateRange.start,
          p_end_date: dateRange.end,
        });

      if (error) throw this.handleError(error);
      return totals || [];
    } catch (error) {
      Logger.error('Failed to get daily totals', { 
        error, userId, metricType, dateRange 
      });
      throw this.handleError(error);
    }
  }

  /**
   * Deletes metrics older than the specified date
   */
  public async deleteOldMetrics(
    userId: string,
    olderThan: string
  ): Promise<number> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('user_id', userId)
        .lt('timestamp', olderThan)
        .select();

      if (error) throw this.handleError(error);
      
      const count = result?.length || 0;
      Logger.info(`Deleted ${count} old metrics for user`, { userId });
      return count;
    } catch (error) {
      Logger.error('Failed to delete old metrics', { error, userId, olderThan });
      throw this.handleError(error);
    }
  }

  /**
   * Updates metadata for a specific metric
   */
  public async updateMetadata(
    metricId: string,
    metadata: Record<string, any>
  ): Promise<HealthMetric> {
    try {
      const { data: metric, error } = await this.supabase
        .from(this.tableName)
        .update({
          metadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', metricId)
        .select()
        .single();

      if (error) throw this.handleError(error);
      if (!metric) throw new Error('Metric not found');

      return metric;
    } catch (error) {
      Logger.error('Failed to update metric metadata', { error, metricId });
      throw this.handleError(error);
    }
  }
}

// Export singleton instance
export const healthMetricsDAO = new HealthMetricsDAO();
