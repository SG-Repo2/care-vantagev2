export interface HealthMetrics {
  steps: number;
  distance: number;
  heartRate: number;
  calories: number;
  score?: number;
  timestamp?: string;
  weeklyCalories?: number[];
  weeklyHeartRate?: number[];
  weekStartDate?: Date;
}

export interface WeeklyMetrics {
  weeklySteps: number[];
  weeklyDistance: number[];
  startDate: string;
  endDate: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData: HealthMetrics | WeeklyMetrics | null;
}

export interface HealthDataState {
  metrics: HealthMetrics;
  weeklyData: WeeklyMetrics | null;
  isLoading: boolean;
  error: string | null;
  lastSync: string | null;
}

export type HealthDataAction =
  | { type: 'SET_METRICS'; payload: HealthMetrics }
  | { type: 'SET_WEEKLY_DATA'; payload: WeeklyMetrics }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LAST_SYNC'; payload: string }
  | { type: 'RESET_STATE' };

export interface HealthDataContextType {
  state: HealthDataState;
  dispatch: React.Dispatch<HealthDataAction>;
}

export interface HealthDataProviderProps {
  children: React.ReactNode;
  validateOnChange?: boolean;
}

export interface HealthServiceConfig {
  enableBackgroundSync?: boolean;
  syncInterval?: number;
  retryAttempts?: number;
}

export interface HealthProvider {
  initialize(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  hasPermissions(): Promise<boolean>;
  getMetrics(): Promise<HealthMetrics>;
  getWeeklyData(startDate: string, endDate: string): Promise<WeeklyMetrics>;
  sync(): Promise<void>;
}