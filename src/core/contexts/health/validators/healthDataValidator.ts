import { ValidationResult } from '../types';

export class HealthDataValidator {
  static validateMetrics(metrics: any): ValidationResult {
    if (!metrics) {
      return {
        isValid: false,
        errors: ['Metrics object is required'],
        sanitizedData: null
      };
    }

    const sanitizedData = {
      steps: Math.max(0, Math.round(metrics.steps || 0)),
      distance: Math.max(0, Number((metrics.distance || 0).toFixed(2))),
      heartRate: Math.max(0, Math.round(metrics.heartRate || 0)),
      calories: Math.max(0, Math.round(metrics.calories || 0))
    };

    const errors: string[] = [];

    // Validate steps
    if (metrics.steps < 0) {
      errors.push('Steps cannot be negative');
    }

    // Validate distance
    if (metrics.distance < 0) {
      errors.push('Distance cannot be negative');
    }

    // Validate heart rate
    if (metrics.heartRate < 0) {
      errors.push('Heart rate cannot be negative');
    }
    if (metrics.heartRate > 250) {
      errors.push('Heart rate exceeds maximum possible value');
    }

    // Validate calories
    if (metrics.calories < 0) {
      errors.push('Calories cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    };
  }

  static validateWeeklyData(weeklyData: any): ValidationResult {
    if (!weeklyData) {
      return {
        isValid: false,
        errors: ['Weekly data object is required'],
        sanitizedData: null
      };
    }

    const errors: string[] = [];

    // Validate arrays exist
    if (!Array.isArray(weeklyData.weeklySteps)) {
      errors.push('Weekly steps must be an array');
    }
    if (!Array.isArray(weeklyData.weeklyDistance)) {
      errors.push('Weekly distance must be an array');
    }

    // Early return if basic validation fails
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        sanitizedData: null
      };
    }

    const sanitizedData = {
      weeklySteps: weeklyData.weeklySteps.map((steps: number) => 
        Math.max(0, Math.round(steps || 0))
      ),
      weeklyDistance: weeklyData.weeklyDistance.map((distance: number) => 
        Math.max(0, Number((distance || 0).toFixed(2)))
      ),
      startDate: weeklyData.startDate,
      endDate: weeklyData.endDate
    };

    // Validate array lengths
    if (sanitizedData.weeklySteps.length !== 7) {
      errors.push('Weekly steps must contain exactly 7 days of data');
    }
    if (sanitizedData.weeklyDistance.length !== 7) {
      errors.push('Weekly distance must contain exactly 7 days of data');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    };
  }
}