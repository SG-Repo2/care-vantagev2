import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
} from 'react-native-health';
import { Platform, InteractionManager } from 'react-native';
import { HealthServiceConfig } from '../types';
import { BaseHealthService } from '../base';

const HEALTHKIT_PERMISSIONS = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.BodyMass,
      AppleHealthKit.Constants.Permissions.Height,
      AppleHealthKit.Constants.Permissions.BodyMassIndex,
    ],
    write: [],
  },
} as HealthKitPermissions;

export class AppleHealthService extends BaseHealthService {
  protected source = 'apple_health' as const;

  protected async doInitialize(config: HealthServiceConfig): Promise<boolean> {
    return new Promise((resolve) => {
      Platform.select({
        ios: () => {
          InteractionManager.runAfterInteractions(() => {
            AppleHealthKit.initHealthKit(HEALTHKIT_PERMISSIONS, (error: string) => {
              requestAnimationFrame(() => {
                if (!error) {
                  this.initialized = true;
                }
                resolve(!error);
              });
            });
          });
        },
        default: () => resolve(false),
      })();
    });
  }

  protected async doRequestPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        if (!this.initialized || Platform.OS !== 'ios') {
          resolve(false);
          return;
        }
        AppleHealthKit.initHealthKit(HEALTHKIT_PERMISSIONS, (error: string) => {
          requestAnimationFrame(() => {
            resolve(!error);
          });
        });
      });
    });
  }

  protected async doHasPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        if (!this.initialized || Platform.OS !== 'ios') {
          resolve(false);
          return;
        }
        AppleHealthKit.initHealthKit(HEALTHKIT_PERMISSIONS, (error: string) => {
          requestAnimationFrame(() => {
            resolve(!error);
          });
        });
      });
    });
  }

  async getDailySteps(date: Date = new Date()): Promise<number> {
    return new Promise((resolve, reject) => {
      const options: HealthInputOptions = {
        date: date.toISOString(),
        includeManuallyAdded: true,
      };
      
      InteractionManager.runAfterInteractions(() => {
        AppleHealthKit.getStepCount(options, (err: string, results: any) => {
          requestAnimationFrame(() => {
            if (err) {
              console.error('Error getting step count:', err);
              reject(err);
            } else {
              resolve(Math.round(results.value));
            }
          });
        });
      });
    });
  }

  async getDailyDistance(date: Date = new Date()): Promise<number> {
    return new Promise((resolve, reject) => {
      const options: HealthInputOptions = {
        date: date.toISOString(),
        includeManuallyAdded: true,
      };
      
      InteractionManager.runAfterInteractions(() => {
        AppleHealthKit.getDistanceWalkingRunning(options, (err: string, results: any) => {
          requestAnimationFrame(() => {
            if (err) {
              console.error('Error getting distance:', err);
              reject(err);
            } else {
              const kilometers = results.value / 1000;
              resolve(Math.round(kilometers * 100) / 100);
            }
          });
        });
      });
    });
  }

  async getDailyHeartRate(date: Date = new Date()): Promise<number> {
    return new Promise((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        // Placeholder implementation
        resolve(70);
      });
    });
  }

  async getDailyCalories(date: Date = new Date()): Promise<number> {
    return new Promise((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        // Placeholder implementation
        resolve(2000);
      });
    });
  }
}
