import { Platform } from 'react-native';
import { HealthServiceConfig } from '../types';
import { BaseHealthService } from '../base';
import NativeHealthConnect from '../NativeHealthConnect';

export class GoogleHealthService extends BaseHealthService {
  protected source = 'health_connect' as const;
  protected config: HealthServiceConfig | null = null;

  protected async doInitialize(config: HealthServiceConfig): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      this.config = config;
      if (!(await NativeHealthConnect.isAvailable())) {
        console.warn('Health Connect not available');
        return false;
      }
      return (await this.doRequestPermissions()) || false;
    } catch (error) {
      console.error('Initialize failed:', error);
      return false;
    }
  }

  protected async doRequestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android' || !this.config) return false;
    try {
      return await NativeHealthConnect.requestPermissions();
    } catch (error) {
      console.error('Request permissions failed:', error);
      return false;
    }
  }

  protected async doHasPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android' || !this.config) return false;
    try {
      return await NativeHealthConnect.hasPermissions();
    } catch (error) {
      console.error('Check permissions failed:', error);
      return false;
    }
  }

  async getDailySteps(date: Date = new Date()): Promise<number> {
    if (Platform.OS !== 'android' || !this.initialized) return 0;
    try {
      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);
      const metrics = await NativeHealthConnect.getDailyMetrics({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
      return metrics.steps;
    } catch (error) {
      console.error('Get steps failed:', error);
      return 0;
    }
  }

  async getDailyDistance(date: Date = new Date()): Promise<number> {
    if (Platform.OS !== 'android' || !this.initialized) return 0;
    try {
      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);
      const metrics = await NativeHealthConnect.getDailyMetrics({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
      return metrics.distance / 1000; // Convert meters to kilometers
    } catch (error) {
      console.error('Get distance failed:', error);
      return 0;
    }
  }

  async getDailyHeartRate(date: Date = new Date()): Promise<number> {
    if (Platform.OS !== 'android' || !this.initialized) return 0;
    try {
      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);
      const metrics = await NativeHealthConnect.getDailyMetrics({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
      return metrics.heartRate;
    } catch (error) {
      console.error('Get heart rate failed:', error);
      return 0;
    }
  }

  async getDailyCalories(date: Date = new Date()): Promise<number> {
    if (Platform.OS !== 'android' || !this.initialized) return 0;
    try {
      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);
      const metrics = await NativeHealthConnect.getDailyMetrics({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
      return metrics.calories;
    } catch (error) {
      console.error('Get calories failed:', error);
      return 0;
    }
  }

  async getWeeklySteps(startDate: Date): Promise<number[]> {
    const results: number[] = [];
    const current = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      try {
        results.push(await this.getDailySteps(current));
      } catch {
        results.push(0);
      }
      current.setDate(current.getDate() + 1);
    }
    return results;
  }
}
