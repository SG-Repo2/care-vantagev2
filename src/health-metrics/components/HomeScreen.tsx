import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useHealthData } from '../hooks/useHealthData';
import { MetricCard } from '../components/MetricCard';
import { RingProgress } from '../components/RingProgress';

const STEPS_GOAL = 10000;

export const HomeScreen = () => {
  const [date, setDate] = useState(new Date());
  const { metrics, loading, error, refresh } = useHealthData(date);

  const changeDate = (numDays: number) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + numDays);
    setDate(newDate);
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Error: {error.message}</Text>
        <IconButton icon="refresh" onPress={refresh} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.dateSelector}>
        <IconButton icon="chevron-left" onPress={() => changeDate(-1)} />
        <Text style={styles.dateText}>{date.toDateString()}</Text>
        <IconButton icon="chevron-right" onPress={() => changeDate(1)} />
      </View>

      <RingProgress
        progress={(metrics?.steps || 0) / STEPS_GOAL}
        radius={120}
        strokeWidth={40}
      />

      <View style={styles.metrics}>
        <MetricCard
          title="Steps"
          value={metrics?.steps || 0}
          icon="walk"
          metricType="steps"
          loading={loading}
        />
        <MetricCard
          title="Distance"
          value={((metrics?.distance || 0) / 1000).toFixed(2)}
          icon="map-marker-distance"
          metricType="distance"
          loading={loading}
        />
        <MetricCard
          title="Flights"
          value={metrics?.flights || 0}
          icon="stairs"
          metricType="flights"
          loading={loading}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
    justifyContent: 'center',
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
  },
}); 