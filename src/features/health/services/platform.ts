import { Platform } from 'react-native';
import { DataSource } from '../../../core/types/base';

export interface HealthPlatform {
  id: string;
  name: string;
  version: string;
  type: DataSource;
}

const appleHealthPlatform: HealthPlatform = {
  id: 'apple_health',
  name: 'Apple Health',
  version: '1.0.0',
  type: 'apple_health'
};

const googleFitPlatform: HealthPlatform = {
  id: 'google_fit',
  name: 'Google Fit',
  version: '1.0.0',
  type: 'google_fit'
};

const manualPlatform: HealthPlatform = {
  id: 'manual',
  name: 'Manual Entry',
  version: '1.0.0',
  type: 'manual'
};

export const getCurrentPlatform = (): HealthPlatform => {
  if (Platform.OS === 'ios') {
    return appleHealthPlatform;
  }
  
  if (Platform.OS === 'android') {
    return googleFitPlatform;
  }
  
  return manualPlatform;
};
