import { Platform } from 'react-native';
import {
  initialize,
  requestPermission,
  readRecords,
  type Permission,
  type WriteExerciseRoutePermission,
} from 'react-native-health-connect';
import { HealthMetrics, WeeklyMetrics, HealthProvider } from '../../types';

const PERMISSIONS: (Permission | WriteExerciseRoutePermission)[] = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'TotalCaloriesBurned' },
];

export class GoogleHealthProvider implements HealthProvider {
  private initialized: boolean = false;

  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.warn('GoogleHealthProvider is only available on Android');
      return false;
    }

    if (this.initialized) {
      return true;
    }

    try {
      await initialize();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Health Connect:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const grantedPermissions = await requestPermission(PERMISSIONS);
      return grantedPermissions.length === PERMISSIONS.length;
    } catch (error) {
      console.error('Failed to request Health Connect permissions:', error);
      return false;
    }
  }

  async hasPermissions(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const grantedPermissions = await requestPermission(PERMISSIONS);
      return grantedPermissions.length === PERMISSIONS.length;
    } catch (error) {
      console.error('Failed to check Health Connect permissions:', error);
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
      const metrics = await this.getDailyMetrics(startOfDay, now);
      return {
        ...metrics,
        timestamp: now.toISOString()
      };
    } catch (error) {
      console.error('Failed to get Health Connect metrics:', error);
      throw error;
    }
  }

  async getWeeklyData(startDate: string, endDate: string): Promise<WeeklyMetrics> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const start = new Date(startDate);
      const weeklySteps: number[] = [];
      const weeklyDistance: number[] = [];
      const current = new Date(start);

      // Collect 7 days of data
      for (let i = 0; i < 7; i++) {
        const dayEnd = new Date(current);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dailyMetrics = await this.getDailyMetrics(current, dayEnd);
        weeklySteps.push(dailyMetrics.steps);
        weeklyDistance.push(dailyMetrics.distance);
        
        current.setDate(current.getDate() + 1);
      }

      return {
        weeklySteps,
        weeklyDistance,
        startDate,
        endDate
      };
    } catch (error) {
      console.error('Failed to get weekly Health Connect data:', error);
      throw error;
    }
  }

  async sync(): Promise<void> {
    // Health Connect automatically syncs with the system
    // This method is implemented for interface compatibility
    return Promise.resolve();
  }

  private async getDailyMetrics(startTime: Date, endTime: Date): Promise<HealthMetrics> {
    try {
      if (!(await this.hasPermissions())) {
        return { steps: 0, distance: 0, heartRate: 0, calories: 0 };
      }

      const timeRangeFilter = {
        operator: 'between' as const,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };

      const [stepsResponse, distanceResponse, heartRateResponse, activeCaloriesResponse, totalCaloriesResponse] = await Promise.all([
        readRecords('Steps', { timeRangeFilter }),
        readRecords('Distance', { timeRangeFilter }),
        readRecords('HeartRate', { timeRangeFilter }),
        readRecords('ActiveCaloriesBurned', { timeRangeFilter }),
        readRecords('TotalCaloriesBurned', { timeRangeFilter }),
      ]);

      // Calculate total steps
      const steps = stepsResponse.records.reduce((total: number, record: any) => 
        total + (record.count || 0), 0);
      
      // Calculate total distance in kilometers
      const distance = distanceResponse.records.reduce((total: number, record: any) => 
        total + ((record.distance && record.distance.inMeters) || 0), 0) / 1000;
      
      // Calculate average heart rate
      const heartRates = heartRateResponse.records.map((record: any) => record.beatsPerMinute || 0);
      const heartRate = heartRates.length 
        ? Math.round(heartRates.reduce((sum, rate) => sum + rate, 0) / heartRates.length)
        : 0;
      
      // Calculate total calories
      const activeCalories = activeCaloriesResponse.records.reduce(
        (total: number, record: any) => 
          total + ((record.energy && record.energy.inKilocalories) || 0), 
        0
      );
      
      const totalCalories = totalCaloriesResponse.records.reduce(
        (total: number, record: any) => 
          total + ((record.energy && record.energy.inKilocalories) || 0), 
        0
      );
      
      const calories = Math.round(activeCalories + totalCalories);

      return { steps, distance, heartRate, calories };
    } catch (error) {
      console.error('Failed to get daily metrics:', error);
      return { steps: 0, distance: 0, heartRate: 0, calories: 0 };
    }
  }
}