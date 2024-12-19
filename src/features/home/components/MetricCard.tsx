import React from 'react';
import { StyleSheet } from 'react-native';
import { Surface, Text, TouchableRipple, useTheme, Icon } from 'react-native-paper';

interface MetricCardProps {
  label: string;
  value: string | number;
  onPress?: () => void;
  style?: object;
  icon?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  onPress,
  style,
  icon,
}) => {
  const theme = useTheme();

  return (
    <TouchableRipple
      onPress={onPress}
      disabled={!onPress}
      rippleColor={theme.colors.primary}
    >
      <Surface
        style={[
          styles.metricCard,
          {
            backgroundColor: theme.colors.surface,
            elevation: 1,
          },
          style,
        ]}
      >
        <Icon source={icon || 'chart-box'} size={24} color={theme.colors.primary} />
        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
          {value}
        </Text>
      </Surface>
    </TouchableRipple>
  );
};

const styles = StyleSheet.create({
  metricCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
});
