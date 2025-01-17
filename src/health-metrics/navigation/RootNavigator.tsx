import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SignInScreen } from '../components/SignInScreen';
import { TabNavigator } from './TabNavigator';
import type { Theme } from '@react-navigation/native';
import { RootStackParamList } from './types';
import { useAuth } from '../contexts/AuthContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  navigationTheme: Theme;
}

export const RootNavigator: React.FC<RootNavigatorProps> = ({ navigationTheme }) => {
  const { status } = useAuth();

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: 'fade'
        }}
      >
        {status === 'authenticated' ? (
          <Stack.Screen 
            name="MainApp" 
            component={TabNavigator} 
          />
        ) : (
          <Stack.Screen 
            name="SignIn" 
            component={SignInScreen} 
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 