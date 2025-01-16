import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { useHealthData } from '../../core/contexts/health/hooks/useHealthData';
import { MetricCard } from './MetricCard';
import { MetricModal } from './MetricModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from './LoadingScreen';
import { ErrorScreen } from './ErrorScreen';

type MetricType = 'steps' | 'distance' | 'calories' | 'heartRate';

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

const HomeScreen: React.FC = () => {
  const { metrics, loading, error, refresh, weeklyData, isInitialized } = useHealthData();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<ModalData | null>(null);

  const handleMetricPress = (type: MetricType) => {
    if (!metrics) return;

    const getWeeklyValue = (type: MetricType): number => {
      if (!weeklyData) return 0;
      switch (type) {
        case 'steps':
          return weeklyData.weeklySteps;
        case 'distance':
          return weeklyData.weeklyDistance;
        case 'calories':
          return weeklyData.weeklyCalories;
        case 'heartRate':
          return weeklyData.weeklyHeartRate;
        default:
          return 0;
      }
    };

    const weeklyValue = getWeeklyValue(type);
    const dailyAverage = weeklyValue / 7;

    const modalData: ModalData = {
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      value: metrics[type].toString(),
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        values: Array(7).fill(dailyAverage),
        startDate: weeklyData?.startDate ? new Date(weeklyData.startDate) : new Date()
      },
      additionalInfo: (() => {
        switch (type) {
          case 'steps':
            return [
              { label: 'Daily Average', value: Math.round(dailyAverage).toLocaleString() },
              { label: 'Weekly Total', value: Math.round(weeklyValue).toLocaleString() },
            ];
          case 'calories':
            return [
              { label: 'Daily Average', value: `${Math.round(dailyAverage)} cal` },
              { label: 'Weekly Total', value: `${Math.round(weeklyValue)} cal` },
            ];
          case 'distance':
            return [
              { label: 'Daily Average', value: `${dailyAverage.toFixed(2)} km` },
              { label: 'Weekly Total', value: `${weeklyValue.toFixed(2)} km` },
            ];
          case 'heartRate':
            return [
              { label: 'Current', value: `${metrics.heartRate} bpm` },
              { label: 'Average', value: `${Math.round(dailyAverage)} bpm` },
            ];
          default:
            return undefined;
        }
      })(),
    };

    setSelectedMetric(modalData);
    setModalVisible(true);
  };

  if (!isInitialized || (loading && !metrics)) {
    return <LoadingScreen message="Loading health data..." />;
  }

  if (error) {
    const errorMessage = (() => {
      switch (error.type) {
        case 'permissions':
          return 'Please grant health data permissions to continue';
        case 'validation':
          return 'Unable to validate health data. Please try again.';
        case 'data':
          return error.message || 'Failed to load health data';
        default:
          return 'An unexpected error occurred';
      }
    })();

    return (
      <ErrorScreen
        error={errorMessage}
        onRetry={refresh}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Health Metrics</Text>
        <View style={styles.grid}>
          <MetricCard
            title="Steps"
            value={metrics?.steps}
            icon="walk"
            metricType="steps"
            loading={loading}
            onPress={() => handleMetricPress('steps')}
          />
          <MetricCard
            title="Distance"
            value={metrics?.distance}
            icon="map-marker-distance"
            metricType="distance"
            loading={loading}
            onPress={() => handleMetricPress('distance')}
          />
          <MetricCard
            title="Calories"
            value={metrics?.calories}
            icon="fire"
            metricType="calories"
            loading={loading}
            onPress={() => handleMetricPress('calories')}
          />
          <MetricCard
            title="Heart Rate"
            value={metrics?.heartRate}
            icon="heart-pulse"
            metricType="heartRate"
            loading={loading}
            onPress={() => handleMetricPress('heartRate')}
          />
        </View>
        <Button 
          mode="outlined" 
          onPress={refresh}
          loading={loading}
          disabled={loading}
          style={styles.refreshButton}
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>

        {selectedMetric && (
          <MetricModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            title={selectedMetric.title}
            value={selectedMetric.value}
            data={selectedMetric.data}
            additionalInfo={selectedMetric.additionalInfo}
            metricType={selectedMetric.type}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#000',
  },
  errorText: {
    color: '#FF4B4B',
    marginBottom: 16,
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 24,
    marginBottom: 16,
  },
});

export default HomeScreen;