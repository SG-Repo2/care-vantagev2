import { Platform } from 'react-native';
import type { HealthProvider } from '../../types';
import { AppleHealthProvider } from './AppleHealthProvider';
import { GoogleHealthProvider } from './GoogleHealthProvider';

class MockHealthProvider implements HealthProvider {
  async initialize(): Promise<void> {}
  async requestPermissions(): Promise<void> {}
  async getMetrics() {
    const currentDate = new Date().toISOString();
    return {
      steps: 0,
      distance: 0,
      calories: 0,
      heartRate: 0,
      lastUpdated: currentDate,
      weeklySteps: 0,
      weeklyDistance: 0,
      weeklyCalories: 0,
      weeklyHeartRate: 0,
      score: 0
    };
  }
}

export class HealthProviderFactory {
  private static instance: HealthProvider | null = null;

  static async createProvider(): Promise<HealthProvider> {
    if (this.instance) {
      return this.instance;
    }

    let provider: HealthProvider;

    try {
      if (Platform.OS === 'ios') {
        provider = new AppleHealthProvider();
      } else if (Platform.OS === 'android') {
        provider = new GoogleHealthProvider();
      } else {
        console.warn('Platform not supported, using mock provider');
        provider = new MockHealthProvider();
      }

      await provider.initialize();
      this.instance = provider;
      return provider;
    } catch (error) {
      console.error('Failed to create health provider:', error);
      // Fallback to mock provider if real provider initialization fails
      provider = new MockHealthProvider();
      await provider.initialize();
      this.instance = provider;
      return provider;
    }
  }

  static resetProvider(): void {
    this.instance = null;
  }
}