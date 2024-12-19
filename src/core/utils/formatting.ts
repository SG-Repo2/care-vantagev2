import { MeasurementSystem } from '../types/base';

export const formatDistance = (kilometers: number, system: MeasurementSystem): string => {
  if (system === 'imperial') {
    const miles = kilometers * 0.621371;
    return `${miles.toFixed(2)} mi`;
  }
  return `${kilometers.toFixed(2)} km`;
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

export const formatHeartRate = (bpm: number): string => {
  return `${Math.round(bpm)} bpm`;
};

export const formatBloodPressure = (systolic: number, diastolic: number): string => {
  return `${systolic}/${diastolic} mmHg`;
};

export const formatScore = (score: number): string => {
  return `${Math.round(score)}/100`;
};
