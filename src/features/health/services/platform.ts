import { Platform } from 'react-native';
import { DataSource } from '../../../core/types/base';

export interface HealthPlatform {
  id: string;
  name: string;
  version: string;
  type: DataSource;
}

export const getCurrentPlatform = (): HealthPlatform => {
  if (Platform.OS === 'ios') {
    return {
      id: 'apple_health',
      name: 'Apple Health',
      version: '1.0.0',
      type: 'apple_health'
    };
  }
  
  if (Platform.OS === 'android') {
    return {
      id: 'google_fit',
      name: 'Google Fit',
      version: '1.0.0',
      type: 'google_fit'
    };
  }
  
  return {
    id: 'manual',
    name: 'Manual Entry',
    version: '1.0.0',
    type: 'manual'
  };
};
