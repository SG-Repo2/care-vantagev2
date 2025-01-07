import React from 'react';
import { StyleSheet, TextStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MetricColorKey } from '../../../../theme';

export interface MetricValueProps {
  value: number | string;
  type: MetricColorKey;
  formatter?: (value: number | string) => string;
  style?: TextStyle;
}

export const MetricValue: React.FC<MetricValueProps> = ({
  value,
  type,
  formatter,
  style,
}) => {
  const theme = useTheme();

  const formattedValue = React.useMemo(() => {
    if (formatter) {
      return formatter(value);
    }

    // Default formatting based on type
    if (typeof value === 'number') {
      switch (type) {
        case 'steps':
          return value.toLocaleString();
        case 'calories':
          return Math.round(value).toLocaleString();
        case 'distance':
          return value.toFixed(2);
        default:
          return value.toString();
      }
    }

    return value;
  }, [value, type, formatter]);

  return (
    <Text
      style={[
        styles.value,
        {
          color: theme.colors.onPrimary,
          textShadowColor: 'rgba(0, 0, 0, 0.2)',
        },
        style,
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
    >
      {formattedValue}
    </Text>
  );
};

const styles = StyleSheet.create({
  value: {
    fontWeight: '800',
    textAlign: 'right',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});