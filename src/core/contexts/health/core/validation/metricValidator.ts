import type { HealthMetrics, WeeklyMetrics, HealthError } from '../../types';

export class MetricValidator {
  static validateMetrics(metrics: HealthMetrics): HealthError | null {
    // Validate required numeric fields
    const requiredFields = ['steps', 'distance', 'calories', 'heartRate'];
    for (const field of requiredFields) {
      const value = metrics[field as keyof HealthMetrics];
      if (typeof value !== 'number' || isNaN(value)) {
        return {
          type: 'validation',
          message: `Invalid ${field} value: ${value}`,
          details: metrics
        };
      }
    }

    // Validate date format
    if (!this.isValidISODate(metrics.lastUpdated)) {
      return {
        type: 'validation',
        message: 'Invalid lastUpdated date format',
        details: metrics
      };
    }

    return null;
  }

  static validateWeeklyData(weeklyData: WeeklyMetrics): HealthError | null {
    // Validate required numeric fields
    const requiredFields = [
      'weeklySteps', 
      'weeklyDistance', 
      'weeklyCalories', 
      'weeklyHeartRate'
    ];
    
    for (const field of requiredFields) {
      const value = weeklyData[field as keyof WeeklyMetrics];
      if (typeof value !== 'number' || isNaN(value)) {
        return {
          type: 'validation',
          message: `Invalid ${field} value: ${value}`,
          details: weeklyData
        };
      }
    }

    return null;
  }

  private static isValidISODate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && 
           dateString === date.toISOString();
  }
}