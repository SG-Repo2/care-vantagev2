import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text, TouchableRipple, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getMetricColor, MetricColorKey } from '../../../theme';
import { getCurrentWeekStart } from '../../../core/constants/metrics';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  metricType: MetricColorKey;
  onPress?: (startDate?: Date) => void;
  loading?: boolean;
  error?: string | null;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  metricType,
  onPress,
  loading,
  error,
}) => {
  const theme = useTheme();
  const metricColor = getMetricColor(metricType);
  const surfaceColor = theme.colors.surface;
  const borderColor = theme.colors.secondary;
  const borderWidth = 2;
  
  const handlePress = () => {
    if (onPress) {
      onPress(getCurrentWeekStart());
    }
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={metricColor} />;
    }

    if (error) {
      return <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>;
    }

    return (
      <>
        <MaterialCommunityIcons name={icon} size={24} color={metricColor} />
        <Text variant="titleLarge" style={[styles.value, { color: theme.colors.onSurface }]}>
          {value}
        </Text>
        <Text variant="labelMedium" style={[styles.title, { color: theme.colors.onSurfaceVariant }]}>
          {title}
        </Text>
      </>
    );
  };

  return (
    <Surface
      style={[
        styles.container,
        {
          backgroundColor: surfaceColor,
          borderColor: borderColor,
          shadowColor: metricColor,
        },
      ]}
      elevation={2}
    >
      <View style={styles.innerContainer}>
        <TouchableRipple
          onPress={handlePress}
          style={styles.touchable}
          rippleColor={metricColor}
          disabled={loading || !!error}
        >
          <>{renderContent()}</>
        </TouchableRipple>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    minHeight: 120,
    borderWidth: 2,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  innerContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
  },
  touchable: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    marginTop: 8,
    fontWeight: '600',
  },
  title: {
    marginTop: 4,
  },
  errorText: {
    textAlign: 'center',
    padding: 8,
  },
});
