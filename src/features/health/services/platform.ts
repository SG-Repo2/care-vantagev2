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

const healthConnectPlatform: HealthPlatform = {
  id: 'health_connect',
  name: 'Health Connect',
  version: '1.0.0',
  type: 'health_connect'
};

const manualPlatform: HealthPlatform = {
  id: 'manual',
  name: 'Manual Entry',
  version: '1.0.0',
  type: 'manual'
};

declare const HealthConnectClient: {
  isAvailable(): Promise<boolean>;
};

export const getCurrentPlatform = async (): Promise<HealthPlatform> => {
  if (Platform.OS === 'ios') {
    return appleHealthPlatform;
  }
  
  if (Platform.OS === 'android') {
    try {
      const isHealthConnectAvailable = await HealthConnectClient.isAvailable();
      if (isHealthConnectAvailable) {
        return healthConnectPlatform;
      }
    } catch (error) {
      console.warn('Error checking Health Connect availability:', error);
    }
    return manualPlatform;
  }
  
  return manualPlatform;
};
