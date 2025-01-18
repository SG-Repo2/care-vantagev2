export interface BaseHealthMetrics {
  steps: number | null;
  distance: number | null;
  calories: number | null;
  heart_rate: number | null;
  last_updated: string | null;
}

export interface HealthMetrics extends BaseHealthMetrics {
  id: string;
  user_id: string;
  date: string;
  daily_score: number;
  weekly_score: number | null;
  streak_days: number | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyMetrics {
  weekly_steps: number | null;
  weekly_distance: number | null;
  weekly_calories: number | null;
  weekly_heart_rate: number | null;
  start_date: string;
  end_date: string;
}

export interface HealthMetricsValidation {
  isValid: boolean;
  errors?: {
    steps?: string[];
    distance?: string[];
    calories?: string[];
    heart_rate?: string[];
    daily_score?: string[];
  };
}

export interface HealthError {
  type: 'initialization' | 'permissions' | 'data' | 'validation' | 'sync' | 'provider';
  message: string;
  details?: unknown;
  timestamp: string;
  device_id?: string;
}

// Branded types for stronger type safety
export type UserId = string & { readonly __brand: unique symbol };
export type MetricId = string & { readonly __brand: unique symbol };

// Provider-specific types
export interface ProviderMetrics extends BaseHealthMetrics {
  score: number | null;  // Provider-calculated score before normalization
}

// Sync types
export interface SyncQueueItem {
  id: string;
  metrics: Partial<HealthMetrics>;
  timestamp: string;
  device_id: string;
  retry_count: number;
}

export interface SyncResult {
  success: boolean;
  error: HealthError | null;
  metrics: HealthMetrics | null;
}