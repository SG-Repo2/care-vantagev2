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

import useHealthData from '../../health/hooks/useHealthData';
import { formatDistance, formatScore } from '../../../core/utils/formatting';
import { MetricCard } from './MetricCard';
import { MetricModal } from './MetricModal';
import { HealthMetrics, WeeklyMetrics } from '../../health/types/health';
import { TabParamList } from '../../../navigation/types';
import { MeasurementSystem } from '../../../core/types/base';
import GoalCelebration from './GoalCelebration';
import { useStyles } from '../styles/HomeScreen.styles';
import { useAuth } from '../../../context/AuthContext';
import { METRICS } from '../../../core/constants/metrics';
import { MetricType } from '../../health/types/health';

const DEFAULT_MEASUREMENT_SYSTEM: MeasurementSystem = 'imperial';

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
  const { metrics, loading, error, refresh } = useHealthData(user?.id || '');
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
    if (metrics?.steps && metrics.steps >= 10000 && previousSteps < 10000) {
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

  const handleMetricPress = (type: MetricType, metrics: HealthMetrics & WeeklyMetrics) => {
    let modalData: ModalData = {
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      value: type === 'distance' 
        ? formatDistance(metrics[type], DEFAULT_MEASUREMENT_SYSTEM) 
        : metrics[type].toString(),
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        values: type === 'steps' 
          ? metrics.weeklySteps 
          : [0, 0, 0, 0, 0, 0, metrics[type]],
        startDate: type === 'steps' ? metrics.weekStartDate : undefined
      },
    };

    setSelectedMetric(modalData);
    setModalVisible(true);
  };

  if (loading && !refreshing) {
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
    return (
      <AnimatedSurface 
        style={[styles.container, styles.centered]}
        entering={SlideInDown}
      >
        <LinearGradient
          colors={[theme.colors.errorContainer, theme.colors.surface]}
          style={[styles.errorGradient, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={styles.errorText}>{error}</Text>
          <IconButton 
            icon="refresh" 
            mode="contained"
            onPress={refresh}
            style={styles.retryButton}
          />
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
            <Text variant="headlineMedium" style={styles.title}>
              Health Dashboard
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
              <Text variant="titleLarge" style={styles.scoreLabel}>Score</Text>
              <Text variant="displaySmall" style={styles.scoreValue}>
                {metrics?.score || 0}
              </Text>
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
            onPress={() => metrics && handleMetricPress('steps', metrics)}
            loading={loading}
            error={error}
          />
          <MetricCard
            title="Calories"
            value={(metrics?.calories || 0).toLocaleString()}
            icon="fire"
            metricType="calories"
            onPress={() => metrics && handleMetricPress('calories', metrics)}
            loading={loading}
            error={error}
          />
          <MetricCard
            title="Distance"
            value={formatDistance(metrics?.distance || 0, DEFAULT_MEASUREMENT_SYSTEM)}
            icon="map-marker-distance"
            metricType="distance"
            onPress={() => metrics && handleMetricPress('distance', metrics)}
            loading={loading}
            error={error}
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