import { HealthServiceConfig } from '../types';
import { BaseHealthService } from '../base';

export class MockHealthService extends BaseHealthService {
  protected source = 'manual' as const;

  protected async doInitialize(config: HealthServiceConfig): Promise<boolean> {
    return true;
  }

  protected async doRequestPermissions(): Promise<boolean> {
    return true;
  }

  protected async doHasPermissions(): Promise<boolean> {
    return true;
  }

  async getDailySteps(date: Date = new Date()): Promise<number> {
    // Return a random number of steps between 5000 and 15000
    return Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000;
  }

  async getDailyDistance(date: Date = new Date()): Promise<number> {
    // Return a random distance between 3 and 10 kilometers
    return Number((Math.random() * (10 - 3) + 3).toFixed(2));
  }
}
