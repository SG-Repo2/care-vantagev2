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
    try {
      if (Platform.OS !== 'android') {
        console.log('Not an Android device, Health Connect not available');
        return false;
      }
      
      console.log('Initializing Health Connect...');
      const available = await initialize();
      this.initialized = available;
      console.log('Health Connect initialization result:', available);
      return available;
    } catch (error) {
      console.error('Error checking Health Connect availability:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      console.log('Requesting Health Connect permissions...');
      await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'Distance' },
        { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      ]);
      this.initialized = true;
      console.log('Health Connect permissions granted');
      return true;
    } catch (error) {
      console.error('Failed to request Health Connect permissions:', error);
      return false;
    }
  }

  async getMetrics(date: Date): Promise<HealthMetrics> {
    try {
      if (!this.initialized) {
        console.log('Attempting to initialize Health Connect...');
        const available = await this.isAvailable();
        if (!available) {
          throw new Error('Health Connect not available');
        }
        const permissions = await this.requestPermissions();
        if (!permissions) {
          throw new Error('Health Connect permissions not granted');
        }
      }

      // Create new Date objects to avoid mutating the input date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const timeRangeFilter: TimeRangeFilter = {
        operator: 'between',
        startTime: startOfDay.toISOString(),
        endTime: endOfDay.toISOString(),
      };

      console.log('Fetching metrics for timeRange:', timeRangeFilter);

      const [steps, distance, calories] = await Promise.all([
        this.getSteps(timeRangeFilter),
        this.getDistance(timeRangeFilter),
        this.getCalories(timeRangeFilter),
      ]);

      console.log('Fetched metrics:', { steps, distance, calories });

      return {
        steps,
        distance,
        calories,
        heartRate: undefined, // Google Health Connect doesn't support real-time heart rate
      };
    } catch (error) {
      console.error('Error fetching Health Connect metrics:', error);
      throw error;
    }
  }

  private async getSteps(timeRangeFilter: TimeRangeFilter): Promise<number> {
    try {
      console.log('Reading steps data...');
      const records = await readRecords('Steps', { timeRangeFilter });
      const stepsArray = (records as RecordsResponse<StepsRecord>).records;
      const total = stepsArray.reduce((sum: number, cur: StepsRecord) => sum + cur.count, 0);
      console.log('Steps data:', { count: stepsArray.length, total });
      return total;
    } catch (error) {
      console.error('Error reading steps:', error);
      return 0;
    }
  }

  private async getDistance(timeRangeFilter: TimeRangeFilter): Promise<number> {
    try {
      console.log('Reading distance data...');
      const records = await readRecords('Distance', { timeRangeFilter });
      const distanceArray = (records as RecordsResponse<DistanceRecord>).records;
      const totalMeters = distanceArray.reduce((sum: number, cur: DistanceRecord) => 
        sum + cur.distance.inMeters, 0);
      const totalKm = totalMeters / 1000;
      console.log('Distance data:', { count: distanceArray.length, totalKm });
      return totalKm;
    } catch (error) {
      console.error('Error reading distance:', error);
      return 0;
    }
  }

  private async getCalories(timeRangeFilter: TimeRangeFilter): Promise<number> {
    try {
      console.log('Reading calories data...');
      const records = await readRecords('ActiveCaloriesBurned', { timeRangeFilter });
      const caloriesArray = (records as RecordsResponse<CaloriesRecord>).records;
      const total = caloriesArray.reduce((sum: number, cur: CaloriesRecord) => 
        sum + cur.energy.inKilocalories, 0);
      console.log('Calories data:', { count: caloriesArray.length, total });
      return Math.round(total);
    } catch (error) {
      console.error('Error reading calories:', error);
      return 0;
    }
  }
}