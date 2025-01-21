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
  type: 'permissions' | 'data' | 'availability' | 'validation' | 'sync' | 'initialization';
  message: string;
  details?: unknown;
  timestamp?: string;
  device_id?: string;
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

export type UserId = string;

export interface HealthMetricsValidation {
  isValid: boolean;
  errors: Record<string, string[]>;
}

export interface SyncQueueItem {
  id: string;
  metrics: Partial<HealthMetrics>;
  timestamp: string;
  device_id: string;
  retry_count: number;
}

export interface SyncResult {
  success: boolean;
  metrics: HealthMetrics | null;
  error: HealthError | null;
}

export interface ProviderMetrics {
  score?: number;
  daily_score?: number;
  last_updated?: string;
  [key: string]: any;
}