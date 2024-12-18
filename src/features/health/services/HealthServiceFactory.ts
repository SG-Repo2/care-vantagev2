import { Platform } from 'react-native';
import { HealthService } from './HealthService';
import { AndroidHealthService } from './AndroidHealthService';
import { AppleHealthService } from './AppleHealthService';

export class HealthServiceFactory {
  private static instance: HealthService;

  static getService(): HealthService {
    if (!HealthServiceFactory.instance) {
      HealthServiceFactory.instance = Platform.OS === 'ios'
        ? new AppleHealthService()
        : new AndroidHealthService();
    }
    return HealthServiceFactory.instance;
  }
}
