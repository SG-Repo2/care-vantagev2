import { Platform } from 'react-native';
import HealthConnect from '@stridekick/react-native-health-connect';
import { HealthMetrics } from '../../profile/types/health';
import { HealthService } from './HealthService';
import { SleepQuality, DataSource } from '../../../core/types/base';

interface HealthActivity {
  type?: string;
  value?: number;
  startTime?: string;
  endTime?: string;
  timestamp?: string;
  systolic?: number;
  diastolic?: number;
}

export class AndroidHealthService implements HealthService {
  private initialized: boolean = false;

  constructor() {
    if (Platform.OS !== 'android') {
      throw new Error('AndroidHealthService can only be used on Android devices');
    }
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Check if Health Connect is enabled
      const isEnabled = await HealthConnect.isEnabled();
      if (!isEnabled) {
        console.error('Health Connect is not enabled on this device');
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
      return await HealthConnect.authorize();
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      return await HealthConnect.authorize();
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }

  async fetchHealthData(date: string): Promise<HealthMetrics> {
    if (!this.initialized) {
      throw new Error('Health Connect is not initialized');
    }

    try {
      // Get activities for the last day
      const activities = await HealthConnect.getActivities(1) as HealthActivity[];
      
      // Find activities for the requested date
      const dateActivities = activities.filter(activity => {
        const activityDate = new Date(activity.startTime || activity.timestamp || '');
        const requestDate = new Date(date);
        return activityDate.toDateString() === requestDate.toDateString();
      });

      // Calculate metrics from activities
      let steps = 0;
      let distance = 0;
      let heartRateReadings: number[] = [];
      let bloodPressureReadings: { systolic: number; diastolic: number; timestamp: Date }[] = [];
      let sleepSessions: { startTime: Date; endTime: Date }[] = [];

      dateActivities.forEach(activity => {
        if (activity.type === 'steps') {
          steps += activity.value || 0;
        }
        if (activity.type === 'distance') {
          distance += activity.value || 0;
        }
        if (activity.type === 'heart_rate' && activity.value) {
          heartRateReadings.push(activity.value);
        }
        if (activity.type === 'blood_pressure' && activity.systolic && activity.diastolic && activity.timestamp) {
          bloodPressureReadings.push({
            systolic: activity.systolic,
            diastolic: activity.diastolic,
            timestamp: new Date(activity.timestamp)
          });
        }
        if (activity.type === 'sleep' && activity.startTime && activity.endTime) {
          sleepSessions.push({
            startTime: new Date(activity.startTime),
            endTime: new Date(activity.endTime)
          });
        }
      });

      // Calculate heart rate stats
      const avgHeartRate = heartRateReadings.length 
        ? heartRateReadings.reduce((a, b) => a + b, 0) / heartRateReadings.length 
        : 0;
      const maxHeartRate = heartRateReadings.length 
        ? Math.max(...heartRateReadings) 
        : 0;
      const minHeartRate = heartRateReadings.length 
        ? Math.min(...heartRateReadings) 
        : 0;

      // Calculate sleep metrics
      const totalSleepMs = sleepSessions.reduce((total, session) => {
        return total + (session.endTime.getTime() - session.startTime.getTime());
      }, 0);

      const sleepQuality = this.getSleepQuality(totalSleepMs);
      const firstSleep = sleepSessions[0] || { 
        startTime: new Date(), 
        endTime: new Date() 
      };

      const metricsId = `metrics_${Date.now()}`;

      return {
        id: metricsId,
        profileId: '', // This should be set by the caller
        date: new Date(date),
        steps,
        flights: 0, // Health Connect doesn't track flights climbed
        distance,
        heartRate: {
          average: Math.round(avgHeartRate),
          max: Math.round(maxHeartRate),
          min: Math.round(minHeartRate),
          readings: heartRateReadings.map((value, index) => ({
            id: `hr_${Date.now()}_${index}`,
            metricsId,
            value,
            timestamp: new Date()
          }))
        },
        bloodPressure: bloodPressureReadings.map((reading, index) => ({
          id: `bp_${Date.now()}_${index}`,
          metricsId,
          ...reading
        })),
        sleep: {
          id: `sleep_${Date.now()}`,
          metricsId,
          deepSleep: Math.round(totalSleepMs * 0.2 / 60000), // Convert ms to minutes, estimate 20% deep sleep
          lightSleep: Math.round(totalSleepMs * 0.5 / 60000), // Convert ms to minutes, estimate 50% light sleep
          remSleep: Math.round(totalSleepMs * 0.3 / 60000), // Convert ms to minutes, estimate 30% REM sleep
          awakeTime: 0, // Not provided by Health Connect
          startTime: firstSleep.startTime,
          endTime: firstSleep.endTime,
          quality: sleepQuality
        },
        source: 'google_fit' as DataSource,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      throw error;
    }
  }

  private getSleepQuality(sleepDuration: number): SleepQuality {
    if (sleepDuration > 8 * 60 * 60 * 1000) return 'excellent';
    if (sleepDuration > 7 * 60 * 60 * 1000) return 'good';
    if (sleepDuration > 5 * 60 * 60 * 1000) return 'fair';
    return 'poor';
  }
}
