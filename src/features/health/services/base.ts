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

    const [steps, distance, heartRate, calories] = await Promise.all([
      this.getDailySteps(date),
      this.getDailyDistance(date),
      this.getDailyHeartRate(date),
      Promise.resolve(0), // Placeholder for calories until implemented
    ]);

    const metrics: HealthMetrics = {
      steps,
      distance,
      heartRate,
      calories,
      score: 0,
    };

    metrics.score = HealthScoring.calculateScore(metrics).overall;

    return metrics;
  }

  abstract getDailySteps(date?: Date): Promise<number>;
  abstract getDailyDistance(date?: Date): Promise<number>;
  abstract getDailyHeartRate(date?: Date): Promise<number>;
  
  async getWeeklySteps(startDate: Date): Promise<number[]> {
    if (!this.initialized) {
      throw new Error('Health service not initialized');
    }
    
    const weeklySteps: number[] = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      try {
        const steps = await this.getDailySteps(currentDate);
        weeklySteps.push(steps);
      } catch (error) {
        console.error(`Error reading steps for ${currentDate.toISOString()}:`, error);
        weeklySteps.push(0);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return weeklySteps;
  }
}
