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

// Match the entitlements from app.config.js
const HEALTHKIT_PERMISSIONS = {
  permissions: {
    read: [
      'StepCount',
      'HeartRate',
      'ActiveEnergyBurned',
      'DistanceWalkingRunning'
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

    // Initialize HealthKit with all required permissions
    return new Promise((resolve, reject) => {
      console.log('Initializing HealthKit with permissions:', JSON.stringify(HEALTHKIT_PERMISSIONS, null, 2));
      
      AppleHealthKit.initHealthKit(HEALTHKIT_PERMISSIONS, async (error: string) => {
        if (error) {
          console.error('HealthKit initialization error:', error);
          reject(new Error(`Failed to initialize HealthKit: ${error}`));
          return;
        }
        
        try {
          // Verify permissions were granted
          const permissions = await this.verifyPermissions();
          if (!permissions) {
            reject(new Error('HealthKit permissions were not granted'));
            return;
          }

          await AsyncStorage.setItem(this.HEALTH_PERMISSION_KEY, 'granted');
          this.authorized = true;
          console.log('HealthKit initialized and permissions granted successfully');
          resolve();
        } catch (error) {
          console.error('HealthKit permissions verification failed:', error);
          await AsyncStorage.removeItem(this.HEALTH_PERMISSION_KEY);
          reject(error);
        }
      });
    });
  }

  protected async requestNativePermissions(): Promise<void> {
    if (!this.initialized) {
      throw new Error('HealthKit must be initialized before requesting permissions');
    }

    // Permissions are now requested during initialization
    const permissions = await this.verifyPermissions();
    if (!permissions) {
      throw new Error('HealthKit permissions were not granted');
    }
  }

  private async verifyPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      AppleHealthKit.getAuthStatus(HEALTHKIT_PERMISSIONS, (err: string, result: any) => {
        if (err) {
          console.error('Failed to get auth status:', err);
          resolve(false);
          return;
        }
        
        // The result.permissions.read array contains 1 for granted and 0 for denied
        const readPermissions = result.permissions?.read || [];
        const allGranted = readPermissions.every((status: number) => status === 1);
        
        console.log('HealthKit auth status:', JSON.stringify({
          readPermissions,
          allGranted,
          result
        }, null, 2));
        
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