import { Platform } from 'react-native';
import {
  initialize,
  requestPermission,
  readRecords,
  ReadRecordsOptions,
} from 'react-native-health-connect';
import { TimeRangeFilter } from 'react-native-health-connect/lib/typescript/types/base.types';
import { HealthMetrics, HealthProvider } from '../types';

interface StepsRecord {
  count: number;
}

interface DistanceRecord {
  distance: {
    inMeters: number;
  };
}

interface CaloriesRecord {
  energy: {
    inKilocalories: number;
  };
}

interface RecordsResponse<T> {
  records: T[];
}

export class GoogleHealthProvider implements HealthProvider {
  private initialized = false;

  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    return initialize();
  }

  async requestPermissions(): Promise<boolean> {
    try {
      await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'Distance' },
        { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      ]);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }

  async getMetrics(date: Date): Promise<HealthMetrics> {
    if (!this.initialized) {
      throw new Error('Health Connect not initialized');
    }

    const timeRangeFilter: TimeRangeFilter = {
      operator: 'between',
      startTime: new Date(date.setHours(0, 0, 0, 0)).toISOString(),
      endTime: new Date(date.setHours(23, 59, 59, 999)).toISOString(),
    };

    const [steps, distance, calories] = await Promise.all([
      this.getSteps(timeRangeFilter),
      this.getDistance(timeRangeFilter),
      this.getCalories(timeRangeFilter),
    ]);

    return {
      steps,
      distance,
      calories,
      heartRate: undefined, // Google Health Connect doesn't support real-time heart rate
    };
  }

  private async getSteps(timeRangeFilter: TimeRangeFilter): Promise<number> {
    const records = await readRecords('Steps', { timeRangeFilter });
    const stepsArray = (records as RecordsResponse<StepsRecord>).records;
    return stepsArray.reduce((sum: number, cur: StepsRecord) => sum + cur.count, 0);
  }

  private async getDistance(timeRangeFilter: TimeRangeFilter): Promise<number> {
    const records = await readRecords('Distance', { timeRangeFilter });
    const distanceArray = (records as RecordsResponse<DistanceRecord>).records;
    return distanceArray.reduce((sum: number, cur: DistanceRecord) => sum + cur.distance.inMeters, 0);
  }

  private async getCalories(timeRangeFilter: TimeRangeFilter): Promise<number> {
    const records = await readRecords('ActiveCaloriesBurned', { timeRangeFilter });
    const caloriesArray = (records as RecordsResponse<CaloriesRecord>).records;
    return caloriesArray.reduce((sum: number, cur: CaloriesRecord) => 
      sum + cur.energy.inKilocalories, 0);
  }
} 