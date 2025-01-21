export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type MeasurementSystem = 'metric' | 'imperial';
export type DataSource = 'apple_health' | 'health_connect' | 'manual';
export type SleepQuality = 'poor' | 'fair' | 'good' | 'excellent';
