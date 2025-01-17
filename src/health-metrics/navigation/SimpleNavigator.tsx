import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import { SignInScreen } from '../components/SignInScreen';
import { TabNavigator } from './TabNavigator';

const Stack = createNativeStackNavigator();

export const SimpleNavigator = () => {
  const { status, error, refreshSession } = useAuth();

  if (status === 'initializing') {
    return <LoadingScreen message="Initializing app..." />;
  }

  if (status === 'error' && error) {
    return (
      <ErrorScreen
        error={error}
        onRetry={() => {
          console.log('Retrying auth session...');
          refreshSession();
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
        <Stack.Screen name="SignIn" component={SignInScreen} />
      )}
    </Stack.Navigator>
  );
};
