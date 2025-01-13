import { Platform } from 'react-native';
import type { HealthProvider } from '../types';
import { AppleHealthProvider } from './apple/AppleHealthProvider';
import { GoogleHealthProvider } from './google/GoogleHealthProvider';
import { BaseHealthProvider } from '../base/BaseHealthProvider';

class MockHealthProvider extends BaseHealthProvider {
  protected async initializeNative(): Promise<void> {
    // Mock initialization always succeeds
  }

  protected async requestNativePermissions(): Promise<void> {
    this.authorized = true;
  }

  protected async fetchNativeMetrics(): Promise<any> {
    const currentDate = new Date().toISOString();
    return {
      // Current metrics
      steps: 0,
      distance: 0,
      calories: 0,
      heartRate: 0,
      lastUpdated: currentDate,
      score: 0,
      
      // Weekly aggregates
      weeklySteps: 0,
      weeklyDistance: 0,
      weeklyCalories: 0,
      weeklyHeartRate: 0,
      startDate: new Date(currentDate).toISOString(),
      endDate: currentDate
    };
  }

  protected async fetchNativeWeeklyData(startDate: string, endDate: string): Promise<any> {
    return {
      weeklySteps: 0,
      weeklyDistance: 0,
      weeklyCalories: 0,
      weeklyHeartRate: 0,
      startDate,
      endDate,
      score: 0
    };
  }
}

export class HealthProviderFactory {
  private static instance: HealthProvider | null = null;
  private static lastInitializedPlatform: string | null = null;
  private static initializationPromise: Promise<HealthProvider> | null = null;

  static async createProvider(): Promise<HealthProvider> {
    // If we're already initializing, return the existing promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    const currentPlatform = Platform.OS;

    // If we have a valid instance for the current platform, return it
    if (this.instance && this.lastInitializedPlatform === currentPlatform) {
      return this.instance;
    }

    // Create a new initialization promise
    this.initializationPromise = (async () => {
      try {
        // Reset the instance
        this.instance = null;
        this.lastInitializedPlatform = currentPlatform;

        let provider: HealthProvider;

        // Create appropriate provider based on platform
        if (currentPlatform === 'ios') {
          provider = new AppleHealthProvider();
        } else if (currentPlatform === 'android') {
          provider = new GoogleHealthProvider();
        } else {
          provider = new MockHealthProvider();
        }

        // Initialize the provider
        await provider.initialize();
        
        this.instance = provider;
        return provider;
      } catch (error) {
        // If real provider fails, fallback to mock
        console.warn('Health provider initialization failed, using mock provider:', error);
        const mockProvider = new MockHealthProvider();
        await mockProvider.initialize();
        this.instance = mockProvider;
        return mockProvider;
      } finally {
        // Clear the initialization promise
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  static resetProvider(): void {
    this.instance = null;
    this.lastInitializedPlatform = null;
    this.initializationPromise = null;
  }

  static async cleanup(): Promise<void> {
    try {
      // Wait for any pending initialization to complete
      if (this.initializationPromise) {
        try {
          await this.initializationPromise;
        } catch (error) {
          // Ignore initialization errors during cleanup
          console.warn('Ignored pending initialization during cleanup:', error);
        }
      }

      if (this.instance) {
        // Ensure sync operations are completed
        try {
          await this.instance.sync?.();
        } catch (error) {
          console.warn('Final sync during cleanup failed:', error);
        }
        
        this.resetProvider();
      }
    } catch (error) {
      console.error('Error during health provider cleanup:', error);
    } finally {
      // Ensure everything is reset even if cleanup fails
      this.resetProvider();
    }
  }
}