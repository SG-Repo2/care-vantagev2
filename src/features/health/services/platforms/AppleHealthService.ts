import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
} from 'react-native-health';
import { HealthServiceConfig } from '../types';
import { BaseHealthService } from '../base';

export class AppleHealthService extends BaseHealthService {
  protected source = 'apple_health' as const;

  protected async doInitialize(config: HealthServiceConfig): Promise<boolean> {
    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(config as HealthKitPermissions, (error: string) => {
        resolve(!error);
      });
    });
  }

  protected async doRequestPermissions(): Promise<boolean> {
    return true;
  }

  protected async doHasPermissions(): Promise<boolean> {
    return true;
  }

  async getDailySteps(date: Date = new Date()): Promise<number> {
    return new Promise((resolve, reject) => {
      const options: HealthInputOptions = {
        date: date.toISOString(),
      };
      
      AppleHealthKit.getStepCount(options, (err, results) => {
        if (err) reject(err);
        else resolve(results.value);
      });
    });
  }

  async getDailyDistance(date: Date = new Date()): Promise<number> {
    return new Promise((resolve, reject) => {
      const options: HealthInputOptions = {
        date: date.toISOString(),
      };
      
      AppleHealthKit.getDistanceWalkingRunning(options, (err, results) => {
        if (err) reject(err);
        else resolve(results.value / 1000); // Convert to kilometers
      });
    });
  }
}
