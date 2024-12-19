import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { useTheme, Text, Surface, ActivityIndicator, IconButton } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useHealthData from '../../health/hooks/useHealthData';
import { formatDistance, formatScore } from '../../../core/utils/formatting';
import { MetricCard } from './MetricCard';
import { MetricModal } from './MetricModal';
import { HealthMetrics } from '../../profile/types/health';
import { AppStackParamList } from '../../../navigation/types';
import { MeasurementSystem } from '../../../core/types/base';

// TODO: Replace with actual user profile management
const MOCK_PROFILE_ID = 'test_user_1';
// TODO: Make this configurable per user's preference
const DEFAULT_MEASUREMENT_SYSTEM: MeasurementSystem = 'imperial';

type MetricType = 'steps' | 'distance' | 'score';

interface ModalData {
  type: MetricType;
  title: string;
  value: string | number;
  data?: {
    labels: string[];
    values: number[];
  };
  additionalInfo?: {
    label: string;
    value: string | number;
  }[];
}

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'Home'>;

export const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { metrics, loading, error, refresh } = useHealthData(MOCK_PROFILE_ID);
  const [refreshing, setRefreshing] = React.useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<ModalData | null>(null);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleMetricPress = (type: MetricType, metrics: HealthMetrics) => {
    let modalData: ModalData = {
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      value: type === 'distance' ? formatDistance(metrics[type], DEFAULT_MEASUREMENT_SYSTEM) : metrics[type].toString(),
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        values: [0, 0, 0, 0, 0, 0, metrics[type]],
      },
    };

    setSelectedMetric(modalData);
    setModalVisible(true);
  };

  if (loading && !refreshing) {
    return (
      <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Surface>
    );
  }

  if (error) {
    return (
      <Surface style={styles.errorContainer}>
        <Text variant="titleMedium" style={styles.errorText}>{error}</Text>
        <IconButton icon="refresh" onPress={refresh} />
      </Surface>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { flex: 1, backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text variant="headlineMedium">Health Dashboard</Text>
      </View>

      <View style={styles.metricsContainer}>
        <MetricCard
          title="Steps"
          value={metrics?.steps?.toLocaleString() || '0'}
          icon="walk"
          metricType="steps"
          onPress={() => metrics && handleMetricPress('steps', metrics)}
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
        <MetricCard
          title="Score"
          value={formatScore(metrics?.score || 0)}
          icon="star"
          metricType="score"
          onPress={() => metrics && handleMetricPress('score', metrics)}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginBottom: 16,
  },
  header: {
    padding: 16,
  },
  metricsContainer: {
    width: '100%',
    alignItems: 'stretch',
    gap: 16,
  },
});
