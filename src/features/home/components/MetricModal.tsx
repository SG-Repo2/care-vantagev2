import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Modal, Portal, Text, IconButton, useTheme } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../../components/common/atoms/Card';
import { spacing } from '../../../components/common/theme/spacing';

interface MetricModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  value: string | number;
  data?: {
    labels: string[];
    values: number[];
    startDate?: Date;
  };
  additionalInfo?: {
    label: string;
    value: string | number;
  }[];
}

const formatDateLabel = (date: Date): string => {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  return isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
};

const generateWeekLabels = (startDate: Date): string[] => {
  const labels: string[] = [];
  const currentDate = new Date(startDate);
  
  for (let i = 0; i < 7; i++) {
    labels.push(formatDateLabel(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return labels;
};

export const MetricModal: React.FC<MetricModalProps> = ({
  visible,
  onClose,
  title,
  value,
  data,
  additionalInfo,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.primaryContainer,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(32, 178, 170, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.onSurface,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#20B2AA',
      fill: theme.colors.surface,
    },
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[
          styles.modalContainer,
          { paddingBottom: insets.bottom },
        ]}
      >
        <Card style={styles.modalContent}>
          <IconButton
            icon="close"
            size={24}
            onPress={onClose}
            style={styles.closeButton}
          />

          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={[styles.modalValue, { color: theme.colors.primary }]}>
            {value}
          </Text>

          {data && data.values.length > 0 && (
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: data.startDate ? generateWeekLabels(data.startDate) : data.labels,
                  datasets: [{ data: data.values }],
                }}
                width={Dimensions.get('window').width - 48}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </View>
          )}

          {additionalInfo && additionalInfo.length > 0 && (
            <View style={styles.additionalInfoContainer}>
              {additionalInfo.map((info, index) => (
                <View key={index} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{info.label}</Text>
                  <Text style={styles.infoValue}>{info.value}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      </Modal>
    </Portal>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  modalContainer: {
    margin: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    padding: spacing.xl,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    color: theme.colors.onSurface,
  },
  modalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: 16,
  },
  additionalInfoContainer: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  infoValue: {
    fontSize: 18,
    color: theme.colors.onSurface,
  },
});
