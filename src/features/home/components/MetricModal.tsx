import React from 'react';
import { View, Dimensions, Animated } from 'react-native';
import { Modal, Portal, Text, IconButton, useTheme } from 'react-native-paper';
import { useStyles } from '../styles/MetricModal.styles';
import { LineChart, BarChart, ProgressChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../../components/common/atoms/Card';
import { spacing } from '../../../theme';

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
  metricType?: string;
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
  const styles = useStyles();
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
        <Animated.View style={animatedStyle}>
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
              <>
                {metricType === 'calories' && (
                  <View style={styles.calorieCharts}>
                    <View style={styles.chartRow}>
                      <ProgressChart
                        data={{
                          labels: ['Progress'],
                          data: [data.values[data.values.length - 1] / 2000], // Assuming 2000 calorie goal
                          colors: ['#FF6347']
                        }}
                        width={Dimensions.get('window').width - 48}
                        height={160}
                        chartConfig={{
                          ...chartConfig,
                          color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`
                        }}
                        hideLegend
                      />
                      <BarChart
                        data={{
                          labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'],
                          datasets: [{
                            data: [120, 300, 450, 600, 400, 200] // Example hourly data
                          }]
                        }}
                        width={Dimensions.get('window').width - 48}
                        height={160}
                        chartConfig={{
                          ...chartConfig,
                          color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`
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
