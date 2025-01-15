import { Platform } from 'react-native';
import { AppleHealthProvider } from './apple/AppleHealthProvider';
import { GoogleHealthProvider } from './google/GoogleHealthProvider';
import { HealthProvider } from './types';

export class HealthProviderFactory {
  private static instance: HealthProvider | null = null;

  static async createProvider(): Promise<HealthProvider> {
    if (this.instance) {
      return this.instance;
    }

    const provider = Platform.select<() => HealthProvider>({
      ios: () => new AppleHealthProvider(),
      android: () => new GoogleHealthProvider(),
      default: () => {
        throw new Error('Platform not supported');
      },
    })();

    const isAvailable = await provider.isAvailable();
    if (!isAvailable) {
      throw new Error('Health services not available');
    }

    this.instance = provider;
    return provider;
  }

  static async cleanup(): Promise<void> {
    this.instance = null;
  }
} 