import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { MD3Colors } from 'react-native-paper/lib/typescript/types';

// Custom colors for metrics
const metricColors = {
  steps: '#20B2AA',      // Light sea green
  distance: '#20B2AA',   // Light sea green
  score: '#9B59B6',      // Purpureus
  calories: '#FF6B6B',   // Light red
  sleep: '#9B59B6',      // Purpureus
};

export const lightColors: MD3Colors = {
  ...MD3LightTheme.colors,
  primary: '#20B2AA',
  onPrimary: '#FFFFFF',
  primaryContainer: '#E0F7F6',
  onPrimaryContainer: '#003D3A',
  secondary: '#9B59B6',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#F3E5F5',
  onSecondaryContainer: '#4A2D59',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  onSurfaceVariant: '#666666',
  error: '#FF6B6B',
  onError: '#FFFFFF',
  errorContainer: '#FFE5E5',
  onErrorContainer: '#660000',
};

export const darkColors: MD3Colors = {
  ...MD3DarkTheme.colors,
  primary: '#20B2AA',
  onPrimary: '#FFFFFF',
  primaryContainer: '#004D40',
  onPrimaryContainer: '#E0F7F6',
  secondary: '#9B59B6',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#4A2D59',
  onSecondaryContainer: '#F3E5F5',
  background: '#121212',
  surface: '#121212',
  surfaceVariant: '#2C2C2C',
  onSurfaceVariant: '#CCCCCC',
  error: '#FF6B6B',
  onError: '#FFFFFF',
  errorContainer: '#660000',
  onErrorContainer: '#FFE5E5',
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
