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

// Health Connect API types
interface HeartRateSample {
  beatsPerMinute: number;
  time: string;
}

interface HeartRateRecord {
  samples: HeartRateSample[];
  startTime: string;
  endTime: string;
}

interface HealthConnectRecord<T> {
  records: T[];
}

type ReadRecordsResult<T extends string> = {
  records: Array<any>;
};

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
    if (!this.authorized) {
      const error: HealthError = {
        type: 'permissions',
        message: 'Not authorized to access Health Connect data'
      };
      throw error;
    }

    try {
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

      const [stepsData, distanceData, caloriesData, heartRateData] = await Promise.all([
        readRecords('Steps', options),
        readRecords('Distance', options),
        readRecords('ActiveCaloriesBurned', options),
        readRecords('HeartRate', options)
      ]) as [
        ReadRecordsResult<'Steps'>,
        ReadRecordsResult<'Distance'>,
        ReadRecordsResult<'ActiveCaloriesBurned'>,
        ReadRecordsResult<'HeartRate'>
      ];

      // Validate records exist for each metric
      if (!stepsData?.records || !distanceData?.records || !caloriesData?.records) {
        const error: HealthError = {
          type: 'data',
          message: 'Invalid or missing health records',
          details: 'One or more required metrics returned invalid data'
        };
        throw error;
      }

      const stepsTotal = stepsData.records.reduce((sum: number, record: any) => 
        sum + (record?.count || 0), 0);
      const distanceTotal = distanceData.records.reduce((sum: number, record: any) => 
        sum + (record?.distance?.inMeters || 0), 0);
      const caloriesTotal = caloriesData.records.reduce((sum: number, record: any) => 
        sum + (record?.energy?.inKilocalories || 0), 0);

      // Get latest valid heart rate with proper error handling
      const latestHeartRate = (() => {
        if (!heartRateData?.records || !Array.isArray(heartRateData.records)) {
          return 0;
        }
      
        for (let i = heartRateData.records.length - 1; i >= 0; i--) {
          const record = heartRateData.records[i] as any;
          if (!record) continue;
      
          // Try to get BPM from samples array
          if (Array.isArray(record.samples) && record.samples.length > 0) {
            const sample = record.samples[0];
            const bpm = sample?.beatsPerMinute;
            if (typeof bpm === 'number' && !isNaN(bpm) && bpm > 0 && bpm < 300) {
              return Math.round(bpm);
            }
          }
      
          // No need for fallback as the value array is the only way to access heart rate data
        }
        return 0;
      })();

      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - 7);

      const weeklyData = await this.getWeeklyData(
        weekStart.toISOString(),
        currentDate.toISOString()
      );

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
      ]) as [
        ReadRecordsResult<'Steps'>,
        ReadRecordsResult<'Distance'>,
        ReadRecordsResult<'ActiveCaloriesBurned'>,
        ReadRecordsResult<'HeartRate'>
      ];

      // Validate weekly records exist
      if (!weeklySteps?.records || !weeklyDistance?.records || !weeklyCalories?.records) {
        const error: HealthError = {
          type: 'data',
          message: 'Invalid or missing weekly health records',
          details: 'One or more required weekly metrics returned invalid data'
        };
        throw error;
      }

      const weeklyStepsTotal = weeklySteps.records.reduce((sum: number, record: any) => 
        sum + (record?.count || 0), 0);
      const weeklyDistanceTotal = weeklyDistance.records.reduce((sum: number, record: any) => 
        sum + (record?.distance?.inMeters || 0), 0);
      const weeklyCaloriesTotal = weeklyCalories.records.reduce((sum: number, record: any) => 
        sum + (record?.energy?.inKilocalories || 0), 0);
      // Calculate weekly heart rate average with proper error handling
      const weeklyHeartRateAvg = (() => {
        if (!weeklyHeartRate?.records || !Array.isArray(weeklyHeartRate.records)) {
          return 0;
        }

        let validReadings = 0;
        let totalBpm = 0;

        for (const record of weeklyHeartRate.records) {
          if (!record) continue;

          // Get BPM from samples array
          if (Array.isArray(record.samples) && record.samples.length > 0) {
            for (const sample of record.samples) {
              const bpm = sample?.beatsPerMinute;
              if (typeof bpm === 'number' && !isNaN(bpm) && bpm > 0 && bpm < 300) {
                totalBpm += bpm;
                validReadings++;
              }
            }
          }
        }

        return validReadings > 0 ? Math.round(totalBpm / validReadings) : 0;
      })();

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
