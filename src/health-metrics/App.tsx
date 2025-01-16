import React, { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { NavigationContainer, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../core/auth/contexts/AuthContext';
import { HealthDataProvider } from './contexts/HealthDataContext';
import { SimpleNavigator } from './navigation/SimpleNavigator';
import { ErrorBoundary } from '../core/error/ErrorBoundary';
import { ErrorScreen } from './components/ErrorScreen';

// Custom theme with platform-specific colors
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#23C552',
    background: '#000000',
    surface: Platform.select({
      ios: '#1C1C1E',
      android: '#121212',
      default: '#1C1C1E',
    }),
    error: '#FF4B4B',
    onSurface: '#FFFFFF',
    onBackground: '#FFFFFF',
  },
};

// Platform-specific health config
const healthConfig = {
  enableBackgroundSync: Platform.select({
    ios: true,
    android: false,
    default: false,
  }),
  syncInterval: Platform.select({
    ios: 300000, // 5 minutes
    android: 900000, // 15 minutes
    default: 900000,
  }),
  retryAttempts: Platform.select({
    ios: 3,
    android: 2,
    default: 2,
  }),
};

const navigationTheme = {
  ...NavigationDarkTheme,
  dark: true,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.onSurface,
    border: '#2C2C2E',
    notification: theme.colors.primary,
  },
};

const ErrorFallback = () => (
  <ErrorScreen
    error="Something went wrong. Please try again later."
    onRetry={() => {
      // Force reload the app
      if (Platform.OS === 'web') {
        window.location.reload();
      }
    }}
  />
);

export default function HealthMetricsApp() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#000000');
    }
    StatusBar.setBarStyle('light-content');
  }, []);

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <NavigationContainer theme={navigationTheme}>
          <AuthProvider>
            <PaperProvider theme={theme}>
              <HealthDataProvider config={healthConfig}>
                <SimpleNavigator />
              </HealthDataProvider>
            </PaperProvider>
          </AuthProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}