import { Platform } from 'react-native';
import {
  initialize,
  requestPermission,
  readRecords,
  ReadRecordsOptions
} from 'react-native-health-connect';
import type { 
  HealthMetrics, 
  HealthProvider, 
  WeeklyMetrics,
  HealthError
} from '../../types';

export class GoogleHealthProvider implements HealthProvider {
  private authorized = false;

  async initialize(): Promise<void> {
    if (Platform.OS !== 'android') {
      throw new Error('GoogleHealthProvider can only be used on Android');
    }
    
    try {
      const isInitialized = await initialize();
      if (!isInitialized) {
        throw new Error('Health Connect is not available');
      }
      await this.requestPermissions();
    } catch (error) {
      const healthError: HealthError = {
        type: 'initialization',
        message: 'Failed to initialize Health Connect',
        details: error
      };
      throw healthError;
    }
  }

  async requestPermissions(): Promise<void> {
    try {
      await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'Distance' },
        { accessType: 'read', recordType: 'HeartRate' },
        { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
        { accessType: 'read', recordType: 'TotalCaloriesBurned' }
      ]);
      this.authorized = true;

      if (!this.authorized) {
        throw new Error('Health permissions not granted');
      }
    } catch (error) {
      this.authorized = false;
      const healthError: HealthError = {
        type: 'permissions',
        message: 'Failed to get Health Connect permissions',
        details: error
      };
      throw healthError;
    }
  }

  async hasPermissions(): Promise<boolean> {
    try {
      try {
        await requestPermission([
          { accessType: 'read', recordType: 'Steps' },
          { accessType: 'read', recordType: 'Distance' },
          { accessType: 'read', recordType: 'HeartRate' },
          { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
          { accessType: 'read', recordType: 'TotalCaloriesBurned' }
        ]);
        this.authorized = true;
        return true;
      } catch {
        this.authorized = false;
        return false;
      }
      return this.authorized;
    } catch (error) {
      return false;
    }
  }

  async getMetrics(): Promise<HealthMetrics & WeeklyMetrics> {
    try {
      if (!this.authorized) {
        throw {
          type: 'permissions' as const,
          message: 'Not authorized to access Health Connect data'
        };
      }

      const currentDate = new Date();
      const startOfDay = new Date(currentDate);
      startOfDay.setHours(0, 0, 0, 0);

      const options: ReadRecordsOptions = {
        timeRangeFilter: {
          operator: 'between',
          startTime: startOfDay.toISOString(),
          endTime: currentDate.toISOString()
        }
      };

      const [steps, distance, calories, heartRate] = await Promise.all([
        readRecords('Steps', options),
        readRecords('Distance', options),
        readRecords('ActiveCaloriesBurned', options),
        readRecords('HeartRate', options)
      ]);

      const weeklyData = await this.getWeeklyData(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        currentDate.toISOString()
      );

      const stepsTotal = steps.records.reduce((sum: number, record: any) => 
        sum + (record as any).count, 0);
      const distanceTotal = distance.records.reduce((sum: number, record: any) => 
        sum + (record as any).distance.inMeters, 0);
      const caloriesTotal = calories.records.reduce((sum: number, record: any) => 
        sum + (record as any).energy.inKilocalories, 0);
      const latestHeartRate = heartRate.records.length > 0 ? 
        (heartRate.records[heartRate.records.length - 1] as any).samples[0].beatsPerMinute : 0;

      return {
        steps: stepsTotal,
        distance: distanceTotal,
        calories: caloriesTotal,
        heartRate: latestHeartRate,
        lastUpdated: currentDate.toISOString(),
        score: this.calculateHealthScore({
          steps: stepsTotal,
          distance: distanceTotal,
          calories: caloriesTotal,
          heartRate: latestHeartRate
        }),
        ...weeklyData
      };
    } catch (error) {
      const healthError: HealthError = {
        type: 'data',
        message: 'Failed to fetch health metrics',
        details: error
      };
      throw healthError;
    }
  }

  async getWeeklyData(startDate: string, endDate: string): Promise<WeeklyMetrics> {
    try {
      if (!this.authorized) {
        throw {
          type: 'permissions' as const,
          message: 'Not authorized to access Health Connect data'
        };
      }

      const options: ReadRecordsOptions = {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate,
          endTime: endDate
        }
      };

      const [weeklySteps, weeklyDistance, weeklyCalories, weeklyHeartRate] = await Promise.all([
        readRecords('Steps', options),
        readRecords('Distance', options),
        readRecords('ActiveCaloriesBurned', options),
        readRecords('HeartRate', options)
      ]);

      const weeklyStepsTotal = weeklySteps.records.reduce((sum: number, record: any) => 
        sum + (record as any).count, 0);
      const weeklyDistanceTotal = weeklyDistance.records.reduce((sum: number, record: any) => 
        sum + (record as any).distance.inMeters, 0);
      const weeklyCaloriesTotal = weeklyCalories.records.reduce((sum: number, record: any) => 
        sum + (record as any).energy.inKilocalories, 0);
      const weeklyHeartRateAvg = weeklyHeartRate.records.length > 0 ? 
        weeklyHeartRate.records.reduce((sum: number, record: any) => {
          const samples = (record as any).samples;
          const recordAvg = samples.reduce((s: number, sample: any) => 
            s + sample.beatsPerMinute, 0) / samples.length;
          return sum + recordAvg;
        }, 0) / weeklyHeartRate.records.length : 0;

      const metrics = {
        weeklySteps: weeklyStepsTotal,
        weeklyDistance: weeklyDistanceTotal,
        weeklyCalories: weeklyCaloriesTotal,
        weeklyHeartRate: weeklyHeartRateAvg,
        startDate,
        endDate,
        score: this.calculateHealthScore({
          steps: weeklyStepsTotal,
          distance: weeklyDistanceTotal,
          calories: weeklyCaloriesTotal,
          heartRate: weeklyHeartRateAvg
        })
      };

      return metrics;
    } catch (error) {
      const healthError: HealthError = {
        type: 'data',
        message: 'Failed to fetch weekly health data',
        details: error
      };
      throw healthError;
    }
  }

  async sync(): Promise<void> {
    try {
      if (!this.authorized) {
        throw {
          type: 'permissions' as const,
          message: 'Not authorized to access Health Connect data'
        };
      }

      // Health Connect automatically syncs data, no manual sync needed
      return Promise.resolve();
    } catch (error) {
      const healthError: HealthError = {
        type: 'data',
        message: 'Failed to sync health data',
        details: error
      };
      throw healthError;
    }
  }

  private calculateHealthScore(metrics: {
    steps: number;
    distance: number;
    calories: number;
    heartRate: number;
  }): number {
    // Basic scoring algorithm
    const stepsScore = Math.min(metrics.steps / 10000, 1) * 25;
    const distanceScore = Math.min(metrics.distance / 8000, 1) * 25;
    const caloriesScore = Math.min(metrics.calories / 500, 1) * 25;
    const heartRateScore = metrics.heartRate > 60 && metrics.heartRate < 100 ? 25 : 
      metrics.heartRate > 40 && metrics.heartRate < 120 ? 15 : 0;

    return Math.round(stepsScore + distanceScore + caloriesScore + heartRateScore);
  }
}
