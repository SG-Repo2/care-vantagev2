import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { useTheme, Text, Surface, ActivityIndicator, IconButton } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useHealthData from '../../health/hooks/useHealthData';
import { formatDistance } from '../../../core/utils/formatting';
import { MetricCard } from './MetricCard';
import { MetricModal } from './MetricModal';
import { HealthMetrics } from '../../profile/types/health';
import { AppStackParamList } from '../../../navigation/types';

// TODO: Replace with actual user profile management
const MOCK_PROFILE_ID = 'test_user_1';

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
    let modalData: ModalData;

    switch (type) {
      case 'steps':
        modalData = {
          type,
          title: 'Daily Steps',
          value: metrics.steps,
          additionalInfo: [
            { label: 'Goal', value: '10,000 steps' },
            { label: 'Distance', value: formatDistance(metrics.distance, 'metric') },
          ],
        };
        break;

      case 'distance':
        modalData = {
          type,
          title: 'Distance Walked',
          value: formatDistance(metrics.distance, 'metric'),
          additionalInfo: [
            { label: 'Steps', value: metrics.steps },
          ],
        };
        break;

      case 'score':
        modalData = {
          type,
          title: 'Health Score',
          value: `${metrics.score?.overall}/100`,
          additionalInfo: [
            { label: 'Steps Score', value: `${metrics.score?.categories.steps}/100` },
            { label: 'Distance Score', value: `${metrics.score?.categories.distance}/100` },
            { label: 'Daily Victory', value: metrics.score?.dailyVictory ? 'Yes! 🎉' : 'Not Yet' },
          ],
        };
        break;

      default:
        return;
    }

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
      <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
      </Surface>
    );
  }

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        <View style={styles.dataContainer}>
          <Text variant="headlineMedium" style={styles.title}>Daily Health Metrics</Text>

          <MetricCard
            label="Steps"
            value={metrics?.steps || 0}
            onPress={() => metrics && handleMetricPress('steps', metrics)}
            icon="walk"
          />

          <MetricCard
            label="Distance"
            value={metrics ? formatDistance(metrics.distance, 'metric') : '0 km'}
            onPress={() => metrics && handleMetricPress('distance', metrics)}
            icon="map-marker-distance"
          />

          {metrics?.score && (
            <MetricCard
              label="Health Score"
              value={`${metrics.score.overall}/100`}
              onPress={() => handleMetricPress('score', metrics)}
              style={styles.scoreCard}
              icon="star"
            />
          )}
        </View>
      </ScrollView>
      {selectedMetric && (
        <MetricModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title={selectedMetric.title}
          value={selectedMetric.value}
          data={selectedMetric.data}
          additionalInfo={selectedMetric.additionalInfo}
        />
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  content: {
    padding: 16,
  },
  dataContainer: {
    width: '100%',
    alignItems: 'stretch',
    gap: 16,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  error: {
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  scoreCard: {
    marginTop: 8,
  },
});
