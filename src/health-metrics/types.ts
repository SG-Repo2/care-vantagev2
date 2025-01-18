export interface BaseHealthMetrics {
  steps: number;
  distance: number;
  calories: number | null;
  heartRate: number | null;
  lastUpdated: string;
}

export interface HealthMetrics extends BaseHealthMetrics {
  id: string;
  userId: string;
  date: string;
  dailyScore: number;
  weeklyScore: number | null;
  streakDays: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyMetrics {
  weeklySteps: number;
  weeklyDistance: number;
  weeklyCalories: number | null;
  weeklyHeartRate: number | null;
  startDate: string;
  endDate: string;
}

export interface HealthMetricsValidation {
  isValid: boolean;
  errors?: {
    steps?: string[];
    distance?: string[];
    calories?: string[];
    heartRate?: string[];
    dailyScore?: string[];
  };
}

export interface HealthError {
  type: 'initialization' | 'permissions' | 'data' | 'validation' | 'sync' | 'provider';
  message: string;
  details?: unknown;
  timestamp: string;
  deviceId?: string;
}

// Branded types for stronger type safety
export type UserId = string & { readonly __brand: unique symbol };
export type MetricId = string & { readonly __brand: unique symbol };

// Provider-specific types
export interface ProviderMetrics extends BaseHealthMetrics {
  score?: number;  // Provider-calculated score before normalization
}

// Sync types
export interface SyncQueueItem {
  id: string;
  metrics: Partial<HealthMetrics>;
  timestamp: string;
  deviceId: string;
  retryCount: number;
}

export interface SyncResult {
  success: boolean;
  error?: HealthError;
  metrics?: HealthMetrics;
}