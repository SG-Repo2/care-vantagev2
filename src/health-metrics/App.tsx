import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { SimpleNavigator } from './navigation/SimpleNavigator';
import { HealthDataProvider } from './contexts/HealthDataContext';
export const HealthMetricsApp = () => {
  return (
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
  );
};