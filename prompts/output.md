# CarevVantage Refactoring Implementation Guide

## Overview
This guide outlines the step-by-step process for refactoring the CarevVantage health metrics app, focusing on consolidating functionality into the source of truth at `src/health-metrics/`.

## Phase 1: Database Updates

### SQL Migrations
```sql
-- Add health_metrics table
CREATE TABLE health_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  steps INTEGER NOT NULL DEFAULT 0,
  distance FLOAT NOT NULL DEFAULT 0,
  calories INTEGER NOT NULL DEFAULT 0,
  heart_rate INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add ranking function
CREATE OR REPLACE FUNCTION get_user_rank(user_id UUID)
RETURNS INTEGER AS $$
  SELECT rank
  FROM (
    SELECT id, RANK() OVER (ORDER BY score DESC) as rank
    FROM users
    WHERE score IS NOT NULL
  ) rankings
  WHERE id = user_id;
$$ LANGUAGE SQL;
```

## Phase 2: Type Consolidation

### Core Health Types
```typescript
// src/health-metrics/types.ts
export interface HealthMetrics {
  steps: number;
  distance: number;
  calories: number;
  heartRate: number;
  lastUpdated: string;
  score?: number;
}

export interface WeeklyMetrics {
  weeklySteps: number;
  weeklyDistance: number;
  weeklyCalories: number;
  weeklyHeartRate: number;
  startDate?: string;
  endDate?: string;
}

export interface HealthError {
  type: 'initialization' | 'permissions' | 'data' | 'validation';
  message: string;
  details?: unknown;
}
```

## Phase 3: Score Calculator Consolidation

### Unified Score Calculator
```typescript
// src/health-metrics/transforms/scoreCalculator.ts
export interface HealthScoreConfig {
  thresholds: {
    steps: number;
    distance: number;
    calories: number;
  };
  weights: {
    steps: number;
    distance: number;
    calories: number;
    heartRate: number;
  };
}

export const DEFAULT_SCORE_CONFIG: HealthScoreConfig = {
  thresholds: {
    steps: 10000,
    distance: 5,
    calories: 500
  },
  weights: {
    steps: 40,
    distance: 30,
    calories: 20,
    heartRate: 10
  }
};

export const calculateHealthScore = (
  metrics: HealthMetrics,
  config: HealthScoreConfig = DEFAULT_SCORE_CONFIG
): number => {
  const { steps, distance, calories, heartRate } = metrics;
  const { thresholds, weights } = config;
  
  const stepsScore = Math.min(steps / thresholds.steps, 1) * weights.steps;
  const distanceScore = Math.min(distance / thresholds.distance, 1) * weights.distance;
  const caloriesScore = Math.min(calories / thresholds.calories, 1) * weights.calories;
  const heartRateScore = heartRate > 0 ? weights.heartRate : 0;
  
  return Math.round(stepsScore + distanceScore + caloriesScore + heartRateScore);
};
```

## Phase 4: Context Consolidation

### Unified Health Context
```typescript
// src/health-metrics/contexts/HealthDataContext.tsx
export const HealthDataProvider: React.FC<HealthDataProviderProps> = ({
  children,
  config = DEFAULT_HEALTH_CONFIG,
  validateOnChange = true
}) => {
  const [state, dispatch] = useReducer(healthDataReducer, initialState);
  const { user, getAccessToken } = useAuth();
  const monitor = useMonitor();

  // Implementation details...
};
```

## Phase 5: Testing Strategy

### Unit Tests
```typescript
// src/health-metrics/__tests__/scoreCalculator.test.ts
describe('Health Score Calculator', () => {
  test('calculates score with default config', () => {
    const metrics: HealthMetrics = {
      steps: 10000,
      distance: 5,
      calories: 500,
      heartRate: 70,
      lastUpdated: new Date().toISOString()
    };
    
    const score = calculateHealthScore(metrics);
    expect(score).toBe(100);
  });
});
```

## Phase 6: Monitoring Integration

### Error Monitoring
```typescript
// src/health-metrics/services/healthMonitor.ts
export class HealthMonitor extends Monitor {
  trackMetricUpdate(metrics: HealthMetrics): void {
    this.addMetric('health_update', {
      steps: metrics.steps,
      distance: metrics.distance,
      calories: metrics.calories,
      heartRate: metrics.heartRate
    });
  }
}
```

## Deployment Checklist

1. Database Migrations
   - [ ] Run health_metrics table creation
   - [ ] Create indices for performance
   - [ ] Verify ranking function

2. Code Deployment
   - [ ] Deploy type consolidation
   - [ ] Update score calculator
   - [ ] Migrate to unified context
   - [ ] Enable monitoring

3. Validation
   - [ ] Run migration tests
   - [ ] Verify data consistency
   - [ ] Check performance metrics
   - [ ] Monitor error rates

## Rollback Plan

1. Database Rollback
```sql
DROP TABLE IF EXISTS health_metrics;
DROP FUNCTION IF EXISTS get_user_rank;
```

2. Code Rollback
- Maintain previous versions in source control
- Keep old types and calculators until migration complete
- Document dependencies for clean rollback

## Success Metrics

1. Performance
   - Query execution time < 100ms
   - Context updates < 16ms
   - Cache hit rate > 90%

2. Data Quality
   - Score calculation accuracy 100%
   - No duplicate metrics
   - All required fields present

3. Error Rates
   - API failures < 0.1%
   - Score calculation errors < 0.01%
   - Data sync failures < 0.05%
