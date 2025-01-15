export interface HealthMetrics {
  steps: number;
  distance: number;
  flights: number;
  heartRate?: number;
  calories?: number;
}

export interface HealthProvider {
  getMetrics(date: Date): Promise<HealthMetrics>;
  requestPermissions(): Promise<boolean>;
  isAvailable(): Promise<boolean>;
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