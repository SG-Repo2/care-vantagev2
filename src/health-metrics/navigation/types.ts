import { NavigatorScreenParams } from '@react-navigation/native';

export type HealthMetricsTabParamList = {
  Home: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

export type HealthMetricsStackParamList = {
  MainTabs: NavigatorScreenParams<HealthMetricsTabParamList>;
};