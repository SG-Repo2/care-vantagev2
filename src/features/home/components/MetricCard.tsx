import React from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useStyles } from '../styles/MetricCard.styles';
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
  const styles = useStyles();

  const handlePress = () => {
    console.log('Card pressed - metric:', metricType);
    if (onPress) {
      console.log('Calling onPress handler with startDate:', getCurrentWeekStart());
      onPress(getCurrentWeekStart());
    } else {
      console.warn('No onPress handler provided for metric:', metricType);
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
        <MaterialCommunityIcons name={icon} size={32} color={metricColor} />
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
        { borderColor: metricColor }
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
