export interface HealthMetrics {
  steps: number;
  distance: number;
  calories: number;
  heartRate?: number;
}

export interface HealthProvider {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  getMetrics(date: Date): Promise<HealthMetrics>;
}

export interface HealthError {
  type: 'permissions' | 'data' | 'availability';
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