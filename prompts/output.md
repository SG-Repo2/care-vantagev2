# CarevVantage Refactoring Implementation Guide

## Overview
This guide outlines the step-by-step process for refactoring the CarevVantage health metrics app, focusing on consolidating functionality into the source of truth at `src/health-metrics/`.

## Phase 1: Database Schema

### SQL Schema Creation
```sql
-- Create health_metrics table with exact structure
CREATE TABLE health_metrics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  date date NOT NULL,
  steps int4 NOT NULL,
  distance numeric NOT NULL,
  calories int4,
  heart_rate numeric,
  daily_score int4 NOT NULL,
  weekly_score int4,
  streak_days int4,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT health_metrics_pkey PRIMARY KEY (id)
);

-- Add indices for performance
CREATE INDEX idx_health_metrics_user_date ON health_metrics(user_id, date);
CREATE INDEX idx_health_metrics_daily_score ON health_metrics(daily_score);
CREATE INDEX idx_health_metrics_weekly_score ON health_metrics(weekly_score) WHERE weekly_score IS NOT NULL;

-- Add ranking function with performance optimization
CREATE OR REPLACE FUNCTION get_user_rank(user_id uuid)
RETURNS INTEGER AS $$
  SELECT rank
  FROM (
    SELECT id, 
           RANK() OVER (
             PARTITION BY date
             ORDER BY daily_score DESC
           ) as rank
    FROM health_metrics
    WHERE date = CURRENT_DATE
  ) rankings
  WHERE id = user_id;
$$ LANGUAGE SQL STABLE;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_health_metrics_updated_at
    BEFORE UPDATE ON health_metrics
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
```

## Phase 2: Type System & Validation Layer

### Core Health Types
```typescript
// src/health-metrics/types.ts
export interface HealthMetrics {
  id: string;
  userId: string;
  date: string;
  steps: number;
  distance: number;
  calories: number | null;
  heartRate: number | null;
  dailyScore: number;
  weeklyScore: number | null;
  streakDays: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyMetrics {
  weeklySteps: number;
  weeklyDistance: number;
  weeklyCalories: number | null;
  weeklyHeartRate: number | null;
  startDate: string;
  endDate: string;
}

export interface HealthMetricsValidation {
  isValid: boolean;
  errors?: {
    steps?: string[];
    distance?: string[];
    calories?: string[];
    heartRate?: string[];
    dailyScore?: string[];
  };
}

export interface HealthError {
  type: 'initialization' | 'permissions' | 'data' | 'validation' | 'sync' | 'provider';
  message: string;
  details?: unknown;
  timestamp: string;
  deviceId?: string;
}

// Branded types for stronger type safety
export type UserId = string & { readonly __brand: unique symbol };
export type MetricId = string & { readonly __brand: unique symbol };
```

## Phase 3: API Layer Implementation

### Health Metrics Service
```typescript
// src/health-metrics/services/HealthMetricsService.ts
export interface HealthMetricsService {
  getMetrics(userId: UserId, date: string): Promise<HealthMetrics>;
  updateMetrics(userId: UserId, metrics: Partial<HealthMetrics>): Promise<void>;
  validateMetrics(metrics: Partial<HealthMetrics>): HealthMetricsValidation;
  syncOfflineData(): Promise<void>;
  getProviderData(source: 'apple_health' | 'health_connect'): Promise<HealthMetrics>;
}

// API Rate Limiting
export const rateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Offline Sync Queue
export const syncQueue = new Queue('healthMetricsSync', {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
});
```

## Phase 4: State Management & Context

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
  const syncManager = useSyncManager();
  
  // Optimistic updates with offline support
  const updateMetrics = async (metrics: Partial<HealthMetrics>) => {
    try {
      dispatch({ type: 'UPDATE_METRICS_OPTIMISTIC', payload: metrics });
      
      if (!navigator.onLine) {
        await syncQueue.add('updateMetrics', { metrics });
        return;
      }
      
      await healthMetricsService.updateMetrics(user.id, metrics);
      dispatch({ type: 'UPDATE_METRICS_SUCCESS', payload: metrics });
    } catch (error) {
      dispatch({ type: 'UPDATE_METRICS_FAILURE', payload: error });
      monitor.trackError('metrics_update_failed', error);
    }
  };

  // Health data provider integration
  const initializeHealthProviders = async () => {
    try {
      const providers = await detectHealthProviders();
      for (const provider of providers) {
        const data = await healthMetricsService.getProviderData(provider);
        dispatch({ type: 'UPDATE_PROVIDER_DATA', payload: { provider, data }});
      }
    } catch (error) {
      monitor.trackError('provider_initialization_failed', error);
    }
  };

  return (
    <HealthDataContext.Provider value={{
      ...state,
      updateMetrics,
      initializeHealthProviders
    }}>
      {children}
    </HealthDataContext.Provider>
  );
};
```

## Phase 5: Feature Flags & Monitoring

### Feature Flag Configuration
```typescript
// src/health-metrics/config/featureFlags.ts
export const FEATURE_FLAGS = {
  newHealthMetrics: {
    enabled: false,
    rolloutPercentage: 0
  },
  offlineSync: {
    enabled: true,
    rolloutPercentage: 25
  },
  providerIntegration: {
    enabled: true,
    providers: ['apple_health', 'health_connect']
  }
};

// Performance Monitoring
export const PERFORMANCE_THRESHOLDS = {
  apiLatency: 200, // ms
  renderTime: 16, // ms
  memoryUsage: 85, // percentage
  syncDelay: 5000 // ms
};

// Error Monitoring
export class HealthMonitor extends Monitor {
  trackMetricUpdate(metrics: HealthMetrics): void {
    this.addMetric('health_update', {
      steps: metrics.steps,
      distance: metrics.distance,
      calories: metrics.calories,
      heartRate: metrics.heartRate,
      dailyScore: metrics.dailyScore,
      weeklyScore: metrics.weeklyScore
    });
  }

  trackPerformance(metric: keyof typeof PERFORMANCE_THRESHOLDS, value: number): void {
    this.addMetric('performance', { metric, value });
    if (value > PERFORMANCE_THRESHOLDS[metric]) {
      this.trackError('performance_threshold_exceeded', { metric, value });
    }
  }
}
```

## Phase 6: Testing Strategy

### Comprehensive Test Suite
```typescript
// src/health-metrics/__tests__/integration.test.ts
describe('Health Metrics Integration', () => {
  // API Integration Tests
  test('updates metrics with offline support', async () => {
    // Test implementation
  });

  // Data Migration Tests
  test('validates migrated data integrity', async () => {
    // Test implementation
  });

  // Multi-device Sync Tests
  test('handles concurrent updates from multiple devices', async () => {
    // Test implementation
  });
});

// E2E Tests
describe('Health Metrics E2E', () => {
  test('completes full sync cycle', async () => {
    // Test implementation
  });

  test('handles provider data integration', async () => {
    // Test implementation
  });
});
```

## Deployment Checklist

1. Pre-deployment
   - [ ] Run database migration tests
   - [ ] Verify feature flag configurations
   - [ ] Test rollback procedures
   - [ ] Update API documentation

2. Database Migration
   - [ ] Backup existing data
   - [ ] Run schema creation scripts
   - [ ] Verify data integrity
   - [ ] Create performance indices

3. Code Deployment
   - [ ] Deploy with feature flags disabled
   - [ ] Enable monitoring
   - [ ] Gradually enable features
   - [ ] Monitor error rates

4. Validation
   - [ ] Run integration tests
   - [ ] Verify multi-device sync
   - [ ] Check provider integration
   - [ ] Monitor performance metrics

## Rollback Plan

1. Database Rollback
```sql
-- Drop tables and functions
DROP TRIGGER IF EXISTS update_health_metrics_updated_at ON health_metrics;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS get_user_rank(uuid);
DROP TABLE IF EXISTS health_metrics;
```

2. Code Rollback
- Disable feature flags
- Revert to previous version
- Clear client caches
- Reset sync queues

## Success Metrics

1. Performance
   - API latency < 200ms
   - Context updates < 16ms
   - Cache hit rate > 90%
   - Sync delay < 5s

2. Data Quality
   - Migration success rate 100%
   - Data validation pass rate 100%
   - No duplicate metrics
   - Provider data integration success > 99%

3. Error Rates
   - API failures < 0.1%
   - Sync failures < 0.05%
   - Provider integration errors < 0.1%
   - Performance threshold violations < 0.01%

4. User Impact
   - No data loss during migration
   - Seamless provider integration
   - Consistent multi-device experience
   - Offline functionality maintained
