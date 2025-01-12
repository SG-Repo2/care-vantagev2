import { NativeModules, Platform } from 'react-native';
import { HealthMetrics, WeeklyMetrics, HealthProvider } from '../../types';

const { HealthKit } = NativeModules;

export class AppleHealthProvider implements HealthProvider {
  private initialized: boolean = false;
  private readonly healthMetrics = [
    'Steps',
    'DistanceWalkingRunning',
    'HeartRate',
    'ActiveEnergyBurned'
  ];

  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.warn('AppleHealthProvider is only available on iOS');
      return false;
    }

    if (this.initialized) {
      return true;
    }

    try {
      const available = await HealthKit.isHealthDataAvailable();
      if (!available) {
        console.error('HealthKit is not available on this device');
        return false;
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize HealthKit:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const granted = await HealthKit.requestAuthorization(this.healthMetrics);
      return granted === true;
    } catch (error) {
      console.error('Failed to request HealthKit permissions:', error);
      return false;
    }
  }

  async hasPermissions(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const permissions = await HealthKit.checkAuthorization(this.healthMetrics);
      return permissions === true;
    } catch (error) {
      console.error('Failed to check HealthKit permissions:', error);
      return false;
    }
  }

  async getMetrics(): Promise<HealthMetrics> {
    if (!this.initialized) {
      await this.initialize();
    }

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    try {
      const [steps, distance, heartRate, calories] = await Promise.all([
        HealthKit.getSteps(startOfDay, now),
        HealthKit.getDistance(startOfDay, now),
        HealthKit.getHeartRate(startOfDay, now),
        HealthKit.getActiveEnergy(startOfDay, now)
      ]);

      return {
        steps: steps || 0,
        distance: distance || 0,
        heartRate: heartRate || 0,
        calories: calories || 0,
        timestamp: now.toISOString()
      };
    } catch (error) {
      console.error('Failed to get HealthKit metrics:', error);
      throw error;
    }
  }

  async getWeeklyData(startDate: string, endDate: string): Promise<WeeklyMetrics> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const [weeklySteps, weeklyDistance] = await Promise.all([
        HealthKit.getDailySteps(start, end),
        HealthKit.getDailyDistance(start, end)
      ]);

      return {
        weeklySteps: weeklySteps || Array(7).fill(0),
        weeklyDistance: weeklyDistance || Array(7).fill(0),
        startDate,
        endDate
      };
    } catch (error) {
      console.error('Failed to get HealthKit weekly data:', error);
      throw error;
    }
  }

  async sync(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Force a refresh of the HealthKit data
      await HealthKit.syncData();
    } catch (error) {
      console.error('Failed to sync HealthKit data:', error);
      throw error;
    }
  }
}