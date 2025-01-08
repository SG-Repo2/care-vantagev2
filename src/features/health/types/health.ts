import { DataSource } from '../../../core/types/base';

export interface HealthMetrics {
  steps: number;
  distance: number;
  calories: number;
  heartRate: number;
  score?: number;
}

export interface WeeklyMetrics {
  weeklySteps: number[];
  weeklyCalories: number[];
  weeklyDistance: number[];
  weeklyHeartRate: number[];
  weekStartDate: Date;
}

export type MetricType = 'steps' | 'calories' | 'distance' | 'heartRate';

export interface HealthState {
  isInitialized: boolean;
  hasPermissions: boolean;
  isLoading: boolean;
  error: string | null;
  metrics: HealthMetrics | null;
}
