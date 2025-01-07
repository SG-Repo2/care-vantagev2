import { DataSource } from '../../../core/types/base';

export interface HealthScore {
  overall: number;
  categories: {
    steps: number;
    distance: number;
  };
  dailyVictory: boolean;
  bonusPoints: number;
}

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

export type MetricType = 'steps' | 'distance' | 'calories' | 'score';

export interface HealthState {
  isInitialized: boolean;
  hasPermissions: boolean;
  isLoading: boolean;
  error: string | null;
  metrics: HealthMetrics | null;
}
