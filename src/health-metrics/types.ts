export interface HealthMetrics {
  id: string;
  userId: string;
  date: string;
  steps: number;
  distance: number;
  calories: number | null;
  heartRate: number | null;
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