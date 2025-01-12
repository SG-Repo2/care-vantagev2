import { Platform, NativeModules, InteractionManager } from 'react-native';
import { HealthServiceConfig } from '../types';
import { BaseHealthService } from '../base';
import NativeHealthConnectModule from '../NativeHealthConnect';

export class GoogleHealthService extends BaseHealthService {
  protected source = 'health_connect' as const;
  protected config: HealthServiceConfig | null = null;

  protected async doInitialize(config: HealthServiceConfig): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      this.config = config;
      const isAvailable = await NativeHealthConnectModule.isAvailable();
      if (!isAvailable) {
        console.warn('Health Connect is not available on this device');
        return false;
      }

      // Request permissions during initialization
      const hasPermissions = await this.doRequestPermissions();
      if (!hasPermissions) {
        console.warn('Health Connect permissions not granted');
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

      // First check if we already have permissions
      const hasPermissions = await NativeHealthConnectModule.hasPermissions(permissions);
      if (hasPermissions) {
        return true;
      }

      // If not, request them
      const result = await NativeHealthConnectModule.requestPermissions(permissions);
      if (!result) {
        console.warn('Failed to get Health Connect permissions');
        return false;
      }

      // Verify permissions were granted
      return await NativeHealthConnectModule.hasPermissions(permissions);
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
      return await NativeHealthConnectModule.hasPermissions(permissions);
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
      // Verify permissions before reading data
      const hasPermissions = await this.hasPermissions();
      if (!hasPermissions) {
        console.warn('Missing required permissions for reading steps');
        return 0;
      }

      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);

      const steps = await NativeHealthConnectModule.getDailySteps(
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
      // Verify permissions before reading data
      const hasPermissions = await this.hasPermissions();
      if (!hasPermissions) {
        console.warn('Missing required permissions for reading distance');
        return 0;
      }

      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);

      const distance = await NativeHealthConnectModule.getDailyDistance(
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
    if (Platform.OS !== 'android' || !this.initialized) {
      return 0;
    }

    try {
      // Verify permissions before reading data
      const hasPermissions = await this.hasPermissions();
      if (!hasPermissions) {
        console.warn('Missing required permissions for reading heart rate');
        return 0;
      }

      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);

      const heartRate = await NativeHealthConnectModule.getDailyHeartRate(
        startTime.toISOString(),
        endTime.toISOString()
      );
      return heartRate;
    } catch (error) {
      console.error('Failed to get heart rate from Health Connect:', error);
      return 0;
    }
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
