import { Platform } from 'react-native';
import { DataSource } from '../../../core/types/base';
import NativeHealthConnect from './NativeHealthConnect';

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

export const getCurrentPlatform = async (): Promise<HealthPlatform> => {
  try {
    if (Platform.OS === 'ios') {
      return appleHealthPlatform;
    }
    
    if (Platform.OS === 'android') {
      try {
        const isHealthConnectAvailable = await NativeHealthConnect.isAvailable();
        if (isHealthConnectAvailable) {
          return healthConnectPlatform;
        }
      } catch (error) {
        console.warn('Error checking Health Connect availability:', error);
        // Log more details about the error
        console.error('Health Connect error details:', error);
      }
    }
  } catch (error) {
    console.error('Error in getCurrentPlatform:', error);
  }
  
  // Default to manual platform if anything fails
  return manualPlatform;
};
