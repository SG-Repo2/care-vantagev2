import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
  HealthUnit,
  HealthInputOptions
} from 'react-native-health';
import type { 
  HealthMetrics, 
  HealthProvider, 
  WeeklyMetrics,
  HealthError
} from '../../types';

const HEALTHKIT_PERMISSIONS = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.HeartRateVariability,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
    ],
    write: [],
  },
} as HealthKitPermissions;



export class AppleHealthProvider implements HealthProvider {
  private authorized = false;
  private initialized = false;
  private readonly HEALTH_PERMISSION_KEY = '@health_permissions_granted';

  async initialize(): Promise<void> {
    if (Platform.OS !== 'ios') {
      throw new Error('AppleHealthProvider can only be used on iOS');
    }

    // Check for stored permission state
    try {
      const storedPermissions = await AsyncStorage.getItem(this.HEALTH_PERMISSION_KEY);
      if (storedPermissions === 'granted') {
        this.authorized = true;
      }
    } catch (error) {
      console.warn('Failed to retrieve stored health permissions:', error);
    }

    return new Promise((resolve, reject) => {
      AppleHealthKit.initHealthKit(HEALTHKIT_PERMISSIONS, (error: string) => {
        if (error) {
          this.initialized = false;
          reject(new Error('Failed to initialize HealthKit'));
          return;
        }
        this.initialized = true;
        this.requestPermissions()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  async requestPermissions(): Promise<void> {
    if (!this.initialized || Platform.OS !== 'ios') {
      throw new Error('HealthKit not initialized');
    }

    return new Promise((resolve, reject) => {
      AppleHealthKit.initHealthKit(HEALTHKIT_PERMISSIONS, async (error: string) => {
        if (error) {
          this.authorized = false;
          await AsyncStorage.removeItem(this.HEALTH_PERMISSION_KEY);
          const healthError: HealthError = {
            type: 'permissions',
            message: 'Failed to get HealthKit permissions',
            details: error
          };
          reject(healthError);
          return;
        }
        this.authorized = true;
        // Store permission state
        try {
          await AsyncStorage.setItem(this.HEALTH_PERMISSION_KEY, 'granted');
        } catch (error) {
          console.warn('Failed to store health permissions:', error);
        }
        resolve();
      });
    });
  }

  async hasPermissions(): Promise<boolean> {
    return this.authorized;
  }

  async getMetrics(): Promise<HealthMetrics & WeeklyMetrics> {
    try {
      if (!this.authorized || !this.initialized) {
        throw {
          type: 'permissions' as const,
          message: 'Not authorized to access HealthKit data'
        };
      }

      const currentDate = new Date();
      const startDate = new Date(currentDate);
      startDate.setHours(0, 0, 0, 0);

      const options = {
        startDate: startDate.toISOString(),
        endDate: currentDate.toISOString(),
        ascending: false,
        limit: 24 // Get samples for the day
      };

      const [steps, distance, calories, heartRate] = await Promise.all([
        this.getSteps(options),
        this.getDistance(options),
        this.getCalories(options),
        this.getHeartRate(options)
      ]);

      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - 7);

      const metrics: HealthMetrics & WeeklyMetrics = {
        steps,
        distance,
        calories,
        heartRate,
        lastUpdated: currentDate.toISOString(),
        score: this.calculateHealthScore(steps, distance, calories, heartRate),
        
        weeklySteps: 0,
        weeklyDistance: 0,
        weeklyCalories: 0,
        weeklyHeartRate: 0,
        startDate: weekStart.toISOString(),
        endDate: currentDate.toISOString()
      };

      // Get weekly data
      const weeklyData = await this.getWeeklyData(
        weekStart.toISOString(),
        currentDate.toISOString()
      );
      
      return { ...metrics, ...weeklyData };
    } catch (error) {
      const healthError: HealthError = {
        type: 'data',
        message: 'Failed to fetch health metrics',
        details: error
      };
      throw healthError;
    }
  }

  private async getSteps(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve) => {
      AppleHealthKit.getStepCount(
        options,
        (err: string, results: { value: number; startDate: string; endDate: string }) => {
          if (err) {
            console.error('Error getting step count:', err);
            resolve(0);
            return;
          }
          resolve(Math.round(results.value || 0));
        }
      );
    });
  }

  private async getDistance(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve) => {
      AppleHealthKit.getDistanceWalkingRunning(
        options,
        (err: string, results: { value: number; startDate: string; endDate: string }) => {
          if (err) {
            console.error('Error getting distance:', err);
            resolve(0);
            return;
          }
          const kilometers = (results.value || 0) / 1000;
          resolve(Math.round(kilometers * 100) / 100);
        }
      );
    });
  }

  private async getCalories(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve) => {
      AppleHealthKit.getActiveEnergyBurned(
        options,
        (err: string, results: HealthValue[]) => {
          if (err) {
            console.error('Error getting calories:', err);
            resolve(0);
            return;
          }
          // Sum up all values from the array
          const totalCalories = results.reduce((sum, result) => sum + (result.value || 0), 0);
          resolve(Math.round(totalCalories));
        }
      );
    });
  }
  private async getHeartRate(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve) => {
      const hrOptions: HealthInputOptions = {
        ...options,
        unit: HealthUnit.bpm,
        ascending: false,
        limit: 12, // Get last 12 samples for better average
      };
      
      AppleHealthKit.getHeartRateSamples(
        hrOptions,
        (err: string, results: Array<{ value: number; startDate: string; endDate: string }>) => {
          if (err) {
            console.error('Error getting heart rate:', err);
            resolve(0);
            return;
          }
          
          if (!results || !results.length) {
            resolve(0);
            return;
          }

          // Filter out any invalid values before calculating average
          const validResults = results.filter(result => 
            typeof result?.value === 'number' && 
            !isNaN(result.value) && 
            result.value > 0 && 
            result.value < 300 // Maximum reasonable heart rate
          );

          if (!validResults.length) {
            resolve(0);
            return;
          }

          const sum = validResults.reduce((acc, curr) => acc + curr.value, 0);
          resolve(Math.round(sum / validResults.length));
        }
      );
    });
  }

  private calculateHealthScore(steps: number, distance: number, calories: number, heartRate: number): number {
    // Simple scoring algorithm - can be made more sophisticated
    const stepScore = Math.min(steps / 10000, 1) * 25;
    const distanceScore = Math.min(distance / 5, 1) * 25;
    const calorieScore = Math.min(calories / 500, 1) * 25;
    const heartScore = heartRate > 0 ? 25 : 0;
    
    return Math.round(stepScore + distanceScore + calorieScore + heartScore);
  }

  async getWeeklyData(startDate: string, endDate: string): Promise<WeeklyMetrics> {
    try {
      if (!this.authorized || !this.initialized) {
        throw {
          type: 'permissions' as const,
          message: 'Not authorized to access HealthKit data'
        };
      }

      const options: HealthInputOptions = {
        startDate,
        endDate,
        ascending: false
      };

      const heartRateOptions: HealthInputOptions = {
        ...options,
        unit: HealthUnit.bpm,
        ascending: false,
        limit: 84 // 12 samples per day for 7 days
      };

      const [steps, distance, calories, heartRate] = await Promise.all([
        this.getSteps(options),
        this.getDistance(options),
        this.getCalories(options),
        this.getHeartRate(heartRateOptions)
      ]);

      return {
        weeklySteps: steps,
        weeklyDistance: distance,
        weeklyCalories: calories,
        weeklyHeartRate: heartRate,
        startDate,
        endDate,
        score: this.calculateHealthScore(steps/7, distance/7, calories/7, heartRate)
      };
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
      // Don't throw if not authorized, just skip sync
      if (!this.authorized || !this.initialized) {
        console.warn('Health permissions not granted, skipping sync');
        return;
      }

      try {
        // Attempt to refresh permissions and fetch latest data
        await this.requestPermissions();
        await this.getMetrics();
      } catch (error) {
        // Log but don't throw to prevent blocking cleanup
        console.warn('Health sync failed:', error);
      }
    } catch (error) {
      // Log but don't throw to prevent blocking cleanup
      console.warn('Health sync error:', error);
    }
  }
}
