import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '@react-navigation/native';
import { ExtendedTheme } from '../theme';
import { HomeScreen } from '../features/home/components/HomeScreen';
import { LeaderboardScreen } from '../features/leaderboard/components/LeaderboardScreen';
import { ProfileScreen } from '../features/profile/components/ProfileScreen';
import { HealthDataProvider } from '../core/contexts/health/HealthDataContext';

const HomeScreenWithProvider = () => (
  <HealthDataProvider>
    <HomeScreen />
  </HealthDataProvider>
);

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  const theme = useTheme() as unknown as ExtendedTheme;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Health Dashboard',
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
};
