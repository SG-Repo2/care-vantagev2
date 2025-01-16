import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../core/auth/contexts/AuthContext';
import AuthScreen from '../components/AuthScreen';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import { TabNavigator } from './TabNavigator';

const Stack = createNativeStackNavigator();

export const SimpleNavigator = () => {
  const { status, error, refreshSession } = useAuth();

  // Only show loading screen during initial app load
  if (status === 'initializing') {
    return <LoadingScreen message="Initializing app..." />;
  }

  if (status === 'error' && error) {
    return (
      <ErrorScreen
        error={error}
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