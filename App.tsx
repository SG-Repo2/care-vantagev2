import { LogBox, Platform } from 'react-native';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import useHealthData from './src/features/health/hooks/useHealthData';

export default function App() {
  const { steps, distance, flights } = useHealthData();

  return (
    <View style={styles.container}>
      <View style={styles.dataContainer}>
        <Text style={styles.label}>Steps</Text>
        <Text style={styles.value}>{steps}</Text>

        <Text style={styles.label}>Distance</Text>
        <Text style={styles.value}>{`${(distance / 1000).toFixed(2)} km`}</Text>

        <Text style={styles.label}>Flights Climbed</Text>
        <Text style={styles.value}>{flights}</Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataContainer: {
    padding: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 5,
  },
});
