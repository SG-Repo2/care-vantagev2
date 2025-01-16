import { Platform } from 'react-native';
import AppleHealthKit, {
  HealthInputOptions,
  HealthValue,
  HealthKitPermissions,
} from 'react-native-health';
import { HealthMetrics, HealthProvider } from '../types';

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.HeartRate,
    ],
    write: [],
  },
};

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

    // HealthKit permissions are requested during initialization
    // This method exists to maintain interface compatibility
    return Promise.resolve();
  }

  async getMetrics(): Promise<HealthMetrics> {
    if (!this.initialized) {
      await this.initialize();
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const options: HealthInputOptions = {
      startDate: startOfDay.toISOString(),
      endDate: now.toISOString(),
      includeManuallyAdded: true,
    };

    try {
      console.log('[AppleHealthProvider] Fetching metrics...');
      const [steps, calories, distance, heartRate] = await Promise.all([
        this.getSteps(options),
        this.getCalories(options),
        this.getDistance(options),
        this.getHeartRate(options),
      ]);

      console.log('[AppleHealthProvider] Metrics retrieved:', { steps, calories, distance, heartRate });

      const metrics = {
        steps,
        calories,
        distance,
        heartRate,
        lastUpdated: now.toISOString(),
        score: this.calculateHealthScore(steps, distance, calories, heartRate),
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
}