import { Platform } from 'react-native';
import { HealthProvider, HealthServiceConfig } from '../../types';
import { AppleHealthProvider } from './AppleHealthProvider';
import { GoogleHealthProvider } from './GoogleHealthProvider';
import { HealthService } from '../healthService';

export class HealthProviderFactory {
  private static instance: HealthProviderFactory;
  private healthService: HealthService | null = null;

  private constructor() {}

  static getInstance(): HealthProviderFactory {
    if (!HealthProviderFactory.instance) {
      HealthProviderFactory.instance = new HealthProviderFactory();
    }
    return HealthProviderFactory.instance;
  }

  async createHealthService(config?: HealthServiceConfig): Promise<HealthService> {
    // Return existing instance if already created
    if (this.healthService) {
      return this.healthService;
    }

    const provider = await this.createProvider();
    this.healthService = new HealthService(provider, config);
    
    // Initialize the service
    await this.healthService.initialize();
    
    return this.healthService;
  }

  private async createProvider(): Promise<HealthProvider> {
    switch (Platform.OS) {
      case 'ios':
        const appleProvider = new AppleHealthProvider();
        await appleProvider.initialize();
        return appleProvider;
      
      case 'android':
        const googleProvider = new GoogleHealthProvider();
        await googleProvider.initialize();
        return googleProvider;
      
      default:
        throw new Error(`Unsupported platform: ${Platform.OS}`);
    }
  }

  // Cleanup method for testing or reset purposes
  destroy(): void {
    if (this.healthService) {
      this.healthService.destroy();
      this.healthService = null;
    }
  }
}

// Convenience function to get health service instance
export async function getHealthService(config?: HealthServiceConfig): Promise<HealthService> {
  const factory = HealthProviderFactory.getInstance();
  return factory.createHealthService(config);
}