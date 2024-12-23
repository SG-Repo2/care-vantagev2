import { HealthServiceConfig } from '../types';
import { BaseHealthService } from '../base';

export class GoogleHealthService extends BaseHealthService {
  protected source = 'google_fit' as const;

  protected async doInitialize(config: HealthServiceConfig): Promise<boolean> {
    // TODO: Implement Google Fit initialization
    return false;
  }

  protected async doRequestPermissions(): Promise<boolean> {
    // TODO: Implement Google Fit permissions request
    return false;
  }

  protected async doHasPermissions(): Promise<boolean> {
    // TODO: Implement Google Fit permissions check
    return false;
  }

  async getDailySteps(date: Date = new Date()): Promise<number> {
    throw new Error('Google Fit implementation not yet available');
  }

  async getDailyDistance(date: Date = new Date()): Promise<number> {
    throw new Error('Google Fit implementation not yet available');
  }
}
