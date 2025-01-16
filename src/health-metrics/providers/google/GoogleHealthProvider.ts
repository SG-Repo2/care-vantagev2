import { Platform } from 'react-native';
import {
  initialize,
  requestPermission,
  readRecords,
} from 'react-native-health-connect';
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

interface HeartRateRecord {
  samples: Array<{
    beatsPerMinute: number;
  }>;
}

export class GoogleHealthProvider implements HealthProvider {
  private initialized = false;

  async initialize(): Promise<void> {
    try {
      if (Platform.OS !== 'android') {
        throw new Error('GoogleHealthProvider can only be used on Android');
      }

      if (this.initialized) {
        console.log('[GoogleHealthProvider] Already initialized');
        return;
      }

      console.log('[GoogleHealthProvider] Initializing Health Connect...');
      const available = await initialize();
      
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
        await this.initialize();
      }

      console.log('[GoogleHealthProvider] Requesting permissions...');
      await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'Distance' },
        { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
        { accessType: 'read', recordType: 'HeartRate' },
      ]);
      
      // Verify permissions with a test read
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
        readRecords('HeartRate', { timeRangeFilter: testRange }),
      ]);
      
      console.log('[GoogleHealthProvider] Permissions granted and verified');
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
      
      const timeRangeFilter = {
        operator: 'between' as const,
        startTime: startOfDay.toISOString(),
        endTime: now.toISOString(),
      };

      console.log('[GoogleHealthProvider] Fetching metrics for:', timeRangeFilter);

      const [steps, distance, calories, heartRate] = await Promise.all([
        this.getSteps(timeRangeFilter),
        this.getDistance(timeRangeFilter),
        this.getCalories(timeRangeFilter),
        this.getHeartRate(timeRangeFilter),
      ]);

      console.log('[GoogleHealthProvider] Metrics retrieved:', {
        steps,
        distance,
        calories,
        heartRate,
      });

      return {
        steps,
        distance,
        calories,
        heartRate,
        lastUpdated: now.toISOString(),
        score: 0,
      };
    } catch (error) {
      console.error('[GoogleHealthProvider] Error fetching metrics:', error);
      throw error;
    }
  }

  private async getSteps(timeRangeFilter: any): Promise<number> {
    try {
      console.log('[GoogleHealthProvider] Reading steps...');
      const response = await readRecords('Steps', { timeRangeFilter });
      const records = response.records as StepsRecord[];
      const total = records.reduce((sum, record) => sum + (record.count || 0), 0);
      console.log('[GoogleHealthProvider] Steps total:', total);
      return Math.round(total);
    } catch (error) {
      console.error('[GoogleHealthProvider] Error reading steps:', error);
      return 0;
    }
  }

  private async getDistance(timeRangeFilter: any): Promise<number> {
    try {
      console.log('[GoogleHealthProvider] Reading distance...');
      const response = await readRecords('Distance', { timeRangeFilter });
      const records = response.records as DistanceRecord[];
      const totalMeters = records.reduce((sum, record) => 
        sum + (record.distance?.inMeters || 0), 0);
      const kilometers = totalMeters / 1000;
      console.log('[GoogleHealthProvider] Distance total (km):', kilometers);
      return Math.round(kilometers * 100) / 100;
    } catch (error) {
      console.error('[GoogleHealthProvider] Error reading distance:', error);
      return 0;
    }
  }

  private async getCalories(timeRangeFilter: any): Promise<number> {
    try {
      console.log('[GoogleHealthProvider] Reading calories...');
      const response = await readRecords('ActiveCaloriesBurned', { timeRangeFilter });
      const records = response.records as CaloriesRecord[];
      const total = records.reduce((sum, record) => 
        sum + (record.energy?.inKilocalories || 0), 0);
      console.log('[GoogleHealthProvider] Calories total:', total);
      return Math.round(total);
    } catch (error) {
      console.error('[GoogleHealthProvider] Error reading calories:', error);
      return 0;
    }
  }

  private async getHeartRate(timeRangeFilter: any): Promise<number> {
    try {
      console.log('[GoogleHealthProvider] Reading heart rate...');
      const response = await readRecords('HeartRate', { timeRangeFilter });
      const records = response.records as HeartRateRecord[];
      
      if (!records || !records.length) {
        return 0;
      }

      // Get all valid heart rate samples
      const validSamples = records.flatMap(record => 
        record.samples.filter(sample => 
          typeof sample.beatsPerMinute === 'number' &&
          !isNaN(sample.beatsPerMinute) &&
          sample.beatsPerMinute > 0 &&
          sample.beatsPerMinute < 300
        )
      );

      if (!validSamples.length) {
        return 0;
      }

      // Calculate average heart rate
      const sum = validSamples.reduce((acc, sample) => acc + sample.beatsPerMinute, 0);
      const average = sum / validSamples.length;
      
      console.log('[GoogleHealthProvider] Heart rate average:', average);
      return Math.round(average);
    } catch (error) {
      console.error('[GoogleHealthProvider] Error reading heart rate:', error);
      return 0;
    }
  }
}