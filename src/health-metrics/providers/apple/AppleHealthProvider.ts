import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
} from 'react-native-health';
import { Platform } from 'react-native';
import { HealthMetrics, HealthProvider } from '../types';

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.FlightsClimbed,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
    ],
    write: [],
  },
};

export class AppleHealthProvider implements HealthProvider {
  private initialized = false;

  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    
    return new Promise((resolve) => {
      AppleHealthKit.isAvailable((error, available) => {
        resolve(!error && available);
      });
    });
  }

  async requestPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error) => {
        if (error) {
          resolve(false);
          return;
        }
        this.initialized = true;
        resolve(true);
      });
    });
  }

  async getMetrics(date: Date): Promise<HealthMetrics> {
    if (!this.initialized) {
      throw new Error('HealthKit not initialized');
    }

    const options: HealthInputOptions = {
      date: date.toISOString(),
      includeManuallyAdded: false,
    };

    const [steps, flights, distance] = await Promise.all([
      this.getSteps(options),
      this.getFlights(options),
      this.getDistance(options),
    ]);

    return {
      steps,
      flights,
      distance,
    };
  }

  private getSteps(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve, reject) => {
      AppleHealthKit.getStepCount(options, (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results.value);
      });
    });
  }

  private getFlights(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve, reject) => {
      AppleHealthKit.getFlightsClimbed(options, (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results.value);
      });
    });
  }

  private getDistance(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve, reject) => {
      AppleHealthKit.getDistanceWalkingRunning(options, (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results.value);
      });
    });
  }
} 