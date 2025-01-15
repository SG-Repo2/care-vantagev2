import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { SimpleNavigator } from './navigation/SimpleNavigator';
import { HealthDataProvider } from '@core/contexts/health/HealthDataContext';
import { AuthProvider } from '@core/auth/contexts/AuthContext';

export const HealthMetricsApp = () => {
  return (
    <NavigationContainer>
      <AuthProvider>
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
      </AuthProvider>
    </NavigationContainer>
  );
}; 