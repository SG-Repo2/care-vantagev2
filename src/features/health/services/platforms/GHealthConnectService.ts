import { HealthServiceConfig } from '../types';
import { BaseHealthService } from '../base';
import { Platform } from 'react-native';
import NativeHealthConnect from '../NativeHealthConnect';

export class GHealthConnectService extends BaseHealthService {
  protected source = 'health_connect' as const;

  protected async doInitialize(config: HealthServiceConfig): Promise<boolean> {
    if (Platform.OS !== 'android') return false;

    try {
      const availability = await NativeHealthConnect.isAvailable();
      if (!availability) {
        console.warn('Health Connect is not available on this device');
        return false;
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Health Connect initialization error:', error);
      return false;
    }
  }

  protected async doRequestPermissions(): Promise<boolean> {
    if (!this.initialized) return false;

    try {
      return await NativeHealthConnect.requestPermissions([
        'android.permission.health.READ_STEPS',
        'android.permission.health.READ_DISTANCE'
      ]);
    } catch (error) {
      console.error('Health Connect permission request error:', error);
      return false;
    }
  }

  protected async doHasPermissions(): Promise<boolean> {
    if (!this.initialized) return false;
    
    try {
      // For now just attempt to read steps as a permissions check
      const now = new Date();
      await this.getDailySteps(now);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getDailySteps(date: Date = new Date()): Promise<number> {
    if (!this.initialized) throw new Error('Health Connect not initialized');

    const startTime = new Date(date);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(23, 59, 59, 999);

    try {
      const steps = await NativeHealthConnect.getDailySteps(
        startTime.getTime(),
        endTime.getTime()
      );
      return steps || 0; // Return 0 if no data available
    } catch (error) {
      console.error('Error reading steps from Health Connect:', error);
      return 0; // Return 0 on error
    }
  }

  async getWeeklySteps(startDate: Date): Promise<number[]> {
    if (!this.initialized) throw new Error('Health Connect not initialized');

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

  async getDailyDistance(date: Date = new Date()): Promise<number> {
    if (!this.initialized) throw new Error('Health Connect not initialized');

    const startTime = new Date(date);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(23, 59, 59, 999);

    try {
      return await NativeHealthConnect.getDailyDistance(
        startTime.getTime(),
        endTime.getTime()
      );
    } catch (error) {
      console.error('Error reading distance from Health Connect:', error);
      throw error;
    }
  }
}
