import { useState, useEffect } from 'react';
import { DEMO_DATA, getCurrentDayMetrics, METRIC_INFO } from '../../../core/constants/demoData';
import { HealthMetrics, WeeklyMetrics } from '../types/health';

const useHealthData = (userId: string) => {
  const [metrics, setMetrics] = useState<HealthMetrics & WeeklyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDemoData = async () => {
      try {
        setLoading(true);
        const currentMetrics = getCurrentDayMetrics();
        
        // Combine current day metrics with weekly data
        const combinedMetrics: HealthMetrics & WeeklyMetrics = {
          steps: currentMetrics.steps,
          calories: currentMetrics.calories,
          distance: currentMetrics.distance,
          heartRate: currentMetrics.heartRate,
          weeklySteps: DEMO_DATA.steps.values,
          weeklyCalories: DEMO_DATA.calories.values,
          weeklyDistance: DEMO_DATA.distance.values,
          weeklyHeartRate: DEMO_DATA.heartRate.values,
          weekStartDate: DEMO_DATA.steps.labels[0],
          score: Math.floor(Math.random() * 100) + 400, // Random score between 400-500
        };

        setMetrics(combinedMetrics);
        setError(null);
      } catch (err) {
        setError('Failed to load health data');
        console.error('Error loading demo health data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDemoData();
  }, [userId]);

  const refresh = async () => {
    // Simulate a refresh by slightly modifying the current values
    if (metrics) {
      const variation = 0.1; // 10% variation
      const newMetrics = {
        ...metrics,
        steps: Math.floor(metrics.steps * (1 + (Math.random() * variation * 2 - variation))),
        calories: Math.floor(metrics.calories * (1 + (Math.random() * variation * 2 - variation))),
        distance: metrics.distance * (1 + (Math.random() * variation * 2 - variation)),
        heartRate: Math.floor(metrics.heartRate * (1 + (Math.random() * variation * 2 - variation))),
      };
      setMetrics(newMetrics);
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
