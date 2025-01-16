import React from 'react';
import { Platform, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HealthDataProvider } from './contexts/HealthDataContext';
import { SimpleNavigator } from './navigation/SimpleNavigator';

// Platform-specific theme
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Platform.select({
      ios: '#007AFF',
      android: '#2196F3',
      default: '#007AFF',
    }),
    background: '#000000',
    surface: Platform.select({
      ios: '#1C1C1E',
      android: '#121212',
      default: '#1C1C1E',
    }),
    accent: Platform.select({
      ios: '#007AFF',
      android: '#2196F3',
      default: '#007AFF',
    }),
  },
};

// Navigation theme
const navigationTheme: Theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: '#FFFFFF',
    border: '#2C2C2E',
    notification: theme.colors.accent,
  },
};

// Platform-specific config
const healthConfig = {
  enableBackgroundSync: Platform.select({
    ios: true,
    android: false, // Android has different background restrictions
    default: false,
  }),
  syncInterval: Platform.select({
    ios: 300000, // 5 minutes for iOS
    android: 900000, // 15 minutes for Android to conserve battery
    default: 900000,
  }),
  retryAttempts: Platform.select({
    ios: 3,
    android: 2, // Less aggressive retry on Android
    default: 2,
  }),
};

export default function HealthMetricsApp() {
  // Set status bar style
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#000000');
    }
    StatusBar.setBarStyle('light-content');
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <NavigationContainer theme={navigationTheme}>
        <HealthDataProvider config={healthConfig}>
          <PaperProvider theme={theme}>
            <SimpleNavigator />
          </PaperProvider>
        </HealthDataProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}