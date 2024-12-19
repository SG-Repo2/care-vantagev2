import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList } from './types';
import { HomeScreen } from '../features/home/components/HomeScreen';
import { useTheme } from 'react-native-paper';

const Stack = createNativeStackNavigator<AppStackParamList>();

// Placeholder component - you'll need to create this
const ProfileScreen = () => null;

export const AppStack = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Health Dashboard',
        }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Stack.Navigator>
  );
};
