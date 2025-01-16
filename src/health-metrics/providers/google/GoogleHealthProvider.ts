import { Platform } from 'react-native';
import {
  initialize,
  requestPermission,
  readRecords,
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
  private initializationAttempted = false;

  async initialize(): Promise<void> {
    try {
      if (Platform.OS !== 'android') {
        throw new Error('GoogleHealthProvider can only be used on Android');
      }

      if (this.initialized) {
        console.log('[GoogleHealthProvider] Already initialized');
        return;
      }

      if (this.initializationAttempted) {
        console.log('[GoogleHealthProvider] Retrying initialization...');
      }

      console.log('[GoogleHealthProvider] Initializing Health Connect...');
      const available = await initialize();
      this.initializationAttempted = true;
      
      if (!available) {
        throw new Error('Health Connect is not available');
      }

      console.log('[GoogleHealthProvider] Health Connect initialized successfully');
      this.initialized = true;
    } catch (error) {
      console.error('[GoogleHealthProvider] Initialization error:', error);
      throw error;
    }
  }

  async requestPermissions(): Promise<void> {
    try {
      if (!this.initialized) {
        console.log('[GoogleHealthProvider] Not initialized, attempting to initialize...');
        await this.initialize();
      }

      console.log('[GoogleHealthProvider] Requesting permissions...');
      const granted = await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'Distance' },
        { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
        { accessType: 'read', recordType: 'HeartRate' },
      ]);
      
      console.log('[GoogleHealthProvider] Permission request response:', granted);

      // Verify permissions by attempting to read data
      try {
        const now = new Date();
        const testRange = {
          operator: 'between' as const,
          startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          endTime: now.toISOString(),
        };
        
        await Promise.all([
          readRecords('Steps', { timeRangeFilter: testRange }),
          readRecords('Distance', { timeRangeFilter: testRange }),
          readRecords('ActiveCaloriesBurned', { timeRangeFilter: testRange }),
        ]);
        
        console.log('[GoogleHealthProvider] Successfully verified permissions');
      } catch (verifyError) {
        console.error('[GoogleHealthProvider] Permission verification failed:', verifyError);
        throw verifyError;
      }
    } catch (error) {
      console.error('[GoogleHealthProvider] Permission request failed:', error);
      throw error;
    }
  }

  async getMetrics(): Promise<HealthMetrics> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      
      const timeRangeFilter: TimeRangeFilter = {
        operator: 'between',
        startTime: startOfDay.toISOString(),
        endTime: now.toISOString(),
      };

      console.log('[GoogleHealthProvider] Fetching metrics for:', timeRangeFilter);

      const [steps, distance, calories] = await Promise.all([
        this.getSteps(timeRangeFilter),
        this.getDistance(timeRangeFilter),
        this.getCalories(timeRangeFilter),
      ]);

      console.log('[GoogleHealthProvider] Metrics retrieved:', { steps, distance, calories });

      return {
        steps,
        distance,
        calories,
        heartRate: 0,
        lastUpdated: now.toISOString(),
        score: 0,
      };
    } catch (error) {
      console.error('[GoogleHealthProvider] Error fetching metrics:', error);
      throw error;
    }
  }

  private async getSteps(timeRangeFilter: TimeRangeFilter): Promise<number> {
    try {
      console.log('[GoogleHealthProvider] Reading steps...');
      console.log('[GoogleHealthProvider] Time range:', timeRangeFilter);
      const records = await readRecords('Steps', { timeRangeFilter });
      console.log('[GoogleHealthProvider] Raw steps records:', JSON.stringify(records, null, 2));
      const stepsArray = (records as RecordsResponse<StepsRecord>).records;
      console.log('[GoogleHealthProvider] Steps array:', JSON.stringify(stepsArray, null, 2));
      const total = stepsArray.reduce((sum, cur) => sum + cur.count, 0);
      console.log('[GoogleHealthProvider] Steps total:', total);
      return total;
    } catch (error) {
      console.error('[GoogleHealthProvider] Error reading steps:', error);
      throw error;
    }
  }

  private async getDistance(timeRangeFilter: TimeRangeFilter): Promise<number> {
    try {
      console.log('[GoogleHealthProvider] Reading distance...');
      const records = await readRecords('Distance', { timeRangeFilter });
      const distanceArray = (records as RecordsResponse<DistanceRecord>).records;
      const totalMeters = distanceArray.reduce((sum, cur) => sum + cur.distance.inMeters, 0);
      const totalKm = totalMeters / 1000;
      console.log('[GoogleHealthProvider] Distance total (km):', totalKm);
      return totalKm;
    } catch (error) {
      console.error('[GoogleHealthProvider] Error reading distance:', error);
      throw error;
    }
  }

  private async getCalories(timeRangeFilter: TimeRangeFilter): Promise<number> {
    try {
      console.log('[GoogleHealthProvider] Reading calories...');
      const records = await readRecords('ActiveCaloriesBurned', { timeRangeFilter });
      const caloriesArray = (records as RecordsResponse<CaloriesRecord>).records;
      const total = caloriesArray.reduce((sum, cur) => sum + cur.energy.inKilocalories, 0);
      console.log('[GoogleHealthProvider] Calories total:', total);
      return Math.round(total);
    } catch (error) {
      console.error('[GoogleHealthProvider] Error reading calories:', error);
      throw error;
    }
  }
}