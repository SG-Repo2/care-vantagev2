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
      AppleHealthKit.Constants.Permissions.HeartRate,
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
        console.log('HealthKit availability:', { error, available });
        resolve(!error && available);
      });
    });
  }

  async requestPermissions(): Promise<boolean> {
    console.log('Requesting HealthKit permissions...');
    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error) => {
        if (error) {
          console.error('HealthKit permission error:', error);
          resolve(false);
          return;
        }
        console.log('HealthKit permissions granted');
        this.initialized = true;
        resolve(true);
      });
    });
  }

  async getMetrics(date: Date): Promise<HealthMetrics> {
    if (!this.initialized) {
      console.error('HealthKit not initialized');
      throw new Error('HealthKit not initialized');
    }

    console.log('Fetching HealthKit metrics for date:', date.toISOString());

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const options: HealthInputOptions = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      includeManuallyAdded: true,
    };

    try {
      const [steps, flights, distance, heartRate] = await Promise.all([
        this.getSteps(options),
        this.getFlights(options),
        this.getDistance(options),
        this.getHeartRate(options),
      ]);

      const metrics = {
        steps,
        flights,
        distance,
        heartRate,
      };

      console.log('Retrieved HealthKit metrics:', metrics);
      return metrics;
    } catch (error) {
      console.error('Error fetching HealthKit metrics:', error);
      throw error;
    }
  }

  private getSteps(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve, reject) => {
      AppleHealthKit.getStepCount(options, (error, results) => {
        if (error) {
          console.error('Error getting steps:', error);
          reject(error);
          return;
        }
        console.log('Steps data:', results);
        resolve(results?.value || 0);
      });
    });
  }

  private getFlights(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve, reject) => {
      AppleHealthKit.getFlightsClimbed(options, (error, results) => {
        if (error) {
          console.error('Error getting flights:', error);
          reject(error);
          return;
        }
        console.log('Flights data:', results);
        resolve(results?.value || 0);
      });
    });
  }

  private getDistance(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve, reject) => {
      AppleHealthKit.getDistanceWalkingRunning(options, (error, results) => {
        if (error) {
          console.error('Error getting distance:', error);
          reject(error);
          return;
        }
        console.log('Distance data:', results);
        resolve(results?.value || 0);
      });
    });
  }

  private getHeartRate(options: HealthInputOptions): Promise<number | undefined> {
    return new Promise((resolve) => {
      AppleHealthKit.getHeartRateSamples(options, (error, results) => {
        if (error) {
          console.error('Error getting heart rate:', error);
          resolve(undefined);
          return;
        }
        console.log('Heart rate data:', results);
        if (!results?.length) {
          resolve(undefined);
          return;
        }
        // Get the most recent heart rate reading
        const latestReading = results[results.length - 1];
        resolve(latestReading.value);
      });
    });
  }
} 