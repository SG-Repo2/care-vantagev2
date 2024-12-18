import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
  HealthValue,
} from 'react-native-health';
import { HealthMetrics } from '../../profile/types/health';
import { HealthService } from './HealthService';

const { Permissions } = AppleHealthKit.Constants;

export class AppleHealthService implements HealthService {
  private initialized: boolean = false;

  private readonly permissions: HealthKitPermissions = {
    permissions: {
      read: [
        Permissions.Steps,
        Permissions.FlightsClimbed,
        Permissions.DistanceWalkingRunning,
        Permissions.HeartRate,
        Permissions.BloodPressureDiastolic,
        Permissions.BloodPressureSystolic,
        Permissions.SleepAnalysis,
      ],
      write: [],
    },
  };

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      await AppleHealthKit.initHealthKit(this.permissions);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize HealthKit:', error);
      return false;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async checkPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      AppleHealthKit.isAvailable((error: string, result: boolean) => {
        if (error) {
          console.error('HealthKit is not available:', error);
          resolve(false);
          return;
        }
        resolve(result);
      });
    });
  }

  async requestPermissions(): Promise<boolean> {
    try {
      await AppleHealthKit.initHealthKit(this.permissions);
      return true;
    } catch (error) {
      console.error('Failed to request HealthKit permissions:', error);
      return false;
    }
  }

  async fetchHealthData(date: string): Promise<HealthMetrics> {
    if (!this.initialized) {
      throw new Error('HealthKit is not initialized');
    }

    const options: HealthInputOptions = {
      date,
    };

    const [steps, flights, distance, heartRate, bloodPressure, sleep] = await Promise.all([
      this.getSteps(options),
      this.getFlightsClimbed(options),
      this.getDistance(options),
      this.getHeartRate(options),
      this.getBloodPressure(options),
      this.getSleep(options),
    ]);

    return {
      steps,
      flights,
      distance,
      heartRate,
      bloodPressure,
      sleep,
    };
  }

  private getSteps(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve) => {
      AppleHealthKit.getStepCount(options, (err: string, results: HealthValue) => {
        if (err) {
          console.error('Error getting steps:', err);
          resolve(0);
          return;
        }
        resolve(results.value);
      });
    });
  }

  private getFlightsClimbed(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve) => {
      AppleHealthKit.getFlightsClimbed(options, (err: string, results: HealthValue) => {
        if (err) {
          console.error('Error getting flights climbed:', err);
          resolve(0);
          return;
        }
        resolve(results.value);
      });
    });
  }

  private getDistance(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve) => {
      AppleHealthKit.getDistanceWalkingRunning(options, (err: string, results: HealthValue) => {
        if (err) {
          console.error('Error getting distance:', err);
          resolve(0);
          return;
        }
        resolve(results.value);
      });
    });
  }

  private getHeartRate(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve) => {
      AppleHealthKit.getHeartRateSamples(options, (err: string, results: HealthValue[]) => {
        if (err || !results.length) {
          console.error('Error getting heart rate:', err);
          resolve(0);
          return;
        }
        resolve(results[results.length - 1].value);
      });
    });
  }

  private getBloodPressure(options: HealthInputOptions): Promise<{ systolic: number; diastolic: number }> {
    return new Promise((resolve) => {
      AppleHealthKit.getBloodPressureSamples(options, (err: string, results: any[]) => {
        if (err || !results.length) {
          console.error('Error getting blood pressure:', err);
          resolve({ systolic: 0, diastolic: 0 });
          return;
        }
        const latest = results[results.length - 1];
        resolve({
          systolic: latest.bloodPressureSystolicValue,
          diastolic: latest.bloodPressureDiastolicValue,
        });
      });
    });
  }

  private getSleep(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve) => {
      AppleHealthKit.getSleepSamples(options, (err: string, results: any[]) => {
        if (err || !results.length) {
          console.error('Error getting sleep:', err);
          resolve(0);
          return;
        }
        const totalSleep = results.reduce((acc, curr) => {
          const start = new Date(curr.startDate).getTime();
          const end = new Date(curr.endDate).getTime();
          return acc + (end - start);
        }, 0);
        resolve(Math.round(totalSleep / (1000 * 60 * 60))); // Convert to hours
      });
    });
  }
}
