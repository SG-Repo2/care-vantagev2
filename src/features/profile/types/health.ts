import { BaseEntity, DataSource } from '../../../core/types/base';

export interface HealthMetrics extends BaseEntity {
  profileId: string;
  date: string;
  steps: number;
  distance: number;  // in kilometers
  source: DataSource;
  score?: HealthScore;  // Making score optional since it's calculated after the metrics are created
}

export interface HealthScore {
  id: string;
  metricsId: string;
  overall: number;
  categories: {
    steps: number;
    distance: number;
  };
  dailyVictory: boolean;
}
