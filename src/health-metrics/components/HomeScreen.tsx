import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useHealthData } from '../contexts/HealthDataContext';

const HomeScreen: React.FC = () => {
  const { metrics, loading, error, refresh } = useHealthData();

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return (
      <View>
        <Text>Error: {error.message}</Text>
        <Text onPress={refresh}>Retry</Text>
      </View>
    );
  }

  if (!metrics) {
    return <Text>No data yet. Please refresh.</Text>;
  }

  return (
    <View style={styles.container}>
      <Text>Steps: {metrics.steps}</Text>
      <Text>Distance: {metrics.distance} km</Text>
      <Text>Calories: {metrics.calories}</Text>
      <Text>Heart Rate: {metrics.heartRate}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;