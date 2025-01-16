import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../core/auth/contexts/AuthContext';
import { useHealthData } from '../contexts/HealthDataContext';
import AuthScreen from '../components/AuthScreen';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import { TabNavigator } from './TabNavigator';

const Stack = createNativeStackNavigator();

export const SimpleNavigator = () => {
  const { status, error: authError, refreshSession } = useAuth();
  const { loading: healthLoading, error: healthError } = useHealthData();

  // Show loading screen during initial app load or health data initialization
  if (status === 'initializing' || (status === 'authenticated' && healthLoading)) {
    return (
      <LoadingScreen
        message={
          status === 'initializing'
            ? "Initializing app..."
            : "Loading health data..."
        }
      />
    );
  }

  // Handle auth errors
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

  // Handle health data errors when authenticated
  if (status === 'authenticated' && healthError) {
    return (
      <ErrorScreen
        error={healthError.message}
        onRetry={() => {
          console.log('Retrying health data fetch...');
          window.location.reload();
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
      {status === 'authenticated' ? (
        <Stack.Screen 
          name="MainTabs" 
          component={TabNavigator}
          options={{
            gestureEnabled: false,
          }}
        />
      ) : (
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen}
          options={{
            gestureEnabled: false,
          }}
        />
      )}
    </Stack.Navigator>
  );
};