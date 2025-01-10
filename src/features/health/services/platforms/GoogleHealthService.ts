import { Platform, NativeModules } from 'react-native';
import { HealthServiceConfig } from '../types';
import { BaseHealthService } from '../base';

const { HealthConnectModule } = NativeModules;

export class GoogleHealthService extends BaseHealthService {
  protected source = 'health_connect' as const;
  protected config: HealthServiceConfig | null = null;

  protected async doInitialize(config: HealthServiceConfig): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    this.config = config;
    try {
      const isAvailable = await HealthConnectModule.isAvailable();
      if (!isAvailable) {
        console.warn('Health Connect is not available on this device');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to initialize Health Connect:', error);
      return false;
    }
  }

  protected async doRequestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android' || !this.config) {
      return false;
    }

    try {
      const permissions = [
        'android.permission.health.READ_STEPS',
        'android.permission.health.READ_DISTANCE',
        'android.permission.health.READ_HEART_RATE',
        'android.permission.health.READ_ACTIVE_CALORIES_BURNED'
      ];
      return await HealthConnectModule.requestPermissions(permissions);
    } catch (error) {
      console.error('Failed to request Health Connect permissions:', error);
      return false;
    }
  }

  protected async doHasPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android' || !this.config) {
      return false;
    }

    try {
      const permissions = [
        'android.permission.health.READ_STEPS',
        'android.permission.health.READ_DISTANCE',
        'android.permission.health.READ_HEART_RATE',
        'android.permission.health.READ_ACTIVE_CALORIES_BURNED'
      ];
      return await HealthConnectModule.hasPermissions(permissions);
    } catch (error) {
      console.error('Failed to check Health Connect permissions:', error);
      return false;
    }
  }

  async getDailySteps(date: Date = new Date()): Promise<number> {
    if (Platform.OS !== 'android' || !this.initialized) {
      return 0;
    }

    try {
      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);

      const steps = await HealthConnectModule.getDailySteps(
        startTime.toISOString(),
        endTime.toISOString()
      );
      return steps;
    } catch (error) {
      console.error('Failed to get steps from Health Connect:', error);
      return 0;
    }
  }

  async getDailyDistance(date: Date = new Date()): Promise<number> {
    if (Platform.OS !== 'android' || !this.initialized) {
      return 0;
    }

    try {
      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);

      const distance = await HealthConnectModule.getDailyDistance(
        startTime.toISOString(),
        endTime.toISOString()
      );
      return distance / 1000; // Convert meters to kilometers
    } catch (error) {
      console.error('Failed to get distance from Health Connect:', error);
      return 0;
    }
  }

  async getDailyHeartRate(date: Date = new Date()): Promise<number> {
    // Placeholder implementation - Health Connect heart rate to be implemented
    return 0;
  }

  async getDailyCalories(date: Date = new Date()): Promise<number> {
    // Placeholder implementation - Health Connect calories to be implemented
    return 0;
  }

  async getWeeklySteps(startDate: Date): Promise<number[]> {
    const weeklySteps: number[] = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      try {
        const steps = await this.getDailySteps(currentDate);
        weeklySteps.push(steps);
      } catch (error) {
        console.error(`Error reading steps for ${currentDate.toISOString()}:`, error);
        weeklySteps.push(0);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return weeklySteps;
  }
}
