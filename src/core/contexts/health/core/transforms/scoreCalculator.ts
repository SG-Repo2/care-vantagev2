import type { HealthMetrics } from '../../types';

export const calculateHealthScore = (metrics: HealthMetrics): number => {
  const { steps, distance, calories, heartRate } = metrics;
  
  // Step score (max 25 points)
  const stepsScore = Math.min(steps / 10000, 1) * 25;
  
  // Distance score (max 25 points)
  const distanceScore = Math.min(distance / 5, 1) * 25;
  
  // Calorie score (max 25 points)
  const calorieScore = Math.min(calories / 500, 1) * 25;
  
  // Heart rate score (max 25 points)
  const heartRateScore = heartRate > 0 ? 25 : 0;

  return Math.round(stepsScore + distanceScore + calorieScore + heartRateScore);
};

export const calculateWeeklyScore = (weeklyMetrics: {
  weeklySteps: number;
  weeklyDistance: number;
  weeklyCalories: number;
  weeklyHeartRate: number;
}): number => {
  const { weeklySteps, weeklyDistance, weeklyCalories, weeklyHeartRate } = weeklyMetrics;
  
  // Calculate daily averages for scoring
  const dailySteps = weeklySteps / 7;
  const dailyDistance = weeklyDistance / 7;
  const dailyCalories = weeklyCalories / 7;
  
  return calculateHealthScore({
    steps: dailySteps,
    distance: dailyDistance,
    calories: dailyCalories,
    heartRate: weeklyHeartRate,
    lastUpdated: new Date().toISOString()
  });
};