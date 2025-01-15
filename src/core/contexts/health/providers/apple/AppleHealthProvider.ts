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
  WeeklyMetrics
} from '../../types';
import { BaseHealthProvider } from '../../base/BaseHealthProvider';

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

export class AppleHealthProvider extends BaseHealthProvider {
  private readonly HEALTH_PERMISSION_KEY = '@health_permissions_granted';

  protected async initializeNative(): Promise<void> {
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

    // Only initialize HealthKit, don't request permissions yet
    return new Promise((resolve, reject) => {
      AppleHealthKit.initHealthKit(
        {
          permissions: {
            read: [],  // Empty permissions for initial setup
            write: []
          }
        },
        (error: string) => {
          if (error) {
            console.error('HealthKit initialization error:', error);
            reject(new Error('Failed to initialize HealthKit'));
            return;
          }
          resolve();
        }
      );
    });
  }

  protected async requestNativePermissions(): Promise<void> {
    if (!this.initialized) {
      throw new Error('HealthKit must be initialized before requesting permissions');
    }

    return new Promise((resolve, reject) => {
      console.log('Requesting HealthKit permissions...');
      
      AppleHealthKit.initHealthKit(HEALTHKIT_PERMISSIONS, async (error: string) => {
        if (error) {
          console.error('HealthKit permissions error:', error);
          await AsyncStorage.removeItem(this.HEALTH_PERMISSION_KEY);
          reject(new Error('Failed to get HealthKit permissions'));
          return;
        }

        try {
          // Verify permissions were actually granted
          const permissions = await this.verifyPermissions();
          if (!permissions) {
            throw new Error('HealthKit permissions were not granted');
          }

          await AsyncStorage.setItem(this.HEALTH_PERMISSION_KEY, 'granted');
          this.authorized = true;
          console.log('HealthKit permissions granted successfully');
          resolve();
        } catch (error) {
          console.error('HealthKit permissions verification failed:', error);
          await AsyncStorage.removeItem(this.HEALTH_PERMISSION_KEY);
          reject(error);
        }
      });
    });
  }

  private async verifyPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      AppleHealthKit.getAuthStatus(HEALTHKIT_PERMISSIONS, (err: string, result: any) => {
        if (err) {
          console.error('Failed to get auth status:', err);
          resolve(false);
          return;
        }
        
        // Check if all required permissions are granted
        const requiredPermissions = HEALTHKIT_PERMISSIONS.permissions.read;
        const allGranted = requiredPermissions.every(permission =>
          result[permission] === 'authorized'
        );
        
        resolve(allGranted);
      });
    });
  }

  protected async fetchNativeMetrics(): Promise<HealthMetrics & WeeklyMetrics> {
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

    const weeklyData = await this.fetchNativeWeeklyData(
      weekStart.toISOString(),
      currentDate.toISOString()
    );

    return {
      steps,
      distance,
      calories,
      heartRate,
      lastUpdated: currentDate.toISOString(),
      score: 0, // Will be calculated in BaseHealthProvider
      ...weeklyData
    };
  }

  protected async fetchNativeWeeklyData(startDate: string, endDate: string): Promise<WeeklyMetrics> {
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
      score: 0 // Will be calculated in BaseHealthProvider
    };
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

}