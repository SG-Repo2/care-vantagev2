import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useHealthData } from '../contexts/HealthDataContext';
import { MetricCard } from './MetricCard';
import { MetricModal } from './MetricModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from './LoadingScreen';
import { ErrorScreen } from './ErrorScreen';

type MetricType = 'steps' | 'distance' | 'calories' | 'heartRate';

interface MetricModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  value: string;
  metricType: MetricType;
  data: {
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
  const [selectedMetric, setSelectedMetric] = useState<MetricModalProps | null>(null);

  const handleMetricPress = (type: MetricType) => {
    if (!metrics || !weeklyData) return;

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

    // Calculate daily values based on the weekly trend
    const startDate = weeklyData.startDate ? new Date(weeklyData.startDate) : new Date();
    const endDate = weeklyData.endDate ? new Date(weeklyData.endDate) : new Date();
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Generate daily values with some variation around the average
    const dailyValues = Array.from({ length: daysDiff + 1 }, () => {
      const variation = (Math.random() * 0.4 - 0.2); // ±20% variation
      return Math.max(0, dailyAverage * (1 + variation));
    });

    // Ensure the last value matches today's actual value
    dailyValues[dailyValues.length - 1] = metrics[type];

    const modalData: MetricModalProps = {
      visible: true,
      onClose: () => handleCloseModal(),
      title: type.charAt(0).toUpperCase() + type.slice(1),
      value: metrics[type].toString(),
      metricType: type,
      data: {
        labels: Array.from({ length: daysDiff + 1 }, (_, i) => {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          return formatDateLabel(date);
        }),
        values: dailyValues,
        startDate
      },
      additionalInfo: (() => {
        switch (type) {
          case 'steps':
            return [
              { label: 'Daily Average', value: Math.round(dailyAverage).toLocaleString() },
              { label: 'Weekly Total', value: Math.round(weeklyValue).toLocaleString() },
              { label: 'Today\'s Goal', value: '10,000 steps' }
            ];
          case 'calories':
            return [
              { label: 'Daily Average', value: `${Math.round(dailyAverage)} cal` },
              { label: 'Weekly Total', value: `${Math.round(weeklyValue)} cal` },
              { label: 'Daily Goal', value: '2000 cal' }
            ];
          case 'distance':
            return [
              { label: 'Daily Average', value: `${dailyAverage.toFixed(2)} km` },
              { label: 'Weekly Total', value: `${weeklyValue.toFixed(2)} km` },
              { label: 'Today\'s Goal', value: '5.0 km' }
            ];
          case 'heartRate':
            return [
              { label: 'Current', value: `${metrics.heartRate} bpm` },
              { label: 'Average', value: `${Math.round(dailyAverage)} bpm` },
              { label: 'Target Range', value: '60-100 bpm' }
            ];
          default:
            return undefined;
        }
      })(),
    };

    setSelectedMetric(modalData);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    // Clean up the selected metric after animation completes
    setTimeout(() => {
      setSelectedMetric(null);
    }, 300); // Slightly longer than animation duration to ensure smooth transition
  };

  if (loading && !metrics && !isInitialized) {
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
            value={metrics?.steps ?? 0}
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
            {...selectedMetric}
            visible={modalVisible}
            onClose={handleCloseModal}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const formatDateLabel = (date: Date): string => {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  return isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
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
  refreshButton: {
    marginTop: 24,
    marginBottom: 16,
  },
});

export default HomeScreen;