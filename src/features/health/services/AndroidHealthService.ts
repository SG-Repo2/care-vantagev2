import { Platform } from 'react-native';
import HealthConnect, {
  Permission,
  StepsRecord,
  DistanceRecord,
  HeartRateRecord,
  BloodPressureRecord,
  SleepSessionRecord,
} from 'react-native-health-connect';
import { HealthMetrics } from '../../profile/types/health';
import { HealthService } from './HealthService';

export class AndroidHealthService implements HealthService {
  private initialized: boolean = false;
  private healthConnect: HealthConnect;

  private readonly PERMISSIONS: Permission[] = [
    'read_steps',
    'read_distance',
    'read_heart_rate',
    'read_blood_pressure',
    'read_sleep',
    'read_exercise'
  ];

  constructor() {
    if (Platform.OS !== 'android') {
      throw new Error('AndroidHealthService can only be used on Android devices');
    }
    this.healthConnect = new HealthConnect();
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Check if Health Connect is available
      const isAvailable = await this.healthConnect.isAvailable();
      if (!isAvailable) {
        console.error('Health Connect is not available on this device');
        return false;
      }

      // Request permissions
      const granted = await this.requestPermissions();
      if (!granted) {
        console.error('Health Connect permissions not granted');
        return false;
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Health Connect:', error);
      return false;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const grantedPermissions = await this.healthConnect.getGrantedPermissions();
      return this.PERMISSIONS.every(permission => 
        grantedPermissions.includes(permission)
      );
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      await this.healthConnect.requestPermissions(this.PERMISSIONS);
      return this.checkPermissions();
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }

  async fetchHealthData(date: string): Promise<HealthMetrics> {
    if (!this.initialized) {
      throw new Error('Health Connect is not initialized');
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const timeRangeFilter: TimeRangeFilter = {
      operator: 'between',
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    };

    const [steps, distance, heartRate, bloodPressure, sleep] = await Promise.all([
      this.getSteps(timeRangeFilter),
      this.getDistance(timeRangeFilter),
      this.getHeartRate(timeRangeFilter),
      this.getBloodPressure(timeRangeFilter),
      this.getSleep(timeRangeFilter),
    ]);

    return {
      id: `metrics_${Date.now()}`,
      date: new Date(date),
      steps,
      flights: 0, // Health Connect doesn't track flights climbed
      distance,
      heartRate,
      bloodPressure,
      sleep,
      source: 'health_connect' as DataSource,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async getSteps(timeRangeFilter: TimeRangeFilter): Promise<number> {
    try {
      const request: ReadRecordsRequest = {
        recordType: 'Steps',
        timeRangeFilter,
      };
      
      const records = await this.healthConnect.readRecords(request);
      return records.reduce((total: number, record: StepsRecord) => 
        total + record.count, 0);
    } catch (error) {
      console.error('Error getting steps:', error);
      return 0;
    }
  }

  private async getDistance(timeRangeFilter: TimeRangeFilter): Promise<number> {
    try {
      const request: ReadRecordsRequest = {
        recordType: 'Distance',
        timeRangeFilter,
      };
      
      const records = await this.healthConnect.readRecords(request);
      return records.reduce((total: number, record: DistanceRecord) => 
        total + record.distance.inMeters, 0);
    } catch (error) {
      console.error('Error getting distance:', error);
      return 0;
    }
  }

  private async getHeartRate(timeRangeFilter: TimeRangeFilter): Promise<number> {
    try {
      const request: ReadRecordsRequest = {
        recordType: 'HeartRate',
        timeRangeFilter,
      };
      
      const records = await this.healthConnect.readRecords(request);
      if (!records.length) return 0;
      
      const sum = records.reduce((total: number, record: HeartRateRecord) => 
        total + record.beatsPerMinute, 0);
      return Math.round(sum / records.length);
    } catch (error) {
      console.error('Error getting heart rate:', error);
      return 0;
    }
  }

  private async getBloodPressure(timeRangeFilter: TimeRangeFilter): Promise<{ systolic: number; diastolic: number }> {
    try {
      const request: ReadRecordsRequest = {
        recordType: 'BloodPressure',
        timeRangeFilter,
      };
      
      const records = await this.healthConnect.readRecords(request);
      if (!records.length) return { systolic: 0, diastolic: 0 };
      
      const latest = records[records.length - 1] as BloodPressureRecord;
      return {
        systolic: latest.systolic.inMillimetersOfMercury,
        diastolic: latest.diastolic.inMillimetersOfMercury,
      };
    } catch (error) {
      console.error('Error getting blood pressure:', error);
      return { systolic: 0, diastolic: 0 };
    }
  }

  private async getSleep(timeRangeFilter: TimeRangeFilter): Promise<{ startTime: Date; endTime: Date; quality: string }> {
    try {
      const request: ReadRecordsRequest = {
        recordType: 'SleepSession',
        timeRangeFilter,
      };
      
      const records = await this.healthConnect.readRecords(request);
      if (!records.length) {
        return { 
          startTime: new Date(), 
          endTime: new Date(), 
          quality: 'POOR' 
        };
      }
      
      const sleepSessions = records as SleepSessionRecord[];
      const totalSleep = sleepSessions.reduce((total, session) => {
        const start = new Date(session.startTime).getTime();
        const end = new Date(session.endTime).getTime();
        return total + (end - start);
      }, 0);
      
      const sleepQuality = this.getSleepQuality(totalSleep);
      const firstSession = sleepSessions[0];
      
      return {
        startTime: new Date(firstSession.startTime),
        endTime: new Date(firstSession.endTime),
        quality: sleepQuality,
      };
    } catch (error) {
      console.error('Error getting sleep:', error);
      return { 
        startTime: new Date(), 
        endTime: new Date(), 
        quality: 'POOR' 
      };
    }
  }

  private getSleepQuality(sleepDuration: number): string {
    if (sleepDuration > 7 * 60 * 60 * 1000) return 'GOOD';
    if (sleepDuration > 5 * 60 * 60 * 1000) return 'FAIR';
    return 'POOR';
  }
}
