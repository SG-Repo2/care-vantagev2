import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Surface, ActivityIndicator } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';
import AuthService from '../services/authService';

const Stack = createNativeStackNavigator();

const LoadingScreen = () => (
  <Surface style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" />
  </Surface>
);

export const RootNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useApp();

  useEffect(() => {
    const checkInitialAuthStatus = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Check initial auth status
    checkInitialAuthStatus();

    // Set up auth state listener
    const unsubscribe = AuthService.addAuthStateListener((user) => {
      setIsAuthenticated(!!user);
    });

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  if (isLoading) {
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
