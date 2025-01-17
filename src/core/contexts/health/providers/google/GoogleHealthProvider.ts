import { Platform } from 'react-native';
import {
  initialize,
  requestPermission,
  readRecords,
  ReadRecordsOptions
} from 'react-native-health-connect';
import type {
  HealthMetrics,
  WeeklyMetrics
} from '../../types';
import { BaseHealthProvider } from '../../base/BaseHealthProvider';

export class GoogleHealthProvider extends BaseHealthProvider {
  protected async initializeNative(): Promise<void> {
    if (Platform.OS !== 'android') {
      throw new Error('GoogleHealthProvider can only be used on Android');
    }
    
    const isInitialized = await initialize();
    if (!isInitialized) {
      throw new Error('Health Connect is not available');
    }
  }

  protected async requestNativePermissions(): Promise<void> {
    await requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'Distance' },
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      { accessType: 'read', recordType: 'TotalCaloriesBurned' }
    ]);
  }

  protected async fetchNativeMetrics(): Promise<HealthMetrics & WeeklyMetrics> {
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

    const weeklyData = await this.fetchNativeWeeklyData(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      currentDate.toISOString()
    );

    const stepsTotal = this.sumSteps(steps.records);
    const distanceTotal = this.sumDistance(distance.records);
    const caloriesTotal = this.sumCalories(calories.records);
    const latestHeartRate = this.getLatestValidHeartRate(heartRate.records);

    return {
      steps: stepsTotal,
      distance: distanceTotal,
      calories: caloriesTotal,
      heartRate: latestHeartRate,
      lastUpdated: currentDate.toISOString(),
      score: 0, // Will be calculated in BaseHealthProvider
      ...weeklyData
    };
  }

  protected async fetchNativeWeeklyData(startDate: string, endDate: string): Promise<WeeklyMetrics> {
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

    const weeklyStepsTotal = this.sumSteps(weeklySteps.records);
    const weeklyDistanceTotal = this.sumDistance(weeklyDistance.records);
    const weeklyCaloriesTotal = this.sumCalories(weeklyCalories.records);
    const weeklyHeartRateAvg = this.calculateAverageHeartRate(weeklyHeartRate.records);

    return {
      weeklySteps: weeklyStepsTotal,
      weeklyDistance: weeklyDistanceTotal,
      weeklyCalories: weeklyCaloriesTotal,
      weeklyHeartRate: weeklyHeartRateAvg,
      startDate,
      endDate,
      score: 0 // Will be calculated in BaseHealthProvider
    };
  }

  private sumSteps(records: any[]): number {
    return records.reduce((sum: number, record: any) => 
      sum + (record.count || 0), 0);
  }

  private sumDistance(records: any[]): number {
    return records.reduce((sum: number, record: any) => 
      sum + ((record.distance?.inMeters || 0) / 1000), 0);
  }

  private sumCalories(records: any[]): number {
    return records.reduce((sum: number, record: any) => 
      sum + (record.energy?.inKilocalories || 0), 0);
  }

  private getLatestValidHeartRate(records: any[]): number {
    if (!records || !records.length) return 0;
    
    for (let i = records.length - 1; i >= 0; i--) {
      const record = records[i];
      // Handle both possible data structures
      const bpm = record.samples?.[0]?.beatsPerMinute || record.beatsPerMinute || record.bpm;
      if (typeof bpm === 'number' && !isNaN(bpm) && bpm > 0 && bpm < 300) {
        return Math.round(bpm);
      }
    }
    return 0;
  }

  private calculateAverageHeartRate(records: any[]): number {
    if (!records || !records.length) return 0;
    
    let validReadings = 0;
    const sum = records.reduce((total: number, record: any) => {
      if (!record?.samples?.length) return total;
      
      const samples = record.samples || [record];
      const validSamples = samples.filter((sample: any) => {
        const bpm = sample.beatsPerMinute || sample.bpm;
        return typeof bpm === 'number' && !isNaN(bpm) && bpm > 0 && bpm < 300;
      });
      
      if (!validSamples.length) return total;
      
      validReadings += validSamples.length;
      return total + validSamples.reduce((s: number, sample: any) => 
        s + (sample.beatsPerMinute || sample.bpm), 0);
    }, 0);
    
    return validReadings > 0 ? Math.round(sum / validReadings) : 0;
  }

}