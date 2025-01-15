export interface HealthMetrics {
  steps: number;
  flights: number;
  distance: number;  // in meters
  heartRate?: number; // beats per minute
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