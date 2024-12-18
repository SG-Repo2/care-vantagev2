import GoogleFit, { Scopes } from 'react-native-google-fit';
import { HealthMetrics } from '../../profile/types/health';
import { DataSource } from '../../../core/types/base';

export class AndroidHealthService {
  private initialized: boolean = false;

  private readonly SCOPES = [
    Scopes.FITNESS_ACTIVITY_READ,
    Scopes.FITNESS_BODY_READ,
    Scopes.FITNESS_HEART_RATE_READ,
    Scopes.FITNESS_BLOOD_PRESSURE_READ,
    Scopes.FITNESS_SLEEP_READ,
  ];

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      const authResult = await GoogleFit.authorize({
        scopes: this.SCOPES,
      });

      if (authResult.success) {
        this.initialized = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize Google Fit:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const authResult = await GoogleFit.checkIsAuthorized();
      return authResult.authorized;
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const authResult = await GoogleFit.authorize({
        scopes: this.SCOPES,
      });
      return authResult.success;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }

  async getDailyMetrics(date: Date): Promise<HealthMetrics | null> {
    if (!this.initialized) await this.initialize();
    if (!await this.checkPermissions()) return null;

    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const [steps, heartRate, bloodPressure, sleep, distance] = await Promise.all([
        this.getSteps(startDate, endDate),
        this.getHeartRate(startDate, endDate),
        this.getBloodPressure(startDate, endDate),
        this.getSleep(startDate, endDate),
        this.getDistance(startDate, endDate),
      ]);

      return {
        id: `metrics_${Date.now()}`,
        date: date,
        steps: steps,
        heartRate: heartRate,
        bloodPressure: bloodPressure,
        sleep: sleep,
        distance: distance,
        flights: 0, // Google Fit doesn't track flights climbed
        source: 'google_fit' as DataSource,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      return null;
    }
  }

  private async getSteps(startDate: Date, endDate: Date): Promise<number> {
    const res = await GoogleFit.getDailySteps(startDate, endDate);
    return res.length > 0 ? res[0].steps : 0;
  }

  private async getHeartRate(startDate: Date, endDate: Date): Promise<number | null> {
    const res = await GoogleFit.getHeartRateSamples({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    return res.length > 0 ? res[res.length - 1].value : null;
  }

  private async getBloodPressure(startDate: Date, endDate: Date): Promise<{ systolic: number; diastolic: number } | null> {
    const res = await GoogleFit.getBloodPressureSamples({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    return res.length > 0 ? {
      systolic: res[res.length - 1].systolic,
      diastolic: res[res.length - 1].diastolic,
    } : null;
  }

  private async getSleep(startDate: Date, endDate: Date): Promise<{ startTime: Date; endTime: Date; quality: string } | null> {
    const res = await GoogleFit.getSleepSamples({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    return res.length > 0 ? {
      startTime: new Date(res[0].startDate),
      endTime: new Date(res[0].endDate),
      quality: this.getSleepQuality(res[0]),
    } : null;
  }

  private async getDistance(startDate: Date, endDate: Date): Promise<number> {
    const res = await GoogleFit.getDailyDistanceSamples({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    return res.length > 0 ? res[0].distance : 0;
  }

  private getSleepQuality(sleepSample: any): string {
    // Google Fit sleep data interpretation
    if (sleepSample.efficiency > 85) return 'GOOD';
    if (sleepSample.efficiency > 70) return 'FAIR';
    return 'POOR';
  }
}
