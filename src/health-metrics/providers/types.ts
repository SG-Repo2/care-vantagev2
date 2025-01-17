export interface HealthMetrics {
  steps: number;
  distance: number;
  calories: number;
  heartRate: number;
  lastUpdated: string;
  score?: number;
}

export interface HealthProvider {
  initialize(): Promise<void>;
  requestPermissions(): Promise<void>;
  getMetrics(): Promise<HealthMetrics>;
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