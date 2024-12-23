import { Platform } from 'react-native';
import { HealthService } from './types';
import { AppleHealthService } from './platforms/AppleHealthService';
import { GHealthConnectService } from './platforms/GHealthConnectService';
import { MockHealthService } from './platforms/MockHealthService';
import { getCurrentPlatform } from './platform';

export class HealthServiceFactory {
  static async getService(): Promise<HealthService> {
    const currentPlatform = await getCurrentPlatform();
    
    switch (currentPlatform.id) {
      case 'apple_health':
        return new AppleHealthService();
      case 'health_connect':
        return new GHealthConnectService();
      default:
        return new MockHealthService();
    }
  }
}
