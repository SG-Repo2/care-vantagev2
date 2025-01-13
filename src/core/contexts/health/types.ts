import { Dispatch, ReactNode } from 'react';

export interface HealthMetrics {
  steps: number;
  distance: number;
  calories: number;
  heartRate: number;
  lastUpdated: string;
  score?: number;
}

export interface WeeklyMetrics {
  weeklySteps: number;
  weeklyDistance: number;
  weeklyCalories: number;
  weeklyHeartRate: number;
  startDate?: string;
  endDate?: string;
  score?: number;
}

export interface HealthProvider {
  initialize(): Promise<void>;
  getMetrics(): Promise<HealthMetrics & WeeklyMetrics>;
  requestPermissions(): Promise<void>;
  hasPermissions?(): Promise<boolean>;
  getWeeklyData?(startDate: string, endDate: string): Promise<WeeklyMetrics>;
  sync?(): Promise<void>;
}

export interface HealthError {
  type: 'initialization' | 'permissions' | 'data';
  message: string;
  details?: unknown;
}

export interface HealthServiceConfig {
  enableBackgroundSync?: boolean;
  syncInterval?: number;
  metrics?: string[];
  retryAttempts?: number;
}

export interface HealthDataState {
  metrics: (HealthMetrics & WeeklyMetrics) | null;
  loading: boolean;
  error: HealthError | null;
  weeklyData?: WeeklyMetrics | null;
  lastSync?: string | null;
}

export type HealthDataAction =
  | { type: 'SET_METRICS'; payload: HealthMetrics & WeeklyMetrics }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: HealthError }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_WEEKLY_DATA'; payload: WeeklyMetrics }
  | { type: 'SET_LAST_SYNC'; payload: string }
  | { type: 'RESET_STATE' };

export interface HealthDataContextType {
  metrics: (HealthMetrics & WeeklyMetrics) | null;
  loading: boolean;
  error: HealthError | null;
  weeklyData: WeeklyMetrics | null;
  lastSync: string | null;
  dispatch: Dispatch<HealthDataAction>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export interface HealthDataProviderProps {
  children: ReactNode;
  config?: HealthServiceConfig;
  validateOnChange?: boolean;
}

export interface MetricsHistory {
  steps: number | number[];
  distance: number | number[];
  calories: number | number[];
  heartRate: number | number[];
  dates: string[];
}

export interface HealthMetricsResponse {
  current: HealthMetrics;
  weekly: WeeklyMetrics;
  history?: MetricsHistory;
}

// Default configuration
export const DEFAULT_HEALTH_CONFIG: Required<HealthServiceConfig> = {
  enableBackgroundSync: true,
  syncInterval: 300000, // 5 minutes
  metrics: ['steps', 'distance', 'calories', 'heartRate'],
  retryAttempts: 3
};