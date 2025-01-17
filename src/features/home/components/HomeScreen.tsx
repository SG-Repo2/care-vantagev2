import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useTheme, Text, Surface, ActivityIndicator, IconButton } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  SlideInDown 
} from 'react-native-reanimated';

import { useHealthData } from '../../../core/contexts/health/hooks/useHealthData';
import { formatDistance, formatScore } from '../../../core/utils/formatting';
import { MetricCard } from './MetricCard';
import { MetricModal } from './MetricModal';
import { Dimensions } from 'react-native';
import { HealthMetrics, WeeklyMetrics } from '../../../core/contexts/health/types';
import { TabParamList } from '../../../navigation/types';
import { MeasurementSystem } from '../../../core/types/base';
import GoalCelebration from './GoalCelebration';
import { useStyles } from '../styles/HomeScreen.styles';
import { useAuth } from '../../../core/auth/contexts/AuthContext';
import { METRICS } from '../../../core/constants/metrics';

// Define MetricType as the keys of HealthMetrics excluding metadata fields
type MetricType = 'steps' | 'distance' | 'calories' | 'heartRate';

const getCurrentWeekStart = () => {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

const DEFAULT_MEASUREMENT_SYSTEM: MeasurementSystem = 'imperial';
const GOALS = {
  steps: 10000,
  calories: 2500,
  distance: 5, // miles or km depending on measurement system
  heartRate: 120 // beats per minute
};

interface ModalData {
  type: MetricType;
  title: string;
  value: string | number;
  data?: {
    labels: string[];
    values: number[];
    startDate?: Date;
  };
  additionalInfo?: {
    label: string;
    value: string | number;
  }[];
}

type NavigationProp = NativeStackNavigationProp<TabParamList, 'Home'>;

const AnimatedSurface = Animated.createAnimatedComponent(Surface);

export const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const {
    metrics,
    loading,
    error,
    weeklyData,
    refresh,
    clearError,
    isInitialized,
    getWeeklyHistory
  } = useHealthData();
  const [refreshing, setRefreshing] = React.useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<ModalData | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousSteps, setPreviousSteps] = useState(0);

  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(metrics?.score ? 1 : 0.8) }],
    opacity: withSpring(metrics?.score ? 1 : 0.6),
  }));

  useEffect(() => {
    if (metrics?.steps && metrics.steps >= GOALS.steps && previousSteps < GOALS.steps) {
      setShowCelebration(true);
    }
    if (metrics?.steps) {
      setPreviousSteps(metrics.steps);
    }
  }, [metrics?.steps]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleLeaderboardPress = () => {
    if (metrics?.steps || metrics?.distance || metrics?.score) {
      navigation.navigate('Leaderboard');
    }
  };

  const handleMetricPress = async (type: MetricType) => {
    if (!metrics) return;

    try {
      // Get weekly history for the current week
      const today = new Date();
      const startDate = getCurrentWeekStart().toISOString();
      const endDate = today.toISOString();
      
      const weeklyHistory = await getWeeklyHistory(startDate, endDate);
      
      const getWeeklyValues = (): number[] => {
        if (!weeklyHistory) return Array(7).fill(0);
        
        const weeklyKey = `weekly${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof WeeklyMetrics;
        const weeklyValue = weeklyHistory[weeklyKey];
        return typeof weeklyValue === 'number' ? Array(7).fill(weeklyValue / 7) : Array(7).fill(0);
      };

      const weeklyValues = getWeeklyValues();
      const stats = {
        total: weeklyValues.reduce((a, b) => a + b, 0),
        avg: Math.round(weeklyValues.reduce((a, b) => a + b, 0) / 7),
        best: Math.max(...weeklyValues)
      };

      const modalData: ModalData = {
        type,
        title: type.charAt(0).toUpperCase() + type.slice(1),
        value: type === 'distance'
          ? formatDistance(Number(metrics[type]), DEFAULT_MEASUREMENT_SYSTEM)
          : metrics[type].toString(),
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          values: weeklyValues,
          startDate: weeklyHistory?.startDate ? new Date(weeklyHistory.startDate) : new Date()
        },
        additionalInfo: (() => {
          switch (type) {
            case 'steps':
              return [
                { label: 'Daily Average', value: stats.avg.toLocaleString() },
                { label: 'Best Day', value: stats.best.toLocaleString() },
              ];
            case 'calories':
              return [
                { label: 'Daily Average', value: `${stats.avg} cal` },
                { label: 'Best Day', value: `${stats.best} cal` },
                { label: 'Weekly Total', value: `${stats.total} cal` },
              ];
            case 'distance':
              return [
                { label: 'Daily Average', value: formatDistance(stats.avg, DEFAULT_MEASUREMENT_SYSTEM) },
                { label: 'Best Day', value: formatDistance(stats.best, DEFAULT_MEASUREMENT_SYSTEM) },
                { label: 'Weekly Total', value: formatDistance(stats.total, DEFAULT_MEASUREMENT_SYSTEM) },
              ];
            case 'heartRate':
              return [
                { label: 'Current', value: `${metrics.heartRate} bpm` },
                { label: 'Average', value: `${stats.avg} bpm` },
                { label: 'Peak', value: `${stats.best} bpm` },
              ];
            default:
              return undefined;
          }
        })(),
      };

      setSelectedMetric(modalData);
      setModalVisible(true);
    } catch (err) {
      console.error('Failed to fetch weekly history:', err);
      // Still show modal with current data
      const modalData: ModalData = {
        type,
        title: type.charAt(0).toUpperCase() + type.slice(1),
        value: type === 'distance'
          ? formatDistance(Number(metrics[type]), DEFAULT_MEASUREMENT_SYSTEM)
          : metrics[type].toString(),
        additionalInfo: type === 'heartRate' 
          ? [{ label: 'Current', value: `${metrics.heartRate} bpm` }]
          : undefined
      };
      setSelectedMetric(modalData);
      setModalVisible(true);
    }
  };

  if (!isInitialized || (loading && !refreshing)) {
    return (
      <AnimatedSurface
        style={[styles.container, styles.centered, styles.surface]}
        entering={SlideInDown}
      >
        <LinearGradient
          colors={[theme.colors.background, theme.colors.surface]}
          style={[styles.loadingGradient, { backgroundColor: theme.colors.surface }]}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your health data...</Text>
        </LinearGradient>
      </AnimatedSurface>
    );
  }

  if (error) {
    const errorMessage = (() => {
      switch (error.type) {
        case 'permissions':
          return 'Please grant health data permissions to continue';
        case 'initialization':
          return 'Unable to initialize health services';
        case 'data':
          return error.message || 'Failed to load health data';
        default:
          return 'An unexpected error occurred';
      }
    })();

    return (
      <AnimatedSurface
        style={[styles.container, styles.centered]}
        entering={SlideInDown}
      >
        <LinearGradient
          colors={[theme.colors.errorContainer, theme.colors.surface]}
          style={[styles.errorGradient, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={styles.errorText}>
            {errorMessage}
          </Text>
          <View style={styles.errorActions}>
            <IconButton
              icon="refresh"
              mode="contained"
              onPress={refresh}
              style={styles.retryButton}
            />
            <IconButton
              icon="close"
              mode="contained"
              onPress={clearError}
              style={styles.closeButton}
            />
          </View>
        </LinearGradient>
      </AnimatedSurface>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Animated.View style={[styles.header]} entering={SlideInDown}>
          <View style={styles.headerTop}>
            <Text variant="headlineMedium" style={styles.welcomeText}>
              Welcome back, {user?.displayName || 'User'}
            </Text>
            <IconButton
              icon="trophy"
              mode="contained"
              onPress={handleLeaderboardPress}
              style={styles.leaderboardButton}
              disabled={!metrics?.steps && !metrics?.distance && !metrics?.score}
            />
          </View>

          <Animated.View style={[styles.scoreContainer, scoreAnimatedStyle]}>
            <LinearGradient
              colors={[theme.colors.primaryContainer, theme.colors.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scoreGradient}
            >
              <Text variant="headlineMedium" style={[styles.dashboardTitle, { marginBottom: 4 }]}>
                Health Dashboard
              </Text>
              
              <View style={styles.metricsRow}>
                <View style={styles.metricColumn}>
                  <Text variant="titleMedium" style={styles.metricLabel}>Ranking</Text>
                  <Text variant="headlineSmall" style={styles.metricValue}>
                    #12
                  </Text>
                </View>
                
                <View style={styles.metricColumn}>
                  <Text variant="titleMedium" style={styles.metricLabel}>Score</Text>
                  <Text variant="headlineSmall" style={styles.metricValue}>
                    {metrics?.score || 0}
                  </Text>
                </View>
                
                <View style={styles.metricColumn}>
                  <Text variant="titleMedium" style={styles.metricLabel}>Streak</Text>
                  <Text variant="headlineSmall" style={styles.metricValue}>
                    5 🔥
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        <Animated.View 
          style={styles.metricsGrid}
          entering={SlideInDown.delay(200)}
        >
          <MetricCard
            title="Steps"
            value={(metrics?.steps || 0).toLocaleString()}
            icon="walk"
            metricType="steps"
            onPress={() => metrics && handleMetricPress('steps')}
            loading={loading}
            error={error}
            goal={GOALS.steps}
          />
          <MetricCard
            title="Calories"
            value={(metrics?.calories || 0).toLocaleString()}
            icon="fire"
            metricType="calories"
            onPress={() => metrics && handleMetricPress('calories')}
            loading={loading}
            error={error}
            goal={GOALS.calories}
          />
          <MetricCard
            title="Distance"
            value={formatDistance(metrics?.distance || 0, DEFAULT_MEASUREMENT_SYSTEM)}
            icon="map-marker-distance"
            metricType="distance"
            onPress={() => metrics && handleMetricPress('distance')}
            loading={loading}
            error={error}
            goal={GOALS.distance}
          />
          <MetricCard
            title="Heart Rate"
            value={`${metrics?.heartRate || 0} bpm`}
            icon="heart-pulse"
            metricType="heartRate"
            onPress={() => metrics && handleMetricPress('heartRate')}
            loading={loading}
            error={error}
            goal={GOALS.heartRate}
          />
        </Animated.View>

        {selectedMetric && (
          <MetricModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            title={selectedMetric?.title || ''}
            value={selectedMetric?.value || ''}
            data={selectedMetric?.data}
            additionalInfo={selectedMetric?.additionalInfo}
          />
        )}
      </ScrollView>

      <GoalCelebration 
        visible={showCelebration}
        onClose={() => setShowCelebration(false)}
        bonusPoints={5}
      />
    </View>
  );
};
