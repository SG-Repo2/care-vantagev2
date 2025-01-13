export const normalizeDistance = (meters: number): number => {
  return Number((meters / 1000).toFixed(2)); // Convert to kilometers
};

export const averageHeartRate = (samples: number[]): number => {
  if (!samples.length) return 0;
  const sum = samples.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / samples.length);
};

export const normalizeSteps = (steps: number): number => {
  return Math.round(steps);
};

export const normalizeCalories = (calories: number): number => {
  return Math.round(calories);
};