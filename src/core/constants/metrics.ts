export const HEALTH_METRICS = {
  STEPS: {
    DAILY_GOAL: 10000,
    MIN_HEALTHY: 5000,
    CONTRIBUTION_WEIGHT: 0.3
  },
  HEART_RATE: {
    RESTING_RANGE: {
      MIN: 60,
      MAX: 100
    },
    ZONES: {
      REST: { MIN: 60, MAX: 100 },
      LIGHT: { MIN: 101, MAX: 120 },
      MODERATE: { MIN: 121, MAX: 140 },
      VIGOROUS: { MIN: 141, MAX: 160 },
      MAXIMUM: { MIN: 161, MAX: 220 }
    },
    CONTRIBUTION_WEIGHT: 0.3
  },
  BLOOD_PRESSURE: {
    NORMAL: {
      SYSTOLIC: { MIN: 90, MAX: 120 },
      DIASTOLIC: { MIN: 60, MAX: 80 }
    }
  },
  SLEEP: {
    DAILY_GOAL: 480, // minutes (8 hours)
    MIN_HEALTHY: 360, // minutes (6 hours)
    STAGES: {
      DEEP: { MIN_PERCENTAGE: 0.13, MAX_PERCENTAGE: 0.23 },
      LIGHT: { MIN_PERCENTAGE: 0.4, MAX_PERCENTAGE: 0.6 },
      REM: { MIN_PERCENTAGE: 0.2, MAX_PERCENTAGE: 0.3 }
    },
    CONTRIBUTION_WEIGHT: 0.4
  }
};
