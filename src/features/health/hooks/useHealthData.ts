import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { HealthMetrics, WeeklyMetrics } from '../types/health';
import { HealthServiceFactory } from '../services/factory';
import { HealthService } from '../services/types';
import { HEALTH_METRICS } from '../../../core/constants/metrics';
import { profileService } from '../../../features/profile/services/profileService';

const useHealthData = (userId: string) => {
  const [metrics, setMetrics] = useState<HealthMetrics & WeeklyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthService, setHealthService] = useState<HealthService | null>(null);

  // Initialize health service
  useEffect(() => {
    let mounted = true;
    const initializeHealthService = async () => {
      try {
        const service = await HealthServiceFactory.getService();
        if (!mounted) return;

        if (!service) {
          throw new Error('Failed to create health service');
        }

        const initialized = await service.initialize({
          permissions: {
            read: Platform.select({
              ios: [
                'Steps',
                'DistanceWalkingRunning',
                'HeartRate',
                'ActiveEnergyBurned',
              ],
              android: [
                'Steps',
                'Distance',
                'HeartRate',
                'ActiveCaloriesBurned',
                'TotalCaloriesBurned'
              ],
              default: ['Steps', 'Distance', 'HeartRate']
            }),
            write: [],
          }
        });
        
        if (!mounted) return;

        if (!initialized) {
          console.warn('Health service initialization failed');
          setError('Health service not available');
          setLoading(false);
          return;
        }

        const hasPermissions = await service.hasPermissions();
        if (!hasPermissions) {
          try {
            const granted = await service.requestPermissions();
            if (!granted) {
              setError('Health data permissions not granted');
              setLoading(false);
              return;
            }
          } catch (err) {
            console.error('Error requesting permissions:', err);
            setError('Failed to request health permissions');
            setLoading(false);
            return;
          }
        }

        if (mounted) {
          setHealthService(service);
        }
      } catch (err) {
        console.error('Error initializing health service:', err);
        if (mounted) {
          setError('Failed to initialize health service');
          setLoading(false);
        }
      }
    };

    initializeHealthService();
    
    return () => {
      mounted = false;
    };
  }, [userId]);

  // Sync metrics to database when component unmounts or metrics/userId change
  useEffect(() => {
    return () => {
      if (metrics && userId) {
        const today = new Date().toISOString().split('T')[0];
        profileService.updateHealthMetrics(userId, today, {
          steps: metrics.steps,
          distance: metrics.distance,
          heartrate: metrics.heartRate,
          calories: metrics.calories
        }).catch(err => {
          console.error('Failed to sync health data on unmount:', err);
        });
      }
    };
  }, [metrics, userId]);

  // Load health data
  useEffect(() => {
    const loadHealthData = async () => {
      if (!healthService) return;

      try {
        setLoading(true);
        setError(null);

        // Get current day metrics
        const currentMetrics = await healthService.getMetrics();
        const { steps, distance, heartRate, calories } = currentMetrics;

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
            const dayMetrics = await healthService.getMetrics(date);
            weeklySteps.push(dayMetrics.steps);
            weeklyDistance.push(dayMetrics.distance);
            weeklyHeartRate.push(dayMetrics.heartRate);
            weeklyCalories.push(dayMetrics.calories);
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
          heartRate: heartRate || 0, // Ensure we always have a number
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
  }, [healthService, userId]);

  const refresh = async () => {
    if (!healthService) {
      setError('Health service not initialized');
      return;
    }

    try {
      setLoading(true);
      // Re-fetch current day data
      const currentMetrics = await healthService.getMetrics();
      const { steps, distance, heartRate, calories } = currentMetrics;

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
