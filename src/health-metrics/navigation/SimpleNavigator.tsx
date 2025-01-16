import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../core/auth/contexts/AuthContext';
import { useHealthData } from '../contexts/HealthDataContext';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import { TabNavigator } from './TabNavigator';

const Stack = createNativeStackNavigator();

export const SimpleNavigator = () => {
  const { status, error: authError, refreshSession } = useAuth();
  const { loading: healthLoading, error: healthError } = useHealthData();

  if (status === 'initializing') {
    return <LoadingScreen message="Initializing app..." />;
  }

  if (status === 'error' && authError) {
    return (
      <ErrorScreen
        error={authError}
        onRetry={() => {
          console.log('Retrying auth session...');
          refreshSession?.();
        }}
      />
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        contentStyle: {
          backgroundColor: '#000',
        },
      }}
    >
      {status === 'authenticated' && (
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{
            gestureEnabled: false,
          }}
        />
      )}
    </Stack.Navigator>
  );
};
