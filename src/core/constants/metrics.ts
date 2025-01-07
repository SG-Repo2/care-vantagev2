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
  }
};

// Helper function to get the date 6 days ago
export const getCurrentWeekStart = (): Date => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);
  return startDate;
};

export type MetricColorKey =
  | 'calories'
  | 'distance'
  | 'score';

export const METRICS = [
  { key: 'calories', label: 'Calories' },
  { key: 'distance', label: 'Distance' },
  { key: 'score', label: 'Score' },
];
