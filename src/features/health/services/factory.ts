import { Platform } from 'react-native';
import { HealthService } from './types';
import { AppleHealthService } from './platforms/AppleHealthService';
import { GoogleHealthService } from './platforms/GoogleHealthService';
import { MockHealthService } from './platforms/MockHealthService';
import { getCurrentPlatform } from './platform';

export class HealthServiceFactory {
  static getService(): HealthService {
    const currentPlatform = getCurrentPlatform();
    if (currentPlatform.id === 'apple_health') {
      return new AppleHealthService();
    }
    if (currentPlatform.id === 'google_fit') {
      return new GoogleHealthService();
    }
    return new MockHealthService();
  }
}
