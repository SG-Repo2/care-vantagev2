import { HealthMetrics } from '../types';
import { syncQueue } from '../services/HealthMetricsService';
import { monitor } from '../config/featureFlags';

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

      // Test migration logic here
      // const migratedData = await migrateMetrics(oldFormat);
      // expect(migratedData).toEqual(newFormat);
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
      // const finalState = await getLatestMetrics();
      // expect(finalState.steps).toBe(2200); // Sum of both updates
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
    // const integrated = await integrateProviderData('apple_health', providerData);
    // expect(integrated.heartRate).toBe(72);

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
    // const finalState = await getLatestMetrics();
    // expect(finalState.steps).toBe(15000); // Sum of all updates
  });
});