import { BaseEntity, DataSource, SleepQuality } from '../../../core/types/base';

export interface HeartRateReading {
  id: string;
  metricsId: string;
  value: number;
  timestamp: Date;
}

export interface BloodPressureReading {
  id: string;
  metricsId: string;
  systolic: number;
  diastolic: number;
  timestamp: Date;
}

export interface SleepMetrics {
  id: string;
  metricsId: string;
  startTime: Date;
  endTime: Date;
  quality: SleepQuality;
  deepSleep: number;    // in minutes
  lightSleep: number;   // in minutes
  remSleep: number;     // in minutes
  awakeTime: number;    // in minutes
}

export interface HealthScore {
  id: string;
  metricsId: string;
  overall: number;  // 0-100
  categories: {
    activity: number;     // 0-100
    cardio: number;       // 0-100
    sleep: number;        // 0-100
  };
  breakdown: {
    stepsContribution: number;
    heartRateContribution: number;
    sleepContribution: number;
  };
}

export interface HealthMetrics extends BaseEntity {
  profileId: string;
  date: Date;
  steps: number;
  distance: number;  // in meters
  flights: number;
  heartRate?: {
    average: number;
    max: number;
    min: number;
    readings: HeartRateReading[];
  };
  bloodPressure?: BloodPressureReading[];
  sleep?: SleepMetrics;
  score?: HealthScore;
  source: DataSource;
}
