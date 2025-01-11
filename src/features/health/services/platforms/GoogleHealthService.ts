import { Platform, NativeModules, InteractionManager } from 'react-native';
import { HealthServiceConfig } from '../types';
import { BaseHealthService } from '../base';
import NativeHealthConnectModule from '../NativeHealthConnect';

export class GoogleHealthService extends BaseHealthService {
  protected source = 'health_connect' as const;
  protected config: HealthServiceConfig | null = null;

  protected async doInitialize(config: HealthServiceConfig): Promise<boolean> {
    return new Promise((resolve) => {
      if (Platform.OS !== 'android') {
        resolve(false);
        return;
      }

      InteractionManager.runAfterInteractions(async () => {
        try {
          this.config = config;
          const isAvailable = await NativeHealthConnectModule.isAvailable();
          if (!isAvailable) {
            console.warn('Health Connect is not available on this device');
            resolve(false);
            return;
          }
          resolve(true);
        } catch (error) {
          console.error('Failed to initialize Health Connect:', error);
          resolve(false);
        }
      });
    });
  }

  protected async doRequestPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      if (Platform.OS !== 'android' || !this.config) {
        resolve(false);
        return;
      }

      InteractionManager.runAfterInteractions(async () => {
        try {
          const permissions = [
            'android.permission.health.READ_STEPS',
            'android.permission.health.READ_DISTANCE',
            'android.permission.health.READ_HEART_RATE',
            'android.permission.health.READ_ACTIVE_CALORIES_BURNED'
          ];
          const result = await NativeHealthConnectModule.requestPermissions(permissions);
          resolve(result);
        } catch (error) {
          console.error('Failed to request Health Connect permissions:', error);
          resolve(false);
        }
      });
    });
  }

  protected async doHasPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      if (Platform.OS !== 'android' || !this.config) {
        resolve(false);
        return;
      }

      InteractionManager.runAfterInteractions(async () => {
        try {
          const permissions = [
            'android.permission.health.READ_STEPS',
            'android.permission.health.READ_DISTANCE',
            'android.permission.health.READ_HEART_RATE',
            'android.permission.health.READ_ACTIVE_CALORIES_BURNED'
          ];
          const result = await NativeHealthConnectModule.hasPermissions(permissions);
          resolve(result);
        } catch (error) {
          console.error('Failed to check Health Connect permissions:', error);
          resolve(false);
        }
      });
    });
  }

  async getDailySteps(date: Date = new Date()): Promise<number> {
    return new Promise((resolve) => {
      if (Platform.OS !== 'android' || !this.initialized) {
        resolve(0);
        return;
      }

      InteractionManager.runAfterInteractions(async () => {
        try {
          const startTime = new Date(date);
          startTime.setHours(0, 0, 0, 0);
          const endTime = new Date(date);
          endTime.setHours(23, 59, 59, 999);

          const steps = await NativeHealthConnectModule.getDailySteps(
            startTime.toISOString(),
            endTime.toISOString()
          );
          resolve(steps);
        } catch (error) {
          console.error('Failed to get steps from Health Connect:', error);
          resolve(0);
        }
      });
    });
  }

  async getDailyDistance(date: Date = new Date()): Promise<number> {
    return new Promise((resolve) => {
      if (Platform.OS !== 'android' || !this.initialized) {
        resolve(0);
        return;
      }

      InteractionManager.runAfterInteractions(async () => {
        try {
          const startTime = new Date(date);
          startTime.setHours(0, 0, 0, 0);
          const endTime = new Date(date);
          endTime.setHours(23, 59, 59, 999);

          const distance = await NativeHealthConnectModule.getDailyDistance(
            startTime.toISOString(),
            endTime.toISOString()
          );
          resolve(distance / 1000); // Convert meters to kilometers
        } catch (error) {
          console.error('Failed to get distance from Health Connect:', error);
          resolve(0);
        }
      });
    });
  }

  async getDailyHeartRate(date: Date = new Date()): Promise<number> {
    return new Promise((resolve) => {
      if (Platform.OS !== 'android' || !this.initialized) {
        resolve(0);
        return;
      }

      InteractionManager.runAfterInteractions(async () => {
        try {
          const startTime = new Date(date);
          startTime.setHours(0, 0, 0, 0);
          const endTime = new Date(date);
          endTime.setHours(23, 59, 59, 999);

          const heartRate = await NativeHealthConnectModule.getDailyHeartRate(
            startTime.toISOString(),
            endTime.toISOString()
          );
          resolve(heartRate);
        } catch (error) {
          console.error('Failed to get heart rate from Health Connect:', error);
          resolve(0);
        }
      });
    });
  }

  async getDailyCalories(date: Date = new Date()): Promise<number> {
    return new Promise((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        // Placeholder implementation - Health Connect calories to be implemented
        resolve(0);
      });
    });
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
