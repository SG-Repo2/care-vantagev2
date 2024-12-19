import { HealthMetrics, HealthScore } from '../../features/profile/types/health';
import { HEALTH_METRICS } from '../constants/metrics';

export class HealthScoring {
  static calculateScore(metrics: HealthMetrics): HealthScore {
    const steps = metrics.steps || 0;
    const distance = metrics.distance || 0;
    
    const stepsScore = this.calculateStepsScore(steps);
    const distanceScore = this.calculateDistanceScore(distance);

    const overall = (stepsScore + distanceScore) / 2;

    return {
      overall: Math.round(overall),
      categories: {
        steps: Math.round(stepsScore),
        distance: Math.round(distanceScore)
      },
      dailyVictory: steps >= HEALTH_METRICS.STEPS.DAILY_GOAL
    };
  }

  private static calculateStepsScore(steps: number): number {
    const { DAILY_GOAL, MIN_HEALTHY } = HEALTH_METRICS.STEPS;
    if (steps >= DAILY_GOAL) return 100;
    if (steps <= 0) return 0;
    return Math.min(100, (steps / DAILY_GOAL) * 100);
  }

  private static calculateDistanceScore(distance: number): number {
    const { DAILY_GOAL, MIN_HEALTHY } = HEALTH_METRICS.DISTANCE;
    // Convert distance to km if using imperial system
    const distanceInKm = distance;
    if (distanceInKm >= DAILY_GOAL) return 100;
    if (distanceInKm <= 0) return 0;
    return Math.min(100, (distanceInKm / DAILY_GOAL) * 100);
  }
}
