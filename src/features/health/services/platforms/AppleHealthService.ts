import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
} from 'react-native-health';
import { Platform, InteractionManager } from 'react-native';
import { HealthServiceConfig } from '../types';
import { BaseHealthService } from '../base';

export class AppleHealthService extends BaseHealthService {
  protected source = 'apple_health' as const;

  protected async doInitialize(config: HealthServiceConfig): Promise<boolean> {
    return new Promise((resolve) => {
      // Ensure initialization happens on main thread
      Platform.select({
        ios: () => {
          InteractionManager.runAfterInteractions(() => {
            AppleHealthKit.initHealthKit(config as HealthKitPermissions, (error: string) => {
              // Ensure callback executes on main thread
              requestAnimationFrame(() => {
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
        resolve(true);
      });
    });
  }

  protected async doHasPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        resolve(true);
      });
    });
  }

  async getDailySteps(date: Date = new Date()): Promise<number> {
    return new Promise((resolve, reject) => {
      const options: HealthInputOptions = {
        date: date.toISOString(),
      };
      
      InteractionManager.runAfterInteractions(() => {
        AppleHealthKit.getStepCount(options, (err, results) => {
          requestAnimationFrame(() => {
            if (err) reject(err);
            else resolve(results.value);
          });
        });
      });
    });
  }

  async getDailyDistance(date: Date = new Date()): Promise<number> {
    return new Promise((resolve, reject) => {
      const options: HealthInputOptions = {
        date: date.toISOString(),
      };
      
      InteractionManager.runAfterInteractions(() => {
        AppleHealthKit.getDistanceWalkingRunning(options, (err, results) => {
          requestAnimationFrame(() => {
            if (err) reject(err);
            else resolve(results.value / 1000); // Convert to kilometers
          });
        });
      });
    });
  }
}