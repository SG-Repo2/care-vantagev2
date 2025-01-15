import { Platform } from 'react-native';
import {
  initialize,
  requestPermission,
  readRecords,
  ReadRecordsOptions,
} from 'react-native-health-connect';
import { TimeRangeFilter } from 'react-native-health-connect/lib/typescript/types/base.types';
import { HealthMetrics, HealthProvider } from '../types';

interface StepsRecord {
  count: number;
}

interface DistanceRecord {
  distance: {
    inMeters: number;
  };
}

interface FloorsRecord {
  floors: number;
}

interface RecordsResponse<T> {
  records: T[];
}

export class GoogleHealthProvider implements HealthProvider {
  private initialized = false;

  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    return initialize();
  }

  async requestPermissions(): Promise<boolean> {
    try {
      await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'Distance' },
        { accessType: 'read', recordType: 'FloorsClimbed' },
      ]);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }

  async getMetrics(date: Date): Promise<HealthMetrics> {
    if (!this.initialized) {
      throw new Error('Health Connect not initialized');
    }

    const timeRangeFilter: TimeRangeFilter = {
      operator: 'between',
      startTime: new Date(date.setHours(0, 0, 0, 0)).toISOString(),
      endTime: new Date(date.setHours(23, 59, 59, 999)).toISOString(),
    };

    const [steps, distance, flights] = await Promise.all([
      this.getSteps(timeRangeFilter),
      this.getDistance(timeRangeFilter),
      this.getFlights(timeRangeFilter),
    ]);

    return {
      steps,
      distance,
      flights,
    };
  }

  private async getSteps(timeRangeFilter: TimeRangeFilter): Promise<number> {
    const records = await readRecords('Steps', { timeRangeFilter });
    const stepsArray = (records as RecordsResponse<StepsRecord>).records;
    return stepsArray.reduce((sum: number, cur: StepsRecord) => sum + cur.count, 0);
  }

  private async getDistance(timeRangeFilter: TimeRangeFilter): Promise<number> {
    const records = await readRecords('Distance', { timeRangeFilter });
    const distanceArray = (records as RecordsResponse<DistanceRecord>).records;
    return distanceArray.reduce((sum: number, cur: DistanceRecord) => sum + cur.distance.inMeters, 0);
  }

  private async getFlights(timeRangeFilter: TimeRangeFilter): Promise<number> {
    const records = await readRecords('FloorsClimbed', { timeRangeFilter });
    const floorsArray = (records as RecordsResponse<FloorsRecord>).records;
    return floorsArray.reduce((sum: number, cur: FloorsRecord) => sum + cur.floors, 0);
  }
} 