import { Logger } from '../../../utils/error/Logger';
import { subscriptionManager } from '../SubscriptionManager';
import { HealthMetric, HealthMetricType } from '../../database/daos/HealthMetricsDAO';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type HealthMetricCallback = (metric: HealthMetric) => void;

interface MetricSubscription {
  id: string;
  metricType: HealthMetricType;
  userId: string;
  callback: HealthMetricCallback;
}

export class HealthMetricsListener {
  private static instance: HealthMetricsListener;
  private subscriptions: Map<string, MetricSubscription> = new Map();
  private readonly tableName = 'health_metrics';

  private constructor() {}

  public static getInstance(): HealthMetricsListener {
    if (!HealthMetricsListener.instance) {
      HealthMetricsListener.instance = new HealthMetricsListener();
    }
    return HealthMetricsListener.instance;
  }

  /**
   * Type guard to validate metric data
   */
  private isValidMetric(data: any): data is HealthMetric {
    return (
      data &&
      typeof data.id === 'string' &&
      typeof data.user_id === 'string' &&
      typeof data.metric_type === 'string' &&
      typeof data.value === 'number' &&
      typeof data.unit === 'string' &&
      typeof data.timestamp === 'string' &&
      typeof data.source === 'string' &&
      typeof data.created_at === 'string' &&
      typeof data.updated_at === 'string' &&
      Object.values(HealthMetricType).includes(data.metric_type as HealthMetricType)
    );
  }

  /**
   * Subscribes to health metric updates for a specific user and metric type
   */
  public async subscribeToMetrics(
    userId: string,
    metricType: HealthMetricType,
    callback: HealthMetricCallback
  ): Promise<string> {
    try {
      const subscriptionId = await subscriptionManager.subscribe(
        this.tableName,
        this.handleMetricUpdate.bind(this),
        {
          filter: `user_id=eq.${userId}&metric_type=eq.${metricType}`,
          event: '*',
          errorHandler: (error) => {
            Logger.error('Health metric subscription error', {
              error,
              userId,
              metricType,
            });
          },
        }
      );

      const subscription: MetricSubscription = {
        id: subscriptionId,
        metricType,
        userId,
        callback,
      };

      this.subscriptions.set(subscriptionId, subscription);
      Logger.info('Health metric subscription created', {
        subscriptionId,
        userId,
        metricType,
      });

      return subscriptionId;
    } catch (error) {
      Logger.error('Failed to subscribe to health metrics', {
        error,
        userId,
        metricType,
      });
      throw error;
    }
  }

  /**
   * Handles metric update events
   */
  private handleMetricUpdate(
    payload: RealtimePostgresChangesPayload<Record<string, any>>
  ): void {
    try {
      // Ensure we have a valid metric object
      if (!this.isValidMetric(payload.new)) {
        Logger.error('Invalid metric data received', { payload });
        return;
      }

      const metric = payload.new as HealthMetric;
      const subscriptions = Array.from(this.subscriptions.values()).filter(
        sub =>
          sub.userId === metric.user_id &&
          sub.metricType === metric.metric_type
      );

      for (const subscription of subscriptions) {
        try {
          subscription.callback(metric);
        } catch (error) {
          Logger.error('Error in metric update callback', {
            error,
            subscriptionId: subscription.id,
            metric,
          });
        }
      }
    } catch (error) {
      Logger.error('Error handling metric update', { error, payload });
    }
  }

  /**
   * Unsubscribes from health metric updates
   */
  public async unsubscribe(subscriptionId: string): Promise<void> {
    try {
      await subscriptionManager.unsubscribe(subscriptionId);
      this.subscriptions.delete(subscriptionId);
      Logger.info('Health metric subscription removed', { subscriptionId });
    } catch (error) {
      Logger.error('Failed to unsubscribe from health metrics', {
        error,
        subscriptionId,
      });
      throw error;
    }
  }

  /**
   * Unsubscribes from all health metric updates for a user
   */
  public async unsubscribeUser(userId: string): Promise<void> {
    const userSubscriptions = Array.from(this.subscriptions.values()).filter(
      sub => sub.userId === userId
    );

    for (const subscription of userSubscriptions) {
      await this.unsubscribe(subscription.id);
    }
  }

  /**
   * Gets all active subscriptions for a user
   */
  public getUserSubscriptions(userId: string): MetricSubscription[] {
    return Array.from(this.subscriptions.values()).filter(
      sub => sub.userId === userId
    );
  }

  /**
   * Gets all active subscriptions for a metric type
   */
  public getMetricTypeSubscriptions(
    metricType: HealthMetricType
  ): MetricSubscription[] {
    return Array.from(this.subscriptions.values()).filter(
      sub => sub.metricType === metricType
    );
  }

  /**
   * Checks if a user has any active subscriptions
   */
  public hasUserSubscriptions(userId: string): boolean {
    return Array.from(this.subscriptions.values()).some(
      sub => sub.userId === userId
    );
  }

  /**
   * Gets a subscription by ID
   */
  public getSubscription(subscriptionId: string): MetricSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  /**
   * Closes all subscriptions
   */
  public async closeAll(): Promise<void> {
    const subscriptionIds = Array.from(this.subscriptions.keys());
    for (const id of subscriptionIds) {
      await this.unsubscribe(id);
    }
  }
}

// Export singleton instance
export const healthMetricsListener = HealthMetricsListener.getInstance();
