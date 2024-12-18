import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

interface MetricCardProps {
  label: string;
  value: string | number;
  onPress?: () => void;
  style?: object;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <View style={[styles.metricCard, style]}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
});
