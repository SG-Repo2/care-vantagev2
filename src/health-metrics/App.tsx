import React, { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { NavigationContainer, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HealthDataProvider } from './contexts/HealthDataContext';
import { TabNavigator } from './navigation/TabNavigator';
import { ErrorBoundary } from '../core/error/ErrorBoundary';
import { ErrorScreen } from './components/ErrorScreen';
import { AuthProvider } from './contexts/AuthContext';
import { SimpleNavigator } from './navigation/SimpleNavigator';
import * as WebBrowser from 'expo-web-browser';

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
    <ErrorBoundary>
      <AuthProvider>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" />
          <NavigationContainer theme={navigationTheme}>
            <PaperProvider theme={theme}>
              <SimpleNavigator />
            </PaperProvider>
          </NavigationContainer>
        </SafeAreaProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}