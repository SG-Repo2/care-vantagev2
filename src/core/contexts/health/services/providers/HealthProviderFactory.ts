import { Platform } from 'react-native';
import type { 
  HealthProvider, 
  HealthMetrics, 
  WeeklyMetrics 
} from '../../types';
import { AppleHealthProvider } from './AppleHealthProvider';
import { GoogleHealthProvider } from './GoogleHealthProvider';
import { PermissionError, InitializationError } from '../../errors/HealthErrors';

class MockHealthProvider implements HealthProvider {
  private permissionsGranted: boolean = false;

  async initialize(): Promise<void> {
    // Mock initialization succeeds
  }

  async requestPermissions(): Promise<void> {
    try {
      // Simulate permission request
      this.permissionsGranted = true;
    } catch (error) {
      throw new PermissionError('Failed to request mock permissions');
    }
  }

  async hasPermissions(): Promise<boolean> {
    return this.permissionsGranted;
  }

  async getMetrics(): Promise<HealthMetrics & WeeklyMetrics> {
    if (!this.permissionsGranted) {
      throw new PermissionError('Health permissions not granted');
    }

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

  async getWeeklyData(startDate: string, endDate: string): Promise<WeeklyMetrics> {
    if (!this.permissionsGranted) {
      throw new PermissionError('Health permissions not granted');
    }

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

  async sync(): Promise<void> {
    if (!this.permissionsGranted) {
      throw new PermissionError('Health permissions not granted');
    }
    // Mock sync operation
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

        // Wrap provider creation in a timeout to prevent blocking
        const createProviderWithTimeout = async (): Promise<HealthProvider> => {
          return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new InitializationError('Provider initialization timed out'));
            }, 5000); // 5 second timeout

            const initProvider = async () => {
              try {
                if (currentPlatform === 'ios') {
                  provider = new AppleHealthProvider();
                } else if (currentPlatform === 'android') {
                  provider = new GoogleHealthProvider();
                } else {
                  provider = new MockHealthProvider();
                }

                await provider.initialize();
                clearTimeout(timeoutId);
                resolve(provider);
              } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
              }
            };

            initProvider();
          });
        };

        try {
          provider = await createProviderWithTimeout();
        } catch (error) {
          // If real provider fails, fallback to mock
          console.warn('Health provider initialization failed, using mock provider:', error);
          provider = new MockHealthProvider();
          await provider.initialize();
        }

        this.instance = provider;
        return provider;
      } catch (error) {
        const initError = new InitializationError(
          `Failed to initialize health provider for platform ${currentPlatform}`,
          { cause: error }
        );
        throw initError;
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
        // Ensure sync operations are stopped
        const provider = this.instance as HealthProvider & { sync?: () => Promise<void> };
        if (provider.sync) {
          try {
            await provider.sync();
          } catch (error) {
            console.warn('Final sync during cleanup failed:', error);
          }
        }
        
        this.resetProvider();
      }
    } catch (error) {
      console.error('Error during health provider cleanup:', error);
    } finally {
      // Ensure everything is reset even if cleanup fails
      this.instance = null;
      this.lastInitializedPlatform = null;
      this.initializationPromise = null;
    }
  }
}
