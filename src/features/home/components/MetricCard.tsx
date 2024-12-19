import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text, TouchableRipple, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getMetricColor, MetricColorKey } from '../../../theme';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  metricType: MetricColorKey;
  onPress?: () => void;
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
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.surfaceVariant,
        },
      ]}
      elevation={1}
    >
      <View style={styles.innerContainer}>
        <TouchableRipple
          onPress={onPress}
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
    borderRadius: 12,
    minHeight: 120,
    borderWidth: 1,
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
