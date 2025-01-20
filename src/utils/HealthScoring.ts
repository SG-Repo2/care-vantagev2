import { HEALTH_METRICS } from '../health-metrics/config/metrics';
import type { BaseHealthMetrics, HealthMetricsValidation } from '../health-metrics/types';

export function validateMetrics(metrics: Partial<BaseHealthMetrics>): HealthMetricsValidation {
  const errors: HealthMetricsValidation['errors'] = {};
  let isValid = true;

  // Steps validation
  if (metrics.steps !== null && metrics.steps !== undefined) {
    if (metrics.steps < 0) {
      errors.steps = ['Steps cannot be negative'];
      isValid = false;
    }
  }
  // Distance validation
  if (metrics.distance !== null && metrics.distance !== undefined) {
    if (metrics.distance < 0) {
      errors.distance = ['Distance cannot be negative'];
      isValid = false;
    }
  }

  // Calories validation
  if (metrics.calories !== null && metrics.calories !== undefined) {
    if (metrics.calories < 0) {
      errors.calories = ['Calories cannot be negative'];
      isValid = false;
    }
  }

  // Heart rate validation
  if (metrics.heart_rate !== null && metrics.heart_rate !== undefined) {
    if (metrics.heart_rate < 0) {
      errors.heart_rate = ['Heart rate cannot be negative'];
      isValid = false;
    }
  }

  return { isValid, errors: Object.keys(errors).length > 0 ? errors : undefined };
}

export function calculateMetricScore(value: number | null, metricKey: keyof typeof HEALTH_METRICS): number {
  if (value === null) return 0;

  const config = HEALTH_METRICS[metricKey];
  
  // Heart rate uses a different scoring method
  if (metricKey === 'HEART_RATE') {
    if ('MAX_HEALTHY' in config && (value < config.MIN_HEALTHY || value > config.MAX_HEALTHY)) {
      return 0;
    }
    return 100;
  }

  // For other metrics
  if ('DAILY_GOAL' in config) {
    if (value >= config.DAILY_GOAL) {
      return 100;
    } else if (value >= config.MIN_HEALTHY) {
      const range = config.DAILY_GOAL - config.MIN_HEALTHY;
      const progress = value - config.MIN_HEALTHY;
      return Math.round((progress / range) * 50) + 50;
    }
  }

  if (value > 0) {
    const progress = value / config.MIN_HEALTHY;
    return Math.round(progress * 50);
  }
  
  return 0;
}

export function calculateHealthScore(metrics: Partial<BaseHealthMetrics>): {
  totalScore: number;
  componentScores: Record<string, number>;
} {
  const scores = {
    steps: calculateMetricScore(metrics.steps ?? null, 'STEPS'),
    distance: calculateMetricScore(metrics.distance ?? null, 'DISTANCE'), 
    calories: calculateMetricScore(metrics.calories ?? null, 'CALORIES'),
    heart_rate: calculateMetricScore(metrics.heart_rate ?? null, 'HEART_RATE')
  };

  // Calculate weighted average (equal weights for now)
  const weights = {
    steps: 0.3,
    distance: 0.3,
    calories: 0.2,
    heart_rate: 0.2
  };

  const totalScore = Math.round(
    Object.entries(scores).reduce((sum, [key, score]) => {
      return sum + score * weights[key as keyof typeof weights];
    }, 0)
  );

  return {
    totalScore,
    componentScores: scores
  };
} 