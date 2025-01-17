import React, { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../core/error/ErrorBoundary';
import { ErrorScreen } from './components/ErrorScreen';
import * as WebBrowser from 'expo-web-browser';
import { RootNavigator } from './navigation/RootNavigator';
import { AuthProvider } from './contexts/AuthContext';

// Custom theme with platform-specific colors and navigation integration
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

  useEffect(() => {
    // Initialize WebBrowser for OAuth
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <AuthProvider>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" />
          <PaperProvider theme={theme}>
            <RootNavigator navigationTheme={navigationTheme} />
          </PaperProvider>
        </SafeAreaProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}