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

type MetricType = 'steps' | 'distance' | 'flights' | 'score';

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
            { label: 'Flights Climbed', value: metrics.flights },
          ],
        };
        break;

      case 'flights':
        modalData = {
          type,
          title: 'Flights Climbed',
          value: metrics.flights,
          additionalInfo: [
            { label: 'Elevation', value: `${metrics.flights * 3}m` },
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
            { label: 'Activity Score', value: `${metrics.score?.categories.activity}/100` },
            { label: 'Cardio Score', value: `${metrics.score?.categories.cardio}/100` },
            { label: 'Sleep Score', value: `${metrics.score?.categories.sleep}/100` },
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
    <>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
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

            <MetricCard
              label="Flights Climbed"
              value={metrics?.flights || 0}
              onPress={() => metrics && handleMetricPress('flights', metrics)}
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
          <StatusBar style="auto" />
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
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
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
