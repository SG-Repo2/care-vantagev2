import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { MD3Colors } from 'react-native-paper/lib/typescript/types';

// Custom colors for metrics
const metricColors = {
  steps: '#4CAF50',      // Green
  distance: '#2196F3',   // Blue
  score: '#FFC107',      // Amber
  calories: '#FF5722',   // Deep Orange
  sleep: '#9C27B0',      // Purple
};

export const lightColors: MD3Colors = {
  ...MD3LightTheme.colors,
  primary: '#006A6A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#6FF7F7',
  onPrimaryContainer: '#002020',
  secondary: '#4A6363',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#CCE8E7',
  onSecondaryContainer: '#051F1F',
  background: '#FAFDFC',
  surface: '#FAFDFC',
  surfaceVariant: '#DAE5E4',
  onSurfaceVariant: '#3F4948',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
};

export const darkColors: MD3Colors = {
  ...MD3DarkTheme.colors,
  primary: '#4CDADA',
  onPrimary: '#003737',
  primaryContainer: '#004F4F',
  onPrimaryContainer: '#6FF7F7',
  secondary: '#B0CCCC',
  onSecondary: '#1B3434',
  secondaryContainer: '#324B4B',
  onSecondaryContainer: '#CCE8E7',
  background: '#191C1C',
  surface: '#191C1C',
  surfaceVariant: '#3F4948',
  onSurfaceVariant: '#BEC9C8',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: lightColors,
  metrics: metricColors,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: darkColors,
  metrics: metricColors,
};

// Create a custom theme that combines MD3Theme and NavigationTheme
export const customLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...lightColors,
    // Add required navigation theme colors
    card: lightColors.surface,
    text: lightColors.onSurface,
    border: lightColors.outline,
    notification: lightColors.error,
  },
};

export const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...darkColors,
    // Add required navigation theme colors
    card: darkColors.surface,
    text: darkColors.onSurface,
    border: darkColors.outline,
    notification: darkColors.error,
  },
};

export type AppTheme = typeof customLightTheme;
export type MetricColorKey = keyof typeof metricColors;

// Helper function to get metric color
export const getMetricColor = (metricType: MetricColorKey): string => {
  return metricColors[metricType] || metricColors.score;
};
