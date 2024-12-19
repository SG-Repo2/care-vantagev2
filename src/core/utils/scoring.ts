import { HealthMetrics, HealthScore } from '../../features/profile/types/health';
import { HEALTH_METRICS } from '../constants/metrics';

export class HealthScoring {
  static calculateScore(metrics: HealthMetrics): HealthScore {
    const stepsScore = this.calculateStepsScore(metrics.steps);
    const distanceScore = this.calculateDistanceScore(metrics.distance);

    const overall = (stepsScore + distanceScore) / 2;

    return {
      id: `score_${metrics.id}`,
      metricsId: metrics.id,
      overall,
      categories: {
        steps: stepsScore,
        distance: distanceScore
      },
      dailyVictory: metrics.steps >= HEALTH_METRICS.STEPS.DAILY_GOAL
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
    if (distance >= DAILY_GOAL) return 100;
    if (distance <= 0) return 0;
    return Math.min(100, (distance / DAILY_GOAL) * 100);
  }
}
