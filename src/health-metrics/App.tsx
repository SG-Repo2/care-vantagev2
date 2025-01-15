import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { SimpleNavigator } from './navigation/SimpleNavigator';

export const HealthMetricsApp = () => {
  return (
    <NavigationContainer>
      <PaperProvider>
        <SimpleNavigator />
      </PaperProvider>
    </NavigationContainer>
  );
}; 