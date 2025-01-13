import type { HealthMetrics, WeeklyMetrics, HealthError } from '../../health/types';

interface ValidationResult {
  isValid: boolean;
  error?: HealthError;
}

const NUMERIC_METRIC_FIELDS = [
  'steps',
  'distance',
  'calories',
  'heartRate',
  'weeklySteps',
  'weeklyDistance',
  'weeklyCalories',
  'weeklyHeartRate'
] as const;

const REQUIRED_DATE_FIELDS = ['lastUpdated'] as const;

type NumericMetricKey = typeof NUMERIC_METRIC_FIELDS[number];
type DateFieldKey = typeof REQUIRED_DATE_FIELDS[number];

export class HealthDataValidator {
  static validateMetrics(metrics: HealthMetrics & WeeklyMetrics): ValidationResult {
    try {
      // Validate required numeric fields exist
      for (const field of NUMERIC_METRIC_FIELDS) {
        if (!(field in metrics)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate required date fields exist
      for (const field of REQUIRED_DATE_FIELDS) {
        if (!(field in metrics)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate numeric fields are non-negative
      for (const field of NUMERIC_METRIC_FIELDS) {
        const value = metrics[field];
        if (typeof value === 'number' && value < 0) {
          throw new Error(`${field} cannot be negative`);
        }
      }

      // Validate date fields
      if (!isValidISODate(metrics.lastUpdated)) {
        throw new Error('Invalid lastUpdated date format');
      }

      if (metrics.startDate && !isValidISODate(metrics.startDate)) {
        throw new Error('Invalid startDate format');
      }

      if (metrics.endDate && !isValidISODate(metrics.endDate)) {
        throw new Error('Invalid endDate format');
      }

      // Validate weekly metrics are consistent with time period
      if (metrics.startDate && metrics.endDate) {
        const start = new Date(metrics.startDate);
        const end = new Date(metrics.endDate);
        
        if (start > end) {
          throw new Error('startDate cannot be after endDate');
        }

        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 7) {
          throw new Error('Weekly metrics period cannot exceed 7 days');
        }
      }

      // Validate score if present
      if (metrics.score !== undefined && (metrics.score < 0 || metrics.score > 100)) {
        throw new Error('Score must be between 0 and 100');
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: {
          type: 'data',
          message: error instanceof Error ? error.message : 'Invalid health metrics data',
          details: error
        }
      };
    }
  }

  static validateWeeklyData(weeklyData: WeeklyMetrics): ValidationResult {
    try {
      const WEEKLY_FIELDS = [
        'weeklySteps',
        'weeklyDistance',
        'weeklyCalories',
        'weeklyHeartRate'
      ] as const;

      // Validate required fields
      for (const field of WEEKLY_FIELDS) {
        if (!(field in weeklyData)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate numeric fields are non-negative
      for (const field of WEEKLY_FIELDS) {
        const value = weeklyData[field];
        if (typeof value === 'number' && value < 0) {
          throw new Error(`${field} cannot be negative`);
        }
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: {
          type: 'data',
          message: error instanceof Error ? error.message : 'Invalid weekly metrics data',
          details: error
        }
      };
    }
  }
}

function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && dateString === date.toISOString();
}