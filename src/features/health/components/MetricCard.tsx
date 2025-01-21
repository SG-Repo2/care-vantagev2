import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface MetricCardProps {
  title: string;
  value: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  metricType: 'steps' | 'distance' | 'calories' | 'heart_rate';
  loading: boolean;
  onPress?: () => void;
  score?: number | null;
}

const getMetricColor = (type: MetricCardProps['metricType']): string => {
  switch (type) {
    case 'steps':
      return '#23C552';
    case 'distance':
      return '#88E0EF';
    case 'calories':
      return '#EE7752';
    case 'heart_rate':
      return '#FF4B4B';
    default:
      return '#CCCCCC';
  }
};

const formatValue = (value: number, type: MetricCardProps['metricType']): string => {
  if (value === 0) return '--';
  
  switch (type) {
    case 'distance':
      return value.toFixed(2);
    case 'heart_rate':
    case 'calories':
      return `${Math.round(value)}`;
    default:
      return `${value}`;
  }
};

const getUnit = (type: MetricCardProps['metricType']): string => {
  switch (type) {
    case 'distance':
      return 'km';
    case 'heart_rate':
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
  loading,
  onPress,
  score
}) => {
  const color = getMetricColor(metricType);
  const formattedValue = formatValue(value, metricType);
  const unit = getUnit(metricType);

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} style={[styles.card, { borderColor: color }]}>
          {children}
        </TouchableOpacity>
      );
    }
    return (
      <View style={[styles.card, { borderColor: color }]}>
        {children}
      </View>
    );
  };

  if (loading) {
    return (
      <Card style={[styles.card, { borderColor: color }]}>
        <View style={styles.content}>
          <ActivityIndicator size="small" color={color} />
          <Text style={styles.title}>{title}</Text>
          {score !== undefined && score !== null && (
            <Text style={[styles.score, { color }]}>Score: {score}</Text>
          )}
        </View>
      </Card>
    );
  }

  return (
    <Wrapper>
      <View style={styles.content}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color }]}>{formattedValue}</Text>
          {unit && formattedValue !== '--' && (
            <Text style={[styles.unit, { color }]}>{unit}</Text>
          )}
        </View>
        <Text style={styles.title}>{title}</Text>
        {score !== undefined && score !== null && (
          <Text style={[styles.score, { color }]}>Score: {score}</Text>
        )}
      </View>
    </Wrapper>
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
  score: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 4,
    fontWeight: '500',
  },
});