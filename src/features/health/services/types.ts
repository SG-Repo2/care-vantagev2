import { HealthMetrics } from '../types/health';

export interface HealthServiceConfig {
  permissions: {
    read: string[];
    write: string[];
  };
  options?: Record<string, any>;
}

export interface HealthService {
  initialize(config: HealthServiceConfig): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  hasPermissions(): Promise<boolean>;
  getMetrics(date?: Date): Promise<HealthMetrics>;
  getDailySteps(date?: Date): Promise<number>;
  getDailyDistance(date?: Date): Promise<number>;
  getDailyHeartRate(date?: Date): Promise<number>;
  getWeeklySteps(startDate: Date): Promise<number[]>;
}
