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
  private initializationPromise: Promise<void> | null = null;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // If initialization is already in progress, wait for it
    if (this.initializationPromise) {
      await this.initializationPromise;
      return;
    }

    // Start new initialization
    this.initializationPromise = this.performInitialization();
    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async performInitialization(): Promise<void> {
    if (Platform.OS !== 'android') {
      throw new Error('GoogleHealthProvider can only be used on Android');
    }

    console.log('[GoogleHealthProvider] Initializing Health Connect...');
    const available = await initialize();
    
    if (!available) {
      throw new Error('Health Connect is not available');
    }

    console.log('[GoogleHealthProvider] Health Connect initialized successfully');
    this.initialized = true;
  }

  async initialize(): Promise<void> {
    await this.ensureInitialized();
  }

  async requestPermissions(): Promise<void> {
    try {
      await this.ensureInitialized();

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
      await this.ensureInitialized();

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

      const metrics = {
        steps: Math.max(0, steps),
        distance: Math.max(0, distance),
        calories: Math.max(0, calories),
        heartRate: Math.max(0, heartRate),
        lastUpdated: now.toISOString(),
        score: this.calculateHealthScore(steps, distance, calories, heartRate),
      };

      console.log('[GoogleHealthProvider] Metrics retrieved:', metrics);
      return metrics;
    } catch (error) {
      console.error('[GoogleHealthProvider] Error fetching metrics:', error);
      throw error;
    }
  }

  private calculateHealthScore(steps: number, distance: number, calories: number, heartRate: number): number {
    // Basic health score calculation
    const stepsScore = Math.min(steps / 10000, 1); // Max score at 10000 steps
    const distanceScore = Math.min(distance / 5, 1); // Max score at 5km
    const caloriesScore = Math.min(calories / 500, 1); // Max score at 500 calories
    const heartRateScore = heartRate > 0 ? 1 : 0; // Score for having heart rate data

    // Calculate weighted average (adjust weights as needed)
    const totalScore = (
      (stepsScore * 0.4) + 
      (distanceScore * 0.3) + 
      (caloriesScore * 0.2) + 
      (heartRateScore * 0.1)
    ) * 100;

    return Math.round(totalScore);
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
      return Math.round(kilometers * 100) / 100; // Round to 2 decimal places
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