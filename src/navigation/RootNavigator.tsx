import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';
import { ActivityIndicator, View } from 'react-native';

// Inline LoadingScreen component until we create a separate one
const LoadingScreen = () => {
  const { theme } = useApp();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
};

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { theme } = useApp();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="App" component={AppStack} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
