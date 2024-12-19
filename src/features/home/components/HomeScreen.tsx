import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import useHealthData from '../../health/hooks/useHealthData';
import { formatDistance } from '../../../core/utils/formatting';
import { MetricCard } from './MetricCard';
import { MetricModal } from './MetricModal';
import { HealthMetrics } from '../../profile/types/health';

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

export const HomeScreen: React.FC = () => {
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.dataContainer}>
          <Text style={styles.title}>Daily Health Metrics</Text>

          <MetricCard
            label="Steps"
            value={metrics?.steps || 0}
            onPress={() => metrics && handleMetricPress('steps', metrics)}
          />

          <MetricCard
            label="Distance"
            value={metrics ? formatDistance(metrics.distance, 'metric') : '0 km'}
            onPress={() => metrics && handleMetricPress('distance', metrics)}
          />

          {metrics?.score && (
            <MetricCard
              label="Health Score"
              value={`${metrics.score.overall}/100`}
              onPress={() => handleMetricPress('score', metrics)}
              style={styles.scoreCard}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  dataContainer: {
    width: '90%',
    alignItems: 'stretch',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  error: {
    color: '#ff0000',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  scoreCard: {
    marginTop: 20,
    backgroundColor: '#f8f9ff',
    borderWidth: 1,
    borderColor: '#e0e0ff',
  },
});
