import { HealthProviderFactory } from '../../../health-metrics/providers/HealthProviderFactory';
import { HealthMetrics, HealthProvider } from '../../../health-metrics/providers/types';

// Mock native health modules
jest.mock('expo-health-connect', () => ({
  initialize: jest.fn(),
  requestPermission: jest.fn(),
  readRecords: jest.fn(),
}));

// The AppleHealthKit mock is now in src/__mocks__/react-native-health
jest.mock('react-native-health');

describe('Health Metrics Integration', () => {
  const mockHealthData: HealthMetrics = {
    steps: 10000,
    distance: 8000,
    calories: 500,
    heartRate: 75,
    lastUpdated: new Date().toISOString(),
    score: 850,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Provider Initialization', () => {
    it('should initialize health provider successfully', async () => {
      const mockProvider: HealthProvider = {
        initialize: jest.fn().mockResolvedValue(undefined),
        requestPermissions: jest.fn().mockResolvedValue(undefined),
        getMetrics: jest.fn().mockResolvedValue(mockHealthData),
      };

      jest.spyOn(HealthProviderFactory, 'createProvider').mockResolvedValue(mockProvider);

      const provider = await HealthProviderFactory.createProvider();
      await provider.initialize();

      expect(provider.initialize).toHaveBeenCalled();
    });

    it('should handle initialization failure', async () => {
      const mockProvider: HealthProvider = {
        initialize: jest.fn().mockRejectedValue(new Error('Failed to initialize')),
        requestPermissions: jest.fn(),
        getMetrics: jest.fn(),
      };

      jest.spyOn(HealthProviderFactory, 'createProvider').mockResolvedValue(mockProvider);

      const provider = await HealthProviderFactory.createProvider();
      await expect(provider.initialize()).rejects.toThrow('Failed to initialize');
    });
  });

  describe('Health Data Fetching', () => {
    it('should fetch health metrics correctly', async () => {
      const mockProvider: HealthProvider = {
        initialize: jest.fn().mockResolvedValue(undefined),
        requestPermissions: jest.fn().mockResolvedValue(undefined),
        getMetrics: jest.fn().mockResolvedValue(mockHealthData),
      };

      jest.spyOn(HealthProviderFactory, 'createProvider').mockResolvedValue(mockProvider);

      const provider = await HealthProviderFactory.createProvider();
      const metrics = await provider.getMetrics();

      expect(metrics).toEqual(mockHealthData);
      expect(provider.getMetrics).toHaveBeenCalled();
    });

    it('should handle missing data points', async () => {
      const partialData: HealthMetrics = {
        steps: 10000,
        distance: 0,
        calories: 0,
        heartRate: 0,
        lastUpdated: new Date().toISOString(),
      };

      const mockProvider: HealthProvider = {
        initialize: jest.fn().mockResolvedValue(undefined),
        requestPermissions: jest.fn().mockResolvedValue(undefined),
        getMetrics: jest.fn().mockResolvedValue(partialData),
      };

      jest.spyOn(HealthProviderFactory, 'createProvider').mockResolvedValue(mockProvider);

      const provider = await HealthProviderFactory.createProvider();
      const metrics = await provider.getMetrics();

      expect(metrics.steps).toBe(10000);
      expect(metrics.distance).toBe(0);
      expect(metrics.calories).toBe(0);
      expect(metrics.heartRate).toBe(0);
    });
  });

  describe('Permissions Handling', () => {
    it('should request health permissions successfully', async () => {
      const mockProvider: HealthProvider = {
        initialize: jest.fn().mockResolvedValue(undefined),
        requestPermissions: jest.fn().mockResolvedValue(undefined),
        getMetrics: jest.fn(),
      };

      jest.spyOn(HealthProviderFactory, 'createProvider').mockResolvedValue(mockProvider);

      const provider = await HealthProviderFactory.createProvider();
      await provider.requestPermissions();

      expect(provider.requestPermissions).toHaveBeenCalled();
    });

    it('should handle permission denials', async () => {
      const mockProvider: HealthProvider = {
        initialize: jest.fn().mockResolvedValue(undefined),
        requestPermissions: jest.fn().mockRejectedValue(new Error('Permission denied')),
        getMetrics: jest.fn(),
      };

      jest.spyOn(HealthProviderFactory, 'createProvider').mockResolvedValue(mockProvider);

      const provider = await HealthProviderFactory.createProvider();
      await expect(provider.requestPermissions()).rejects.toThrow('Permission denied');
    });
  });
}); 