import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HealthDataProvider } from './contexts/HealthDataContext';
import { SimpleNavigator } from './navigation/SimpleNavigator';

export default function HealthMetricsApp() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <HealthDataProvider
          config={{
            enableBackgroundSync: true,
            syncInterval: 300000, // 5 minutes
          }}
        >
          <PaperProvider>
            <SimpleNavigator />
          </PaperProvider>
        </HealthDataProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}