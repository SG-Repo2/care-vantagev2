import React from 'react';
import { View, Dimensions, Animated } from 'react-native';
import { Modal, Portal, Text, IconButton } from 'react-native-paper';
import { LineChart, BarChart, ProgressChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

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
  metricType?: 'steps' | 'distance' | 'calories' | 'heartRate';
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
  const insets = useSafeAreaInsets();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, []);

  const animatedStyle = {
    transform: [{ scale: animatedValue }],
  };

  const chartConfig = {
    backgroundColor: '#1A1A1A',
    backgroundGradientFrom: '#1A1A1A',
    backgroundGradientTo: '#1A1A1A',
    decimalPlaces: 0,
    color: (opacity = 1) => {
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
    },
    labelColor: () => '#999',
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#20B2AA',
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
        <Animated.View style={animatedStyle}>
          <View style={styles.modalContent}>
            <IconButton
              icon="close"
              size={24}
              onPress={onClose}
              style={styles.closeButton}
            />

            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalValue}>{value}</Text>

            {data && data.values.length > 0 && (
              <>
                {metricType === 'calories' && (
                  <View style={styles.calorieCharts}>
                    <View style={styles.chartRow}>
                      <ProgressChart
                        data={{
                          labels: ['Progress'],
                          data: [data.values[data.values.length - 1] / 2000],
                          colors: ['#EE7752']
                        }}
                        width={Dimensions.get('window').width - 48}
                        height={160}
                        chartConfig={{
                          ...chartConfig,
                          color: () => '#EE7752'
                        }}
                        hideLegend
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
          </View>
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
    backgroundColor: '#1A1A1A',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    backgroundColor: '#333',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    color: '#FFF',
    letterSpacing: -0.5,
  },
  modalValue: {
    fontSize: 40,
    fontWeight: '800',
    marginBottom: 24,
    color: '#23C552',
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
    backgroundColor: '#333',
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
    color: '#999',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
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