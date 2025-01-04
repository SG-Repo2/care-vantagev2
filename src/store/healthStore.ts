import { useState } from 'react';

interface HealthMetrics {
  steps: number;
  distance: number;
  duration: number;
  calories: number;
  heartRate: number;
}

interface HealthPreferences {
  stepGoal: number;
  distanceGoal: number;
  durationGoal: number;
  calorieGoal: number;
}

interface HealthStore {
  metrics: HealthMetrics;
  preferences: HealthPreferences;
  actions: {
    updateMetrics: (metrics: Partial<HealthMetrics>) => void;
    setPreferences: (prefs: Partial<HealthPreferences>) => void;
  };
}

const initialMetrics: HealthMetrics = {
  steps: 0,
  distance: 0,
  duration: 0,
  calories: 0,
  heartRate: 0
};

const initialPreferences: HealthPreferences = {
  stepGoal: 10000,
  distanceGoal: 5,
  durationGoal: 30,
  calorieGoal: 2000
};

export const createHealthStore = (): HealthStore => {
  const [metrics, setMetrics] = useState<HealthMetrics>(initialMetrics);
  const [preferences, setPreferences] = useState<HealthPreferences>(initialPreferences);

  return {
    metrics,
    preferences,
    actions: {
      updateMetrics: (updates) => setMetrics((prev) => ({ ...prev, ...updates })),
      setPreferences: (updates) => setPreferences((prev) => ({ ...prev, ...updates }))
    }
  };
};

export type { HealthStore, HealthMetrics, HealthPreferences };