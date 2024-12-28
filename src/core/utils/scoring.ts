import { HealthMetrics, HealthScore } from '../../features/health/types/health';
import { HEALTH_METRICS } from '../constants/metrics';

export class HealthScoring {
  static calculateScore(metrics: HealthMetrics): HealthScore {
    const steps = metrics.steps || 0;
    const distance = metrics.distance || 0;
    
    const stepsScore = this.calculateStepsScore(steps);
    const distanceScore = this.calculateDistanceScore(distance);
    const bonusPoints = this.calculateStepsBonusPoints(steps);
    
    // Combine scores and include bonus points
    const overall = Math.min(100, ((stepsScore + distanceScore) / 2) + bonusPoints);

    return {
      overall: Math.round(overall),
      categories: {
        steps: Math.round(stepsScore),
        distance: Math.round(distanceScore)
      },
      dailyVictory: steps >= HEALTH_METRICS.STEPS.DAILY_GOAL,
      bonusPoints: bonusPoints
    };
  }

  private static calculateStepsScore(steps: number): number {
    // Calculate points based on 10 points per 1000 steps
    const pointsPer1000Steps = 10;
    const basePoints = Math.floor(steps / 1000) * pointsPer1000Steps;
    
    // Cap the base points at 100
    return Math.min(100, basePoints);
  }

  private static calculateStepsBonusPoints(steps: number): number {
    // Award 5 bonus points if daily goal is reached
    const { DAILY_GOAL } = HEALTH_METRICS.STEPS;
    return steps >= DAILY_GOAL ? 5 : 0;
  }

  private static calculateDistanceScore(distance: number): number {
    const { DAILY_GOAL } = HEALTH_METRICS.DISTANCE;
    const distanceInKm = distance;
    if (distanceInKm >= DAILY_GOAL) return 100;
    if (distanceInKm <= 0) return 0;
    return Math.min(100, (distanceInKm / DAILY_GOAL) * 100);
  }
}