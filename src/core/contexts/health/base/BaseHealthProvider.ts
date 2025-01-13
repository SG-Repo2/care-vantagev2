import type { 
  HealthMetrics, 
  WeeklyMetrics,
  HealthError
} from '../types';

export abstract class BaseHealthProvider {
  protected authorized = false;
  protected initialized = false;

  // Must be implemented by child classes
  protected abstract initializeNative(): Promise<void>;
  protected abstract requestNativePermissions(): Promise<void>;
  protected abstract fetchNativeMetrics(): Promise<any>;
  protected abstract fetchNativeWeeklyData(
    startDate: string,
    endDate: string
  ): Promise<any>;

  // Shared initialization
  async initialize(): Promise<void> {
    await this.initializeNative();
    this.initialized = true;
  }

  async requestPermissions(): Promise<void> {
    await this.requestNativePermissions();
    this.authorized = true;
  }

  // Shared getMetrics example
  async getMetrics(): Promise<HealthMetrics & WeeklyMetrics> {
    if (!this.authorized || !this.initialized) {
      throw {
        type: 'permissions',
        message: 'Provider not authorized or initialized'
      };
    }
    const rawMetrics = await this.fetchNativeMetrics();
    return rawMetrics;
  }

  // Shared getWeeklyData example
  async getWeeklyData(startDate: string, endDate: string): Promise<WeeklyMetrics> {
    if (!this.authorized || !this.initialized) {
      throw {
        type: 'permissions',
        message: 'Provider not authorized or initialized'
      };
    }
    return await this.fetchNativeWeeklyData(startDate, endDate);
  }

  async hasPermissions(): Promise<boolean> {
    return this.authorized;
  }
}