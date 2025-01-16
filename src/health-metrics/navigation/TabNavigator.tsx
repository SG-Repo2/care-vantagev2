import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import HomeScreen from '../components/HomeScreen';
import { ProfileScreen } from '../../features/profile/components/ProfileScreen';
import { HealthDataProvider } from '../../core/contexts/health/HealthDataContext';

const HomeScreenWithProvider = () => (
  <HealthDataProvider
    config={{
      enableBackgroundSync: true,
      syncInterval: 300000, // 5 minutes
    }}
    validateOnChange={true}
  >
    <HomeScreen />
  </HealthDataProvider>
);

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#23C552',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#333',
        },
        headerStyle: {
          backgroundColor: '#000',
        },
        headerTintColor: '#FFF',
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreenWithProvider}
        options={{
          title: 'Health Dashboard',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}; 