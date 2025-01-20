export interface BaseHealthMetrics {
  steps: number | null;
  distance: number | null;
  calories: number | null;
  heart_rate: number | null;
  last_updated?: string;
}

export interface HealthMetrics extends BaseHealthMetrics {
  id: string;
  user_id: string;
  date: string;
  daily_score: number | null;
  weekly_score: number | null;
  streak_days: number | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyMetrics {
  weekly_steps: number;
  weekly_distance: number;
  weekly_calories: number;
  weekly_heart_rate: number;
  start_date: string;
  end_date: string;
}

export interface HealthProvider {
  initialize(): Promise<void>;
  requestPermissions(): Promise<void>;
  getMetrics(): Promise<HealthMetrics>;
  cleanup?(): Promise<void>;
  checkPermissionsStatus?(): Promise<boolean>;
}

export interface HealthPermissionStatus {
  granted: boolean;
  permissions: {
    steps: boolean;
    distance: boolean;
    heartRate: boolean;
    calories: boolean;
  };
}

export interface HealthError {
  type: 'permissions' | 'data' | 'availability' | 'validation';
  message: string;
  details?: unknown;
}

export interface HealthState {
  metrics: HealthMetrics | null;
  loading: boolean;
  error: HealthError | null;
  lastSync: string | null;
}

export interface HealthConfig {
  enableBackgroundSync?: boolean;
  syncInterval?: number;
} 