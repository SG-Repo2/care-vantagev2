import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { 
  createStackNavigator, 
  CardStyleInterpolators,
  StackNavigationOptions,
  StackScreenProps 
} from '@react-navigation/stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import { useAuthContext } from '../features/auth/contexts/AuthContext';
import { darkTheme } from '../constants/theme';
import LoadingScreen from '../screens/LoadingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { LinkingOptions } from '@react-navigation/native';

// Screen imports
import DashboardScreen from '../screens/DashboardScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import SettingsScreen from '../features/profile/screens/SettingsScreen';
import StatisticsScreen from '../features/health/screens/StatisticsScreen';
import { MetricDetailScreen } from '../features/health/screens';
import { HealthMetricType } from '../services/api/types';

// Import types
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  Profile: undefined;
  Dashboard: undefined;
  Settings: undefined;
  Statistics: { period?: string };
  MetricDetail: { 
    metricType: HealthMetricType;
    timeRange?: 'day' | 'week' | 'month';
  };
};

export type MetricDetailScreenProps = StackScreenProps<AppStackParamList, 'MetricDetail'>;

const AuthStack = createStackNavigator<AuthStackParamList>();
const AppStack = createStackNavigator<AppStackParamList>();

const screenTransitionConfig: StackNavigationOptions = {
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
};

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['carevantage://', 'https://carevantage.app'],
  config: {
    initialRouteName: 'Auth',
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register'
        }
      },
      App: {
        screens: {
          Profile: 'profile',
          Dashboard: 'dashboard',
          Settings: 'settings',
          Statistics: {
            path: 'statistics/:period?',
            parse: {
              period: (period: string) => period
            }
          },
          MetricDetail: {
            path: 'metric/:metricType/:timeRange?',
            parse: {
              metricType: (type: string) => type as HealthMetricType,
              timeRange: (range: string) => range as 'day' | 'week' | 'month'
            }
          }
        }
      }
    }
  },
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (url != null) {
      return url;
    }

    // Check if app was opened from a notification
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response?.notification.request.content.data?.url) {
      return response.notification.request.content.data.url;
    }
    return null;
  },
};

const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: darkTheme.colors.background },
      ...screenTransitionConfig,
    }}
  >
    <AuthStack.Screen 
      name="Login" 
      component={LoginScreen} 
      options={{
        gestureEnabled: false
      }}
    />
    <AuthStack.Screen 
      name="Register" 
      component={RegisterScreen} 
      options={{
        gestureEnabled: false
      }}
    />
  </AuthStack.Navigator>
);

const AppStackNavigator = () => (
  <AppStack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: darkTheme.colors.background },
      ...screenTransitionConfig,
    }}
    initialRouteName="Profile"
  >
    <AppStack.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ gestureEnabled: false }}
    />
    <AppStack.Screen 
      name="Dashboard" 
      component={DashboardScreen}
      options={{ gestureEnabled: false }}
    />
    <AppStack.Screen 
      name="Settings" 
      component={SettingsScreen} 
    />
    <AppStack.Screen 
      name="Statistics" 
      component={StatisticsScreen}
    />
    <AppStack.Screen 
      name="MetricDetail" 
      component={MetricDetailScreen as React.ComponentType<any>}
    />
  </AppStack.Navigator>
);

const RootStack = createStackNavigator<RootStackParamList>();

const NAVIGATION_PERSISTENCE_KEY = 'navigation-state-v2';

const AppNavigator = () => {
  const { currentUser, loading } = useAuthContext();
  const [initialState, setInitialState] = React.useState<any>(undefined);

  React.useEffect(() => {
    const loadNavigationState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(NAVIGATION_PERSISTENCE_KEY);
        if (savedState) {
          const state = JSON.parse(savedState);
          setInitialState(state);
        }
      } catch (err) {
        console.warn('Failed to load navigation state:', err);
      }
    };
    loadNavigationState();
  }, []);

  React.useEffect(() => {
    // Handle notification deep links
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const url = response.notification.request.content.data?.url;
      if (url) {
        try {
          Linking.openURL(url);
        } catch (err) {
          console.warn('Failed to open notification URL:', err);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  const handleStateChange = React.useCallback(async (state: any) => {
    try {
      await AsyncStorage.setItem(NAVIGATION_PERSISTENCE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Failed to save navigation state:', err);
    }
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer
      linking={linking}
      fallback={<LoadingScreen />}
      initialState={initialState}
      onStateChange={handleStateChange}
    >
      <RootStack.Navigator 
        screenOptions={{ 
          headerShown: false,
          ...screenTransitionConfig
        }}
      >
        {!currentUser ? (
          <RootStack.Screen 
            name="Auth" 
            component={AuthNavigator}
            options={{
              animationTypeForReplace: !currentUser ? 'pop' : 'push',
              gestureEnabled: false
            }}
          />
        ) : (
          <RootStack.Screen 
            name="App" 
            component={AppStackNavigator}
            options={{
              gestureEnabled: false
            }}
          />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
