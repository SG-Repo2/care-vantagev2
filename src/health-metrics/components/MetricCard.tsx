import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type MetricType = 'steps' | 'distance' | 'calories' | 'heartRate';

interface MetricCardProps {
  title: string;
  value: number | undefined;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  metricType: MetricType;
  loading?: boolean;
  unit?: string;
}

const getMetricColor = (type: MetricType): string => {
  switch (type) {
    case 'steps':
      return '#23C552';
    case 'distance':
      return '#88E0EF';
    case 'calories':
      return '#EE7752';
    case 'heartRate':
      return '#FF4B4B';
    default:
      return '#CCCCCC';
  }
};

const formatValue = (value: number | undefined, type: MetricType): string => {
  if (value === undefined || value === 0) return '--';
  
  switch (type) {
    case 'distance':
      return `${(value / 1000).toFixed(2)}`;
    case 'heartRate':
    case 'calories':
      return `${Math.round(value)}`;
    default:
      return `${value}`;
  }
};

const getUnit = (type: MetricType): string => {
  switch (type) {
    case 'distance':
      return 'km';
    case 'heartRate':
      return 'bpm';
    case 'calories':
      return 'kcal';
    default:
      return '';
  }
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  metricType,
  loading = false,
  unit: customUnit,
}) => {
  const color = getMetricColor(metricType);
  const formattedValue = formatValue(value, metricType);
  const unit = customUnit || getUnit(metricType);

  if (loading) {
    return (
      <Card style={[styles.card, { borderColor: color }]}>
        <View style={styles.content}>
          <ActivityIndicator size="small" color={color} />
          <Text style={styles.title}>{title}</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, { borderColor: color }]}>
      <View style={styles.content}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color }]}>{formattedValue}</Text>
          {unit && formattedValue !== '--' && (
            <Text style={[styles.unit, { color }]}>{unit}</Text>
          )}
        </View>
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
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 14,
    opacity: 0.8,
  },
  title: {
    color: '#999',
    fontSize: 16,
  },
}); 