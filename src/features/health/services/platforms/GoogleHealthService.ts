import { Platform, NativeModules } from 'react-native';
import { HealthServiceConfig } from '../types';
import { BaseHealthService } from '../base';

const { NativeHealthConnect } = NativeModules;

export class GoogleHealthService extends BaseHealthService {
  protected source = 'health_connect' as const;
  protected config: HealthServiceConfig | null = null;

  protected async doInitialize(config: HealthServiceConfig): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    this.config = config;
    try {
      const isAvailable = await NativeHealthConnect.isAvailable();
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
      const permissions = (this.config.permissions?.read || []) as string[];
      const granted = await NativeHealthConnect.requestPermissions(permissions);
      return granted;
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
      const permissions = (this.config.permissions?.read || []) as string[];
      const hasPermissions = await NativeHealthConnect.hasPermissions(permissions);
      return hasPermissions;
    } catch (error) {
      console.error('Failed to check Health Connect permissions:', error);
      return false;
    }
  }

  async getDailySteps(date: Date = new Date()): Promise<number> {
    if (Platform.OS !== 'android') {
      return 0;
    }

    try {
      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);

      const steps = await NativeHealthConnect.getSteps(
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
    if (Platform.OS !== 'android') {
      return 0;
    }

    try {
      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);

      const distance = await NativeHealthConnect.getDistance(
        startTime.toISOString(),
        endTime.toISOString()
      );
      return distance / 1000; // Convert to kilometers
    } catch (error) {
      console.error('Failed to get distance from Health Connect:', error);
      return 0;
    }
  }
}
