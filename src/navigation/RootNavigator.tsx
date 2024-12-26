import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../features/auth/context/AuthContext';
import { useApp } from '../context/AppContext';
import { Surface, ActivityIndicator } from 'react-native-paper';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';

const Stack = createNativeStackNavigator();

const LoadingScreen = () => (
  <Surface style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" />
  </Surface>
);

export const RootNavigator = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { theme, isLoading: appLoading } = useApp();

  if (authLoading || appLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="App" component={AppStack} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
