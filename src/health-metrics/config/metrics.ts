export const HEALTH_METRICS = {
  STEPS: {
    DAILY_GOAL: 10000,
    MIN_HEALTHY: 5000,
    HISTORY_DAYS: 7,  // Number of days to track in history
    START_OF_WEEK: 6  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  },
  DISTANCE: {
    DAILY_GOAL: 8.05, // kilometers (approximately 5 miles)
    MIN_HEALTHY: 4.0, // kilometers
    HISTORY_DAYS: 7,
    START_OF_WEEK: 6
  },
  CALORIES: {
    DAILY_GOAL: 500,
    MIN_HEALTHY: 300,
    HISTORY_DAYS: 7,
    START_OF_WEEK: 6
  },
  HEART_RATE: {
    MIN_HEALTHY: 60,
    MAX_HEALTHY: 100,
    HISTORY_DAYS: 7,
    START_OF_WEEK: 6
  }
};

// Helper function to get the date N days ago
export const getHistoryStartDate = (days: number = HEALTH_METRICS.STEPS.HISTORY_DAYS): Date => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);
  return startDate;
};

export type MetricKey = 'steps' | 'distance' | 'calories' | 'heart_rate' | 'score';

export const METRIC_CONFIG = [
  { key: 'steps', label: 'Steps' },
  { key: 'distance', label: 'Distance' },
  { key: 'calories', label: 'Calories' },
  { key: 'heart_rate', label: 'Heart Rate' },
  { key: 'score', label: 'Score' }
]; 