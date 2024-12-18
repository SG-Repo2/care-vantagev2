import { HealthMetrics, HealthScore } from '../../features/profile/types/health';
import { HEALTH_METRICS } from '../constants/metrics';

export class HealthScoring {
  static calculateScore(metrics: HealthMetrics): HealthScore {
    const stepsScore = this.calculateStepsScore(metrics.steps);
    const heartScore = metrics.heartRate 
      ? this.calculateHeartScore(metrics.heartRate)
      : 0;
    const sleepScore = metrics.sleep
      ? this.calculateSleepScore(metrics.sleep)
      : 0;

    const overall = this.calculateOverallScore({
      steps: stepsScore,
      heart: heartScore,
      sleep: sleepScore
    });

    return {
      id: `score_${metrics.id}`,
      metricsId: metrics.id,
      overall,
      categories: {
        activity: stepsScore,
        cardio: heartScore,
        sleep: sleepScore
      },
      breakdown: {
        stepsContribution: stepsScore * HEALTH_METRICS.STEPS.CONTRIBUTION_WEIGHT,
        heartRateContribution: heartScore * HEALTH_METRICS.HEART_RATE.CONTRIBUTION_WEIGHT,
        sleepContribution: sleepScore * HEALTH_METRICS.SLEEP.CONTRIBUTION_WEIGHT
      }
    };
  }

  private static calculateStepsScore(steps: number): number {
    const { DAILY_GOAL, MIN_HEALTHY } = HEALTH_METRICS.STEPS;
    if (steps >= DAILY_GOAL) return 100;
    if (steps <= 0) return 0;
    return Math.min(100, (steps / DAILY_GOAL) * 100);
  }

  private static calculateHeartScore(heartRate: HealthMetrics['heartRate']): number {
    if (!heartRate) return 0;
    
    const { RESTING_RANGE } = HEALTH_METRICS.HEART_RATE;
    const restingScore = heartRate.average >= RESTING_RANGE.MIN && 
                        heartRate.average <= RESTING_RANGE.MAX ? 100 : 70;
    
    // Additional heart rate variability and zone analysis could be added here
    return restingScore;
  }

  private static calculateSleepScore(sleep: HealthMetrics['sleep']): number {
    if (!sleep) return 0;
    
    const { DAILY_GOAL, MIN_HEALTHY, STAGES } = HEALTH_METRICS.SLEEP;
    const totalSleep = sleep.deepSleep + sleep.lightSleep + sleep.remSleep;
    
    if (totalSleep >= DAILY_GOAL) return 100;
    if (totalSleep <= 0) return 0;
    
    const durationScore = (totalSleep / DAILY_GOAL) * 100;
    const qualityScore = this.calculateSleepQualityScore(sleep);
    
    return Math.min(100, (durationScore + qualityScore) / 2);
  }

  private static calculateSleepQualityScore(sleep: NonNullable<HealthMetrics['sleep']>): number {
    const totalSleep = sleep.deepSleep + sleep.lightSleep + sleep.remSleep;
    if (totalSleep === 0) return 0;

    const deepPercentage = sleep.deepSleep / totalSleep;
    const lightPercentage = sleep.lightSleep / totalSleep;
    const remPercentage = sleep.remSleep / totalSleep;

    const { STAGES } = HEALTH_METRICS.SLEEP;
    
    const deepScore = this.calculateStageScore(deepPercentage, STAGES.DEEP);
    const lightScore = this.calculateStageScore(lightPercentage, STAGES.LIGHT);
    const remScore = this.calculateStageScore(remPercentage, STAGES.REM);

    return (deepScore + lightScore + remScore) / 3;
  }

  private static calculateStageScore(
    percentage: number, 
    range: { MIN_PERCENTAGE: number; MAX_PERCENTAGE: number }
  ): number {
    if (percentage >= range.MIN_PERCENTAGE && percentage <= range.MAX_PERCENTAGE) {
      return 100;
    }
    const midPoint = (range.MIN_PERCENTAGE + range.MAX_PERCENTAGE) / 2;
    const distance = Math.abs(percentage - midPoint);
    const maxDistance = range.MAX_PERCENTAGE - midPoint;
    return Math.max(0, 100 * (1 - distance / maxDistance));
  }

  private static calculateOverallScore(scores: {
    steps: number;
    heart: number;
    sleep: number;
  }): number {
    const { STEPS, HEART_RATE, SLEEP } = HEALTH_METRICS;
    
    return Math.round(
      scores.steps * STEPS.CONTRIBUTION_WEIGHT +
      scores.heart * HEART_RATE.CONTRIBUTION_WEIGHT +
      scores.sleep * SLEEP.CONTRIBUTION_WEIGHT
    );
  }
}
