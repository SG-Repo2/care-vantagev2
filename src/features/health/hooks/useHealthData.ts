import { useState, useEffect } from 'react';
import { HealthMetrics, WeeklyMetrics } from '../types/health';
import { HealthServiceFactory } from '../services/factory';
import { HEALTH_METRICS } from '../../../core/constants/metrics';

const useHealthData = (userId: string) => {
  const [metrics, setMetrics] = useState<HealthMetrics & WeeklyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthService, setHealthService] = useState<any>(null);

  // Initialize health service
  useEffect(() => {
    const initializeHealthService = async () => {
      try {
        const service = await HealthServiceFactory.getService();
        const initialized = await service.initialize({
          permissions: {
            read: [
              'Steps',
              'DistanceWalkingRunning',
              'HeartRate',
              'ActiveEnergyBurned',
              'BodyMass',
              'Height',
              'BodyMassIndex',
            ],
            write: [],
          }
        });
        if (!initialized) {
          throw new Error('Failed to initialize health service');
        }
        const hasPermissions = await service.hasPermissions();
        if (!hasPermissions) {
          const granted = await service.requestPermissions();
          if (!granted) {
            throw new Error('Health data permissions not granted');
          }
        }
        setHealthService(service);
      } catch (err) {
        console.error('Error initializing health service:', err);
        setError('Failed to initialize health service');
        setLoading(false);
      }
    };

    initializeHealthService();
  }, []);

  // Load health data
  useEffect(() => {
    const loadHealthData = async () => {
      if (!healthService) return;

      try {
        setLoading(true);
        setError(null);

        // Get current day metrics
        const [steps, distance, heartRate, calories] = await Promise.all([
          healthService.getDailySteps(),
          healthService.getDailyDistance(),
          healthService.getDailyHeartRate(),
          healthService.getDailyCalories(),
        ]);

        // Get weekly data
        const weekStartDate = new Date();
        weekStartDate.setDate(weekStartDate.getDate() - 6);
        weekStartDate.setHours(0, 0, 0, 0);

        // Initialize arrays for weekly data
        const weeklySteps: number[] = [];
        const weeklyDistance: number[] = [];
        const weeklyHeartRate: number[] = [];
        const weeklyCalories: number[] = [];

        // Collect data for the past 7 days
        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStartDate);
          date.setDate(date.getDate() + i);
          
          try {
            const [daySteps, dayDistance, dayHeartRate, dayCalories] = await Promise.all([
              healthService.getDailySteps(date),
              healthService.getDailyDistance(date),
              healthService.getDailyHeartRate(date),
              healthService.getDailyCalories(date),
            ]);

            weeklySteps.push(daySteps);
            weeklyDistance.push(dayDistance);
            weeklyHeartRate.push(dayHeartRate);
            weeklyCalories.push(dayCalories);
          } catch (err) {
            console.error(`Error getting data for ${date.toISOString()}:`, err);
            // Use 0 as fallback for failed days
            weeklySteps.push(0);
            weeklyDistance.push(0);
            weeklyHeartRate.push(0);
            weeklyCalories.push(0);
          }
        }

        // Calculate score based on daily goals
        const stepsScore = Math.min(steps / HEALTH_METRICS.STEPS.DAILY_GOAL, 1) * 100;
        const distanceScore = Math.min(distance / HEALTH_METRICS.DISTANCE.DAILY_GOAL, 1) * 100;
        const score = Math.round((stepsScore + distanceScore) / 2);

        const combinedMetrics: HealthMetrics & WeeklyMetrics = {
          steps,
          distance,
          heartRate,
          calories,
          weeklySteps,
          weeklyDistance,
          weeklyHeartRate,
          weeklyCalories,
          weekStartDate,
          score,
        };

        setMetrics(combinedMetrics);
      } catch (err) {
        console.error('Error loading health data:', err);
        setError('Failed to load health data');
      } finally {
        setLoading(false);
      }
    };

    loadHealthData();
  }, [healthService]);

  const refresh = async () => {
    if (!healthService) {
      setError('Health service not initialized');
      return;
    }

    try {
      setLoading(true);
      // Re-fetch current day data
      const [steps, distance, heartRate, calories] = await Promise.all([
        healthService.getDailySteps(),
        healthService.getDailyDistance(),
        healthService.getDailyHeartRate(),
        healthService.getDailyCalories(),
      ]);

      if (metrics) {
        setMetrics({
          ...metrics,
          steps,
          distance,
          heartRate,
          calories,
        });
      }
    } catch (err) {
      console.error('Error refreshing health data:', err);
      setError('Failed to refresh health data');
    } finally {
      setLoading(false);
    }
  };

  return {
    metrics,
    loading,
    error,
    refresh,
  };
};

export default useHealthData;
