import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getMetricColor, MetricColorKey } from '../../../theme';
import { getCurrentWeekStart } from '../../../core/constants/metrics';
import { Card } from '../../../components/common/atoms/Card';
import { spacing } from '../../../components/common/theme/spacing';

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
  const styles = createStyles(theme);

  const handlePress = () => {
    if (onPress) {
      onPress(getCurrentWeekStart());
    }
  };

  const renderContent = () => {
    if (loading) {
      return <Text style={styles.loadingText}>Loading...</Text>;
    }

    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }

    return (
      <>
        <MaterialCommunityIcons name={icon} size={24} color={metricColor} />
        <Text style={[styles.value, { color: theme.colors.onSurface }]}>
          {value}
        </Text>
        <Text style={[styles.title, { color: theme.colors.onSurfaceVariant }]}>
          {title}
        </Text>
      </>
    );
  };

  return (
    <Card
      style={[
        styles.container,
        { borderColor: metricColor },
      ]}
      onPress={handlePress}
      disabled={loading || !!error}
    >
      <View style={styles.content}>
        {renderContent()}
      </View>
    </Card>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    margin: spacing.sm,
    minHeight: 120,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    marginTop: spacing.sm,
    fontSize: 24,
    fontWeight: '600',
  },
  title: {
    marginTop: spacing.xs,
    fontSize: 14,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    padding: spacing.sm,
  },
  loadingText: {
    color: theme.colors.onSurface,
    textAlign: 'center',
    padding: spacing.sm,
  },
});
