import { getCurrentWeekStart } from './metrics';

// Demo data for the past week
const startDate = getCurrentWeekStart();

export const DEMO_DATA = {
  steps: {
    labels: Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return date;
    }),
    values: [8456, 12043, 9876, 7654, 11234, 9087, 10432], // Weekly step counts
  },
  heartRate: {
    labels: Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return date;
    }),
    values: [72, 75, 78, 71, 76, 73, 74], // Average daily heart rates
    hourlyData: {
      // Sample hourly heart rate data for detailed view
      morning: [68, 70, 72, 75], // 6AM-9AM
      afternoon: [76, 78, 77, 75], // 10AM-2PM
      evening: [74, 73, 71, 69], // 3PM-7PM
      night: [67, 65, 63, 62], // 8PM-11PM
    },
  },
  distance: {
    labels: Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return date;
    }),
    // Convert steps to kilometers (approximately 2000 steps = 1.61 km)
    values: [
      6.82, // ~8456 steps
      9.71, // ~12043 steps
      7.96, // ~9876 steps
      6.17, // ~7654 steps
      9.06, // ~11234 steps
      7.33, // ~9087 steps
      8.41, // ~10432 steps
    ],
  },
  calories: {
    labels: Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return date;
    }),
    // Calculate calories based on steps (approximately 40-50 calories per 1000 steps)
    // plus base metabolic rate (~1400-1600 calories)
    values: [
      1738, // 8456 steps ≈ 338 calories + 1400 base
      1882, // 12043 steps ≈ 482 calories + 1400 base
      1795, // 9876 steps ≈ 395 calories + 1400 base
      1706, // 7654 steps ≈ 306 calories + 1400 base
      1849, // 11234 steps ≈ 449 calories + 1400 base
      1763, // 9087 steps ≈ 363 calories + 1400 base
      1817, // 10432 steps ≈ 417 calories + 1400 base
    ],
    // Hourly breakdown for the current day
    hourlyData: [
      120, // 6AM
      300, // 9AM
      450, // 12PM
      600, // 3PM
      400, // 6PM
      200, // 9PM
    ],
  },
};

// Helper function to get the current day's metrics
export const getCurrentDayMetrics = () => {
  return {
    steps: DEMO_DATA.steps.values[DEMO_DATA.steps.values.length - 1],
    heartRate: DEMO_DATA.heartRate.values[DEMO_DATA.heartRate.values.length - 1],
    distance: DEMO_DATA.distance.values[DEMO_DATA.distance.values.length - 1],
    calories: DEMO_DATA.calories.values[DEMO_DATA.calories.values.length - 1],
  };
};

// Additional information for each metric
export const METRIC_INFO = {
  steps: {
    goal: 10000,
    additionalInfo: [
      { label: 'Daily Average', value: '9826' },
      { label: 'Best Day', value: '12043' },
    ],
  },
  heartRate: {
    goal: 220, // Maximum heart rate (age-based)
    additionalInfo: [
      { label: 'Resting HR', value: '62 bpm' },
      { label: 'Peak HR', value: '142 bpm' },
      { label: 'Average HR', value: '74 bpm' },
    ],
  },
  distance: {
    goal: 8.05, // From metrics.ts (5 miles)
    additionalInfo: [
      { label: 'Daily Average', value: '7.92 km' },
      { label: 'Best Day', value: '9.71 km' },
      { label: 'Total Distance', value: '55.46 km' },
    ],
  },
  calories: {
    goal: 2000,
    additionalInfo: [
      { label: 'Daily Average', value: '1793 cal' },
      { label: 'Best Day', value: '1882 cal' },
      { label: 'Base Rate', value: '1400 cal' },
    ],
  },
};