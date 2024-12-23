import { HealthService, HealthServiceConfig } from './types';
import { HealthMetrics } from '../types/health';
import { HealthScoring } from '../../../core/utils/scoring';
import { DataSource } from '../../../core/types/base';

export abstract class BaseHealthService implements HealthService {
  protected initialized = false;
  protected abstract source: DataSource;

  async initialize(config: HealthServiceConfig): Promise<boolean> {
    if (this.initialized) return true;
    const success = await this.doInitialize(config);
    this.initialized = success;
    return success;
  }

  protected abstract doInitialize(config: HealthServiceConfig): Promise<boolean>;

  async requestPermissions(): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('Health service not initialized');
    }
    return this.doRequestPermissions();
  }

  protected abstract doRequestPermissions(): Promise<boolean>;

  async hasPermissions(): Promise<boolean> {
    if (!this.initialized) return false;
    return this.doHasPermissions();
  }

  protected abstract doHasPermissions(): Promise<boolean>;

  async getMetrics(date: Date = new Date()): Promise<HealthMetrics> {
    if (!this.initialized) {
      throw new Error('Health service not initialized');
    }

    const [steps, distance] = await Promise.all([
      this.getDailySteps(date),
      this.getDailyDistance(date),
    ]);

    const now = new Date();
    const id = `metrics_${now.getTime()}`;

    const metrics: HealthMetrics = {
      id,
      profileId: '', // Set from the calling context
      date: date.toISOString(),
      steps,
      distance,
      score: 0,
      source: this.source,
      createdAt: now,
      updatedAt: now,
    };

    const score = HealthScoring.calculateScore(metrics);
    metrics.score = score.overall;

    return metrics;
  }

  abstract getDailySteps(date?: Date): Promise<number>;
  abstract getDailyDistance(date?: Date): Promise<number>;
}
