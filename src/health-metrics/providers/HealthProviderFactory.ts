import { Platform } from 'react-native';
import { AppleHealthProvider } from './apple/AppleHealthProvider';
import { GoogleHealthProvider } from './google/GoogleHealthProvider';
import { HealthProvider } from './types';

export class HealthProviderFactory {
  private static instance: HealthProvider | null = null;
  private static initializationAttempted = false;

  static async createProvider(): Promise<HealthProvider> {
    try {
      if (this.instance) {
        console.log('[HealthProviderFactory] Returning existing provider instance');
        return this.instance;
      }

      if (this.initializationAttempted) {
        console.log('[HealthProviderFactory] Previous initialization failed, retrying...');
      }

      console.log(`[HealthProviderFactory] Creating provider for platform: ${Platform.OS}`);
      
      const provider = Platform.select<() => HealthProvider>({
        ios: () => new AppleHealthProvider(),
        android: () => new GoogleHealthProvider(),
        default: () => {
          throw new Error(`Platform ${Platform.OS} not supported`);
        },
      })();

      console.log('[HealthProviderFactory] Initializing provider...');
      await provider.initialize();

      console.log('[HealthProviderFactory] Requesting permissions...');
      await provider.requestPermissions();

      console.log('[HealthProviderFactory] Provider initialized successfully');
      this.instance = provider;
      return provider;
    } catch (error) {
      console.error('[HealthProviderFactory] Error creating provider:', error);
      this.initializationAttempted = true;
      throw error;
    }
  }

  static async cleanup(): Promise<void> {
    console.log('[HealthProviderFactory] Cleaning up provider instance');
    this.instance = null;
    this.initializationAttempted = false;
  }
} 