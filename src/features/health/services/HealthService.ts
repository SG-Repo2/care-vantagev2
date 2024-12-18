import { HealthMetrics } from '../../profile/types/health';

export interface HealthService {
  initialize(): Promise<boolean>;
  checkPermissions(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  fetchHealthData(date: string): Promise<HealthMetrics>;
  isInitialized(): boolean;
}
