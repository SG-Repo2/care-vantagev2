import { Platform, NativeModules } from 'react-native';
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
        ios: () => {
          if (!NativeModules.AppleHealthKit) {
            throw new Error('iOS HealthKit not available on this device');
          }
          return new AppleHealthProvider();
        },
        android: () => {
          const androidVersion = parseInt(Platform.Version.toString(), 10);
          if (androidVersion < 26) { // Health Connect requires Android 8+
            throw new Error('Health Connect requires Android 8 or higher');
          }
          return new GoogleHealthProvider();
        },
        default: () => {
          throw new Error(`Platform ${Platform.OS} not supported`);
        },
      })();

      try {
        console.log('[HealthProviderFactory] Initializing provider...');
        await provider.initialize();

        console.log('[HealthProviderFactory] Requesting permissions...');
        await provider.requestPermissions();
      } catch (error) {
        console.error('[HealthProviderFactory] Provider setup failed:', error);
        this.initializationAttempted = true;
        throw error;
      }

      console.log('[HealthProviderFactory] Provider initialized successfully');
      this.instance = provider;
      return provider;
    } catch (error) {
      console.error('[HealthProviderFactory] Error creating provider:', error);
      this.initializationAttempted = true;
      throw new Error(
        `Failed to initialize health provider: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  static async cleanup(): Promise<void> {
    console.log('[HealthProviderFactory] Cleaning up provider instance');
    if (this.instance) {
      try {
        // Allow providers to perform cleanup if needed
        if (typeof this.instance.cleanup === 'function') {
          await this.instance.cleanup();
        }
      } catch (error) {
        console.error('[HealthProviderFactory] Error during provider cleanup:', error);
      }
    }
    this.instance = null;
    this.initializationAttempted = false;
  }

  static async checkPermissions(): Promise<boolean> {
    try {
      if (!this.instance) {
        return false;
      }

      // Create a new provider instance without initializing
      const provider = Platform.select<() => HealthProvider>({
        ios: () => new AppleHealthProvider(),
        android: () => new GoogleHealthProvider(),
        default: () => {
          throw new Error(`Platform ${Platform.OS} not supported`);
        },
      })();

      // Only check permissions, don't initialize
      await provider.requestPermissions();
      return true;
    } catch (error) {
      console.error('[HealthProviderFactory] Permission check failed:', error);
      return false;
    }
  }
}