import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import HomeScreen from '../components/HomeScreen';
import { LeaderboardScreen } from '../../features/leaderboard/components/LeaderboardScreen';
import { ProfileScreen } from '../../features/profile/components/ProfileScreen';
import { HealthMetricsTabParamList } from './types';
import { HealthDataProvider } from '../contexts/HealthDataContext';
import { View } from 'react-native';

const Tab = createBottomTabNavigator<HealthMetricsTabParamList>();

const HomeScreenWithProvider = () => (
  <HealthDataProvider
    config={{
      enableBackgroundSync: true,
      syncInterval: 300000, // 5 minutes
    }}
  >
    <HomeScreen />
  </HealthDataProvider>
);

// Wrapper component to provide navigation prop to ProfileScreen
const ProfileScreenWrapper = ({ navigation }: any) => {
  // Create a wrapper View to ensure proper layout
  return (
    <View style={{ flex: 1 }}>
      <ProfileScreen 
        navigation={navigation} 
      />
    </View>
  );
};

export const TabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreenWithProvider}
        options={{
          title: 'Health Metrics',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart-pulse" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreenWrapper}
        options={{
          title: 'My Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
          // Add header options specific to profile
          headerRight: () => null, // Remove any existing header right component
        }}
      />
    </Tab.Navigator>
  );
};