import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Modal, Portal, Text, IconButton, Surface, useTheme, MD3Theme } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  
  // Generate labels for the past 6 days plus today
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

  const styles = StyleSheet.create({
    modalContainer: {
      margin: 0,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      padding: 24,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 2,
      borderColor: theme.colors.secondary,
    },
    closeButton: {
      position: 'absolute',
      right: 8,
      top: 8,
    },
    modalTitle: {
      marginTop: 8,
      marginBottom: 4,
    },
    modalValue: {
      marginBottom: 16,
    },
    chartContainer: {
      alignItems: 'center',
      marginVertical: 16,
    },
    additionalInfoContainer: {
      marginTop: 16,
      gap: 12,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  });

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.primaryContainer,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(32, 178, 170, ${opacity})`, // Light sea green
    labelColor: (opacity = 1) => theme.colors.onSurface,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#20B2AA', // Light sea green
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
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <Surface style={styles.modalContent} elevation={0}>
          <IconButton
            icon="close"
            size={24}
            onPress={onClose}
            style={styles.closeButton}
          />

          <Text variant="headlineMedium" style={styles.modalTitle}>
            {title}
          </Text>
          <Text variant="displaySmall" style={[styles.modalValue, { color: theme.colors.primary }]}>
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
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
          )}

          {additionalInfo && additionalInfo.length > 0 && (
            <Surface style={styles.additionalInfoContainer} elevation={0}>
              {additionalInfo.map((info, index) => (
                <View key={index} style={styles.infoRow}>
                  <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                    {info.label}
                  </Text>
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                    {info.value}
                  </Text>
                </View>
              ))}
            </Surface>
          )}
        </Surface>
      </Modal>
    </Portal>
  );
};
