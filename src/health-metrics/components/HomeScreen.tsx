import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useHealthData } from '../hooks/useHealthData';
import { MetricCard } from './MetricCard';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen: React.FC = () => {
  const { metrics, loading, error, refresh } = useHealthData();

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
        <Button mode="contained" onPress={refresh}>
          Retry
        </Button>
      </SafeAreaView>
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
        <Button 
          mode="outlined" 
          onPress={refresh}
          style={styles.refreshButton}
        >
          Refresh Data
        </Button>
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