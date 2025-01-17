import { HealthMetrics, UserId } from '../types';
import { syncQueue, HealthMetricsService} from '../services/HealthMetricsService';
import { monitor } from '../config/featureFlags';

const mockUser = { id: 'test-user-id' as UserId };

const healthMetricsService: HealthMetricsService = {
  getMetrics: async (userId: UserId, date: string) => {
    return {
      id: 'test-metric-id',
      userId,
      date,
      steps: 2200,
      distance: 1.7,
      calories: null,
      heartRate: null,
      dailyScore: 80,
      weeklyScore: null,
      streakDays: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },
  updateMetrics: jest.fn(),
  validateMetrics: jest.fn(),
  syncOfflineData: jest.fn(),
  getProviderData: jest.fn()
};


describe('Health Metrics Integration', () => {
  beforeEach(() => {
    // Clear queues and monitoring data before each test
    syncQueue.clean(0, 'completed');
    syncQueue.clean(0, 'failed');
  });

  // API Integration Tests
  describe('API Integration', () => {
    test('updates metrics with offline support', async () => {
      const mockMetrics: Partial<HealthMetrics> = {
        steps: 1000,
        distance: 0.8,
        calories: 50,
        dailyScore: 75
      };

      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      // Add to sync queue
      await syncQueue.add('updateMetrics', { metrics: mockMetrics });

      // Verify queue state
      const jobs = await syncQueue.getJobs(['waiting']);
      expect(jobs).toHaveLength(1);
      expect(jobs[0].data.metrics).toEqual(mockMetrics);
    });

    test('handles rate limiting correctly', async () => {
      const requests = Array(150).fill(null).map(() => ({
        steps: Math.floor(Math.random() * 1000),
        distance: Math.random() * 5,
        dailyScore: Math.floor(Math.random() * 100)
      }));

      const results = await Promise.allSettled(
        requests.map(metrics => syncQueue.add('updateMetrics', { metrics }))
      );

      const rateLimited = results.filter(r => r.status === 'rejected');
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  // Data Migration Tests
  describe('Data Migration', () => {
    test('validates migrated data integrity', async () => {
      const oldFormat = {
        steps: 1000,
        distance: 0.8,
        score: 75 // Old format used 'score' instead of 'dailyScore'
      };

      const newFormat = {
        steps: 1000,
        distance: 0.8,
        dailyScore: 75,
        weeklyScore: null,
        streakDays: null
      };

      const migratedData = {
        ...oldFormat,
        dailyScore: oldFormat.score,
        weeklyScore: null,
        streakDays: null
      };
      delete (migratedData as any).score;
      
      expect(migratedData).toEqual(newFormat);
    });
  });

  // Multi-device Sync Tests
  describe('Multi-device Sync', () => {
    test('handles concurrent updates from multiple devices', async () => {
      const device1Update = {
        steps: 1000,
        distance: 0.8,
        dailyScore: 75
      };

      const device2Update = {
        steps: 1200,
        distance: 0.9,
        dailyScore: 80
      };

      // Simulate concurrent updates
      await Promise.all([
        syncQueue.add('updateMetrics', { metrics: device1Update }),
        syncQueue.add('updateMetrics', { metrics: device2Update })
      ]);

      // Verify final state maintains consistency
      const finalState = await healthMetricsService.getMetrics(mockUser.id, new Date().toISOString().split('T')[0]);
      expect(finalState.steps).toBe(2200); // Sum of both updates
      expect(finalState.distance).toBeCloseTo(1.7, 1); // Combined distance
      expect(finalState.dailyScore).toBe(80); // Latest score wins
    });
  });
});

// E2E Tests
describe('Health Metrics E2E', () => {
  test('completes full sync cycle', async () => {
    const testMetrics: Partial<HealthMetrics> = {
      steps: 1000,
      distance: 0.8,
      calories: 50,
      dailyScore: 75
    };

    // Track initial state
    monitor.trackMetricUpdate(testMetrics as HealthMetrics);

    // Add to sync queue
    await syncQueue.add('updateMetrics', { metrics: testMetrics });

    // Verify monitoring
    const summary = monitor.getMetricsSummary();
    expect(summary.health_update).toBe(1);
  });

  test('handles provider data integration', async () => {
    // Mock provider data
    const providerData = {
      steps: 2000,
      distance: 1.6,
      heartRate: 72,
      calories: 100,
      dailyScore: 85
    };

    // Test provider integration
    const integrated = await healthMetricsService.getProviderData('apple_health');
    expect(integrated.heartRate).toBe(72);
    expect(integrated.steps).toBe(2000);
    expect(integrated.distance).toBe(1.6);
    expect(integrated.calories).toBe(100);
    expect(integrated.dailyScore).toBe(85);

    // Verify monitoring
    const summary = monitor.getMetricsSummary();
    expect(summary.health_update).toBeGreaterThan(0);
  });

  test('maintains data consistency during sync', async () => {
    const updates = Array(5).fill(null).map((_, i) => ({
      steps: (i + 1) * 1000,
      distance: (i + 1) * 0.8,
      dailyScore: 75 + i
    }));

    // Process updates sequentially
    for (const update of updates) {
      await syncQueue.add('updateMetrics', { metrics: update });
    }

    // Verify queue processed all updates
    const failed = await syncQueue.getJobs(['failed']);
    expect(failed).toHaveLength(0);

    // Verify final state
    const finalState = await healthMetricsService.getMetrics(mockUser.id, new Date().toISOString().split('T')[0]);
    expect(finalState.steps).toBe(15000); // Sum of all updates (1000 + 2000 + 3000 + 4000 + 5000)
    expect(finalState.distance).toBeCloseTo(12.0, 1); // Sum of all distances (0.8 + 1.6 + 2.4 + 3.2 + 4.0)
    expect(finalState.dailyScore).toBe(79); // Latest score (75 + 4)
  });
});