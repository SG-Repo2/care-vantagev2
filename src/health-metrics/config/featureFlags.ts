import { HealthMetrics } from '../types';

export const FEATURE_FLAGS = {
  newHealthMetrics: {
    enabled: false,
    rolloutPercentage: 0
  },
  offlineSync: {
    enabled: true,
    rolloutPercentage: 25
  },
  providerIntegration: {
    enabled: true,
    providers: ['apple_health', 'health_connect'] as const
  }
} as const;

export const PERFORMANCE_THRESHOLDS = {
  apiLatency: 200, // ms
  renderTime: 16, // ms
  memoryUsage: 85, // percentage
  syncDelay: 5000 // ms
} as const;

export class HealthMonitor {
  private metrics: Record<string, any>[] = [];

  addMetric(type: string, data: Record<string, any>) {
    this.metrics.push({
      type,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  trackMetricUpdate(metrics: HealthMetrics): void {
    this.addMetric('health_update', {
      steps: metrics.steps,
      distance: metrics.distance,
      calories: metrics.calories,
      heart_rate: metrics.heart_rate,
      daily_score: metrics.daily_score,
      weekly_score: metrics.weekly_score
    });
  }

  trackPerformance(metric: keyof typeof PERFORMANCE_THRESHOLDS, value: number): void {
    this.addMetric('performance', { metric, value });
    if (value > PERFORMANCE_THRESHOLDS[metric]) {
      this.trackError('performance_threshold_exceeded', { metric, value });
    }
  }

  trackError(type: string, details?: unknown): void {
    this.addMetric('error', {
      errorType: type,
      details,
      deviceInfo: this.getDeviceInfo()
    });
  }

  private getDeviceInfo(): Record<string, string> {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      onlineStatus: navigator.onLine.toString(),
      timestamp: new Date().toISOString()
    };
  }

  async flush(): Promise<void> {
    if (this.metrics.length === 0) return;

    try {
      const analyticsEndpoint = process.env.ANALYTICS_ENDPOINT || '/api/analytics/metrics';
      await fetch(analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: this.metrics,
          timestamp: new Date().toISOString(),
          deviceInfo: this.getDeviceInfo()
        }),
      });
      this.metrics = [];
    } catch (error) {
      console.error('Failed to flush metrics:', error);
      // Keep metrics in memory to try again later
    }
  }

  getMetricsSummary(): Record<string, number> {
    return this.metrics.reduce((summary, metric) => {
      const type = metric.type;
      summary[type] = (summary[type] || 0) + 1;
      return summary;
    }, {} as Record<string, number>);
  }
}

// Feature flag utilities
export function isFeatureEnabled(
  featureName: keyof typeof FEATURE_FLAGS,
  userId?: string
): boolean {
  const feature = FEATURE_FLAGS[featureName];
  
  if (!feature.enabled) return false;
  
  if ('rolloutPercentage' in feature) {
    if (!userId) return false;
    
    // Use userId to determine if user is in rollout group
    const hash = hashString(userId);
    const normalizedHash = hash % 100;
    return normalizedHash < feature.rolloutPercentage;
  }
  
  return true;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Export singleton instance
export const monitor = new HealthMonitor();