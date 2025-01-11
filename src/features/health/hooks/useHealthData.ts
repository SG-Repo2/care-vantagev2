import { useState, useEffect } from 'react';
import { HealthMetrics, WeeklyMetrics } from '../types/health';
import { HealthServiceFactory } from '../services/factory';
import { HEALTH_METRICS } from '../../../core/constants/metrics';
import { profileService } from '../../../features/profile/services/profileService';

const useHealthData = (userId: string) => {
  const [metrics, setMetrics] = useState<HealthMetrics & WeeklyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthService, setHealthService] = useState<any>(null);

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
            read: [
              'Steps',
              'DistanceWalkingRunning',
              'HeartRate',
              'ActiveEnergyBurned',
            ],
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

        // Verify the service has the required methods
        const requiredMethods = ['getDailySteps', 'getDailyDistance', 'getDailyHeartRate', 'getDailyCalories'] as const;
        const missingMethods = requiredMethods.filter(
          method => typeof (service as any)[method] !== 'function'
        );
        
        if (missingMethods.length > 0) {
          console.error('Health service missing required methods:', missingMethods);
          throw new Error(`Health service missing required methods: ${missingMethods.join(', ')}`);
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
      if (healthService) {
        healthService.cleanup?.();
      }
      // Sync health data to database when component unmounts
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
          healthService.getDailyHeartRate().catch((err: Error) => {
            console.warn('Error fetching heart rate:', err);
            return 0;
          }),
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
              healthService.getDailyHeartRate(date).catch((err: Error) => {
                console.warn(`Error fetching heart rate for ${date.toISOString()}:`, err);
                return 0;
              }),
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
