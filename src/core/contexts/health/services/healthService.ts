import { HealthMetrics, WeeklyMetrics, HealthProvider, HealthServiceConfig } from '../types';
import { HealthDataValidator } from '../validators/healthDataValidator';

export class HealthService {
  private provider: HealthProvider;
  private config: Required<HealthServiceConfig>;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(provider: HealthProvider, config: HealthServiceConfig = {}) {
    this.provider = provider;
    this.config = {
      enableBackgroundSync: config.enableBackgroundSync ?? false,
      syncInterval: config.syncInterval ?? 300000, // 5 minutes default
      retryAttempts: config.retryAttempts ?? 3
    };
  }

  async initialize(): Promise<boolean> {
    try {
      const initialized = await this.provider.initialize();
      if (initialized && this.config.enableBackgroundSync) {
        this.startBackgroundSync();
      }
      return initialized;
    } catch (error) {
      console.error('Failed to initialize health service:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      return await this.provider.requestPermissions();
    } catch (error) {
      console.error('Failed to request health permissions:', error);
      return false;
    }
  }

  async hasPermissions(): Promise<boolean> {
    try {
      return await this.provider.hasPermissions();
    } catch (error) {
      console.error('Failed to check health permissions:', error);
      return false;
    }
  }

  async getMetrics(): Promise<HealthMetrics | null> {
    try {
      const metrics = await this.provider.getMetrics();
      const validation = HealthDataValidator.validateMetrics(metrics);
      
      if (!validation.isValid) {
        console.error('Invalid metrics data:', validation.errors);
        return null;
      }

      return validation.sanitizedData as HealthMetrics;
    } catch (error) {
      console.error('Failed to get health metrics:', error);
      return null;
    }
  }

  async getWeeklyData(startDate: string, endDate: string): Promise<WeeklyMetrics | null> {
    try {
      const weeklyData = await this.provider.getWeeklyData(startDate, endDate);
      const validation = HealthDataValidator.validateWeeklyData(weeklyData);

      if (!validation.isValid) {
        console.error('Invalid weekly data:', validation.errors);
        return null;
      }

      return validation.sanitizedData as WeeklyMetrics;
    } catch (error) {
      console.error('Failed to get weekly health data:', error);
      return null;
    }
  }

  async sync(): Promise<void> {
    let attempts = 0;
    while (attempts < this.config.retryAttempts) {
      try {
        await this.provider.sync();
        return;
      } catch (error) {
        attempts++;
        if (attempts === this.config.retryAttempts) {
          console.error('Failed to sync health data after multiple attempts:', error);
          throw error;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }
  }

  private startBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.sync();
      } catch (error) {
        console.error('Background sync failed:', error);
      }
    }, this.config.syncInterval);
  }

  stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  destroy(): void {
    this.stopBackgroundSync();
  }
}