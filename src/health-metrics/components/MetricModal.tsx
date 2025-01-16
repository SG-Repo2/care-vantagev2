import React from 'react';
import { View, Dimensions, Animated } from 'react-native';
import { Modal, Portal, Text, IconButton, useTheme } from 'react-native-paper';
import { LineChart, BarChart, ProgressChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../components/common/atoms/Card';
import { StyleSheet } from 'react-native';

export interface MetricModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  value: string | number;
  metricType: 'steps' | 'distance' | 'calories' | 'heartRate';
  data?: {
    labels: string[];
    values: number[];
    startDate?: Date;
  };
  additionalInfo?: Array<{
    label: string;
    value: string | number;
  }>;
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
  metricType,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const animatedStyle = {
    transform: [{ scale: animatedValue }],
    opacity: animatedValue,
  };

  const getMetricColor = (opacity = 1) => {
    switch (metricType) {
      case 'steps':
        return `rgba(35, 197, 82, ${opacity})`;
      case 'distance':
        return `rgba(136, 224, 239, ${opacity})`;
      case 'calories':
        return `rgba(238, 119, 82, ${opacity})`;
      case 'heartRate':
        return `rgba(255, 75, 75, ${opacity})`;
      default:
        return `rgba(255, 255, 255, ${opacity})`;
    }
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => getMetricColor(opacity),
    labelColor: () => theme.colors.onSurface,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: getMetricColor(1),
      fill: theme.colors.surface,
    },
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleClose}
        contentContainerStyle={[
          styles.modalContainer,
          { paddingBottom: insets.bottom, flex: 1 },
        ]}
      >
        <Animated.View style={animatedStyle}>
          <Card 
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <IconButton
              icon="close"
              size={24}
              onPress={handleClose}
              style={[styles.closeButton, { zIndex: 1 }]}
            />

            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={[styles.modalValue, { color: getMetricColor() }]}>{value}</Text>

            {data && data.values.length > 0 && (
              <>
                {metricType === 'calories' && (
                  <View style={styles.calorieCharts}>
                    <View style={styles.chartRow}>
                      <ProgressChart
                        data={{
                          labels: ['Progress'],
                          data: [data.values[data.values.length - 1] / 2000],
                          colors: [getMetricColor()]
                        }}
                        width={Dimensions.get('window').width - 48}
                        height={160}
                        chartConfig={{
                          ...chartConfig,
                          color: () => getMetricColor()
                        }}
                        hideLegend
                      />
                      <BarChart
                        data={{
                          labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'],
                          datasets: [{
                            data: [120, 300, 450, 600, 400, 200]
                          }]
                        }}
                        width={Dimensions.get('window').width - 48}
                        height={160}
                        chartConfig={{
                          ...chartConfig,
                          color: () => getMetricColor()
                        }}
                        yAxisLabel=""
                        yAxisSuffix=""
                        verticalLabelRotation={30}
                      />
                    </View>
                  </View>
                )}
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
              </>
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
        </Animated.View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    padding: 24,
    paddingTop: 32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  modalValue: {
    fontSize: 40,
    fontWeight: '800',
    marginBottom: 24,
    letterSpacing: -1,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 24,
    overflow: 'hidden',
  },
  additionalInfoContainer: {
    marginTop: 24,
    gap: 16,
    padding: 16,
    borderRadius: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.6,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  calorieCharts: {
    marginBottom: 16,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
}); 