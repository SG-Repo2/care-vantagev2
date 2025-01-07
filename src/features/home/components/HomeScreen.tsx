import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useTheme, Text, Surface, ActivityIndicator, IconButton } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

// Default measurement system - TODO: Get from user preferences
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
    console.log('Metric pressed:', type);
    
    let modalData: ModalData = {
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      value: type === 'distance' ? formatDistance(metrics[type], DEFAULT_MEASUREMENT_SYSTEM) : metrics[type].toString(),
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        values: type === 'steps' ? metrics.weeklySteps : [0, 0, 0, 0, 0, 0, metrics[type]],
        startDate: type === 'steps' ? metrics.weekStartDate : undefined
      },
    };

    console.log('Setting modal data:', modalData);
    setSelectedMetric(modalData);
    setModalVisible(true);
    console.log('Modal visible state set to true');
  };

  if (loading && !refreshing) {
    return (
      <Surface style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Surface>
    );
  }

  if (error) {
    return (
      <Surface style={[styles.container, styles.centered]}>
        <Text variant="titleMedium" style={styles.errorText}>{error}</Text>
        <IconButton icon="refresh" onPress={refresh} />
      </Surface>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
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
          <View style={styles.scoreContainer}>
            <Text variant="titleLarge" style={styles.scoreLabel}>Score</Text>
            <Text variant="displaySmall" style={styles.scoreValue}>
              {metrics?.score || 0}
            </Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
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
        </View>

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
