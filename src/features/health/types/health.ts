import { DataSource } from '../../../core/types/base';

export interface HealthMetrics {
  id: string;
  profileId: string;
  date: string;
  steps: number;
  distance: number;
  calories: number;
  score: number;
  source: DataSource;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyMetrics {
  weeklySteps: number[];
  weekStartDate: Date;
}

export type MetricType = 'steps' | 'calories' | 'distance' | 'score';

export interface HealthState {
  isInitialized: boolean;
  hasPermissions: boolean;
  isLoading: boolean;
  error: string | null;
  metrics: HealthMetrics | null;
}
