import React from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { MetricColorKey } from '../../../../theme';

export interface MetricIconProps {
  type: MetricColorKey;
  size: number;
  color: string;
}

export type MetricType = 'steps' | 'distance' | 'calories' | 'heart_rate';

export const getMetricIcon = (type: MetricType): string => {
  switch (type) {
    case 'steps':
      return 'walk';
    case 'distance':
      return 'map-marker-distance';
    case 'calories':
      return 'fire';
    case 'heart_rate':
      return 'heart-pulse';
    default:
      return 'help-circle';
  }
};

export const MetricIcon: React.FC<MetricIconProps> = ({
  type,
  size,
  color,
}) => {
  const getIconName = () => {
    switch (type) {
      case 'steps':
        return 'walk';
      case 'calories':
        return 'fire';
      case 'distance':
        return 'map-marker-distance';
      case 'heart_rate':
        return 'heart-pulse';
      default:
        return 'walk';
    }
  };

  return (
    <MaterialCommunityIcons
      name={getIconName()}
      size={size}
      color="#FFFFFF"
    />
  );
};