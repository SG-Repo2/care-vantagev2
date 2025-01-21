import { Platform } from 'react-native';
import AppleHealthKit, {
  HealthInputOptions,
  HealthValue,
} from 'react-native-health';
import { HealthMetrics, HealthProvider } from '../types';
import { permissions } from './permissions';
import { DateUtils } from '../../../../utils/DateUtils';
import { calculateHealthScore } from '../../../../utils/HealthScoring';

export class AppleHealthProvider implements HealthProvider {
  private initialized = false;

  async initialize(): Promise<void> {
    if (Platform.OS !== 'ios') {
      throw new Error('AppleHealthProvider can only be used on iOS');
    }

    if (this.initialized) {
      console.log('[AppleHealthProvider] Already initialized');
      return;
    }

    return new Promise((resolve, reject) => {
      console.log('[AppleHealthProvider] Initializing HealthKit...');
      AppleHealthKit.initHealthKit(permissions, (error) => {
        if (error) {
          console.error('[AppleHealthProvider] HealthKit initialization error:', error);
          reject(new Error(`Failed to initialize HealthKit: ${error}`));
          return;
        }
        this.initialized = true;
        console.log('[AppleHealthProvider] HealthKit initialized successfully');
        resolve();
      });
    });
  }

  async requestPermissions(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    return Promise.resolve();
  }

  async checkPermissionsStatus(): Promise<boolean> {
    return new Promise((resolve) => {
      AppleHealthKit.isAvailable((error: Object, available: boolean) => {
        if (error) {
          console.error('[AppleHealthProvider] Availability check failed:', error);
          resolve(false);
          return;
        }

        if (!available) {
          console.log('[AppleHealthProvider] HealthKit is not available');
          resolve(false);
          return;
        }

        AppleHealthKit.initHealthKit(permissions, (initError: string) => {
          if (initError) {
            console.error('[AppleHealthProvider] Permission check failed:', initError);
            resolve(false);
            return;
          }
          resolve(true);
        });
      });
    });
  }

  async cleanup(): Promise<void> {
    this.initialized = false;
    console.log('[AppleHealthProvider] Cleanup complete');
    return Promise.resolve();
  }

  async getMetrics(): Promise<HealthMetrics> {
    if (!this.initialized) {
      await this.initialize();
    }

    const now = new Date();
    const startOfDay = DateUtils.getStartOfDay(now);

    const options: HealthInputOptions = {
      startDate: startOfDay.toISOString(),
      endDate: now.toISOString(),
      includeManuallyAdded: true,
    };

    try {
      console.log('[AppleHealthProvider] Fetching metrics...');
      const [steps, calories, distance, heart_rate] = await Promise.all([
        this.getSteps(options),
        this.getCalories(options),
        this.getDistance(options),
        this.getHeartRate(options),
      ]);

      console.log('[AppleHealthProvider] Metrics retrieved:', { steps, calories, distance, heart_rate });

      const metrics: HealthMetrics = {
        id: '', // This should be set by the service layer
        user_id: '', // This should be set by the service layer
        date: DateUtils.getLocalDateString(startOfDay),
        steps,
        calories,
        distance,
        heart_rate,
        last_updated: now.toISOString(),
        daily_score: calculateHealthScore({
          steps,
          distance,
          calories,
          heart_rate
        }).totalScore,
        weekly_score: null,
        streak_days: null,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };

      console.log('[AppleHealthProvider] Final metrics:', metrics);
      return metrics;
    } catch (error) {
      console.error('[AppleHealthProvider] Error fetching metrics:', error);
      throw error;
    }
  }

  private getSteps(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve) => {
      console.log('[AppleHealthProvider] Reading steps...');
      AppleHealthKit.getStepCount(
        options,
        (err: string, results: { value: number }) => {
          if (err) {
            console.error('[AppleHealthProvider] Error getting steps:', err);
            resolve(0);
            return;
          }
          const steps = Math.round(results.value || 0);
          console.log('[AppleHealthProvider] Steps:', steps);
          resolve(steps);
        }
      );
    });
  }

  private getDistance(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve) => {
      console.log('[AppleHealthProvider] Reading distance...');
      AppleHealthKit.getDistanceWalkingRunning(
        options,
        (err: string, results: { value: number }) => {
          if (err) {
            console.error('[AppleHealthProvider] Error getting distance:', err);
            resolve(0);
            return;
          }
          const kilometers = (results.value || 0) / 1000;
          const distance = Math.round(kilometers * 100) / 100;
          console.log('[AppleHealthProvider] Distance (km):', distance);
          resolve(distance);
        }
      );
    });
  }

  private getCalories(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve) => {
      console.log('[AppleHealthProvider] Reading calories...');
      AppleHealthKit.getActiveEnergyBurned(
        options,
        (err: string, results: HealthValue[]) => {
          if (err) {
            console.error('[AppleHealthProvider] Error getting calories:', err);
            resolve(0);
            return;
          }
          const totalCalories = results.reduce((sum, result) => sum + (result.value || 0), 0);
          const calories = Math.round(totalCalories);
          console.log('[AppleHealthProvider] Calories:', calories);
          resolve(calories);
        }
      );
    });
  }

  private getHeartRate(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve) => {
      console.log('[AppleHealthProvider] Reading heart rate...');
      AppleHealthKit.getHeartRateSamples(
        {
          ...options,
          ascending: true,
        },
        (err: string, results: Array<{ value: number }>) => {
          if (err) {
            console.error('[AppleHealthProvider] Error getting heart rate:', err);
            resolve(0);
            return;
          }

          // Filter valid heart rate samples
          const validSamples = results.filter(sample =>
            typeof sample.value === 'number' &&
            !isNaN(sample.value) &&
            sample.value > 0 &&
            sample.value < 300
          );

          if (!validSamples.length) {
            console.log('[AppleHealthProvider] No valid heart rate samples found');
            resolve(0);
            return;
          }

          // Calculate average heart rate
          const sum = validSamples.reduce((acc, sample) => acc + sample.value, 0);
          const average = sum / validSamples.length;
          const heartRate = Math.round(average);
          
          console.log('[AppleHealthProvider] Heart rate average:', heartRate, 'from', validSamples.length, 'samples');
          resolve(heartRate);
        }
      );
    });
  }
}