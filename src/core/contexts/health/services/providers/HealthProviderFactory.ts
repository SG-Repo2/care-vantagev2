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
      
      // Weekly aggregates (single numbers representing weekly totals)
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

  static async createProvider(): Promise<HealthProvider> {
    const currentPlatform = Platform.OS;

    // Reset instance if platform changed or no instance exists
    if (this.lastInitializedPlatform !== currentPlatform || !this.instance) {
      this.instance = null;
      this.lastInitializedPlatform = currentPlatform;

      let provider: HealthProvider;

      try {
        if (currentPlatform === 'ios') {
          provider = new AppleHealthProvider();
        } else if (currentPlatform === 'android') {
          provider = new GoogleHealthProvider();
        } else {
          console.warn('Platform not supported, using mock provider');
          provider = new MockHealthProvider();
        }

        await provider.initialize();
        this.instance = provider;
      } catch (error) {
        const initError = new InitializationError(
          `Failed to initialize health provider for platform ${currentPlatform}`,
          { cause: error }
        );

        // Only fallback to mock if real provider fails
        if (currentPlatform === 'ios' || currentPlatform === 'android') {
          console.error('Falling back to mock provider:', initError);
          provider = new MockHealthProvider();
          await provider.initialize();
          this.instance = provider;
        } else {
          throw initError;
        }
      }
    }

    return this.instance;
  }

  static resetProvider(): void {
    this.instance = null;
  }
}
