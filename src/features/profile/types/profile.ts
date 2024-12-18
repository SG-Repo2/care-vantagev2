import { BaseEntity, Gender, BloodType, MeasurementSystem, PrivacyLevel } from '../../../core/types/base';

export interface Biometrics {
  height?: number;  // in centimeters
  weight?: number;  // in kilograms
  bloodType?: BloodType;
}

export interface Preferences {
  measurementSystem: MeasurementSystem;
  notifications: boolean;
  privacyLevel: PrivacyLevel;
  dailyGoals?: {
    steps?: number;
    sleep?: number;  // in minutes
    water?: number;  // in milliliters
  };
}

export interface Profile extends BaseEntity {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  biometrics: Biometrics;
  preferences: Preferences;
}
