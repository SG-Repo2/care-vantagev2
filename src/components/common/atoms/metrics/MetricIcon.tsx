import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MetricColorKey } from '../../../../theme';

export interface MetricIconProps {
  type: MetricColorKey;
  size: number;
  color: string;
}

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
      case 'heartRate':
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