import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { useAuth } from '../core/auth/contexts/AuthContext';
import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const LoadingScreen = () => {
  const { theme } = useApp();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
        Loading...
      </Text>
    </View>
  );
};

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { theme } = useApp();
  const { user, isLoading, error } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    console.error('Auth error:', error);
  }

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen
            name="App"
            component={AppStack}
            options={{ animation: 'fade' }}
          />
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthStack}
            options={{ animation: 'fade' }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});
