import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type MetricType = 'steps' | 'distance' | 'flights';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  metricType: MetricType;
  loading?: boolean;
}

const getMetricColor = (type: MetricType): string => {
  switch (type) {
    case 'steps':
      return '#23C552';
    case 'distance':
      return '#88E0EF';
    case 'flights':
      return '#EE7752';
    default:
      return '#CCCCCC';
  }
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  metricType,
  loading = false,
}) => {
  const color = getMetricColor(metricType);

  if (loading) {
    return (
      <Card style={[styles.card, { borderColor: color }]}>
        <ActivityIndicator size="large" color={color} />
      </Card>
    );
  }

  return (
    <Card style={[styles.card, { borderColor: color }]}>
      <View style={styles.content}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 150,
    height: 150,
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    color: '#999',
    fontSize: 16,
  },
}); 