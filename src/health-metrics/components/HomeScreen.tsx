import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useHealthData } from '../contexts/HealthDataContext';
import { MetricCard } from './MetricCard';
import { RingProgress } from './RingProgress';

const STEPS_GOAL = 10000;

export const HomeScreen = () => {
  const { metrics, loading, error, refresh } = useHealthData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>
          {error.type === 'permissions' 
            ? 'Please enable health permissions in your device settings'
            : `Unable to fetch health data: ${error.message}`}
        </Text>
        <IconButton icon="refresh" onPress={refresh} />
      </View>
    );
  }

  const stepsProgress = metrics ? (metrics.steps || 0) / STEPS_GOAL : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing || loading}
          onRefresh={handleRefresh}
          tintColor="#fff"
          titleColor="#fff"
        />
      }
    >
      <View style={styles.dateSelector}>
        <Text style={styles.dateText}>{new Date().toDateString()}</Text>
      </View>

      <RingProgress
        progress={Math.min(stepsProgress, 1)}
        radius={120}
        strokeWidth={40}
      />

      <View style={styles.metrics}>
        <MetricCard
          title="Steps"
          value={metrics?.steps}
          icon="walk"
          metricType="steps"
          loading={loading}
        />
        <MetricCard
          title="Distance"
          value={metrics?.distance}
          icon="map-marker-distance"
          metricType="distance"
          loading={loading}
        />
        <MetricCard
          title="Calories"
          value={metrics?.calories}
          icon="fire"
          metricType="calories"
          loading={loading}
        />
        <MetricCard
          title="Heart Rate"
          value={metrics?.heartRate}
          icon="heart-pulse"
          metricType="heartRate"
          loading={loading}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentContainer: {
    padding: 16,
    justifyContent: 'center',
    minHeight: '100%',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dateText: {
    color: '#fff',
    fontSize: 20,
    marginHorizontal: 10,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 40,
    gap: 16,
  },
  error: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 10,
    padding: 16,
  },
}); 