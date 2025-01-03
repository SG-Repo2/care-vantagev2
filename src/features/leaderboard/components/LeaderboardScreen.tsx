import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Image } from 'react-native';
import { useTheme, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { Card } from '../../../components/common/atoms/Card';
import { Button } from '../../../components/common/atoms/Button';
import { useAuth } from '../../../context/AuthContext';
import leaderboardService, { LeaderboardEntry } from '../../../services/leaderboardService';
import { createStyles } from '../styles/LeaderboardScreen.styles';
import { formatDistance } from '../../../core/utils/formatting';

type PeriodType = 'daily' | 'weekly';

export const LeaderboardScreen: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [periodType, setPeriodType] = useState<PeriodType>('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const styles = createStyles(theme);
  const { user } = useAuth();

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      let data: LeaderboardEntry[];
      
      if (periodType === 'daily') {
        data = await leaderboardService.getLeaderboard(today);
      } else {
        // Get weekly data (last 7 days)
        const endDate = today;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        data = await leaderboardService.getWeeklyLeaderboard(
          startDate.toISOString().split('T')[0],
          endDate
        );
      }

      setLeaderboardData(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Failed to fetch leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, periodType]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [periodType]);


  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { marginTop: 16 }]}>
          Loading leaderboard...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={periodType}
        onValueChange={(value) => setPeriodType(value as PeriodType)}
        buttons={[
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' }
        ]}
        style={styles.periodSelector}
      />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {leaderboardData.map((entry) => (
        <Card key={entry.user_id} style={[
          styles.entryContainer,
          user?.id === entry.user_id && styles.currentUserEntry
        ]}>
          <View style={styles.rankContainer}>
            <Text style={[
              styles.rankText,
              entry.rank !== undefined && entry.rank <= 3 ? styles.topThreeRank : undefined
            ]}>
              #{entry.rank ?? '-'}
            </Text>
          </View>
          <View style={styles.userContainer}>
            {entry.photo_url && (
              <Image
                source={{ uri: entry.photo_url }}
                style={styles.avatar}
              />
            )}
            <View style={styles.userInfo}>
              <Text style={[
                styles.nameText,
                user?.id === entry.user_id && styles.currentUserText
              ]}>
                {entry.display_name}
                {user?.id === entry.user_id && ' (You)'}
              </Text>
              <View style={styles.statsRow}>
                <Text style={styles.scoreText}>Score: {entry.score}</Text>
                <Text style={styles.metricsText}>
                  Steps: {entry.steps.toLocaleString()} • Distance: {formatDistance(entry.distance, 'metric')}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      ))}
      </ScrollView>
    </View>
  );
};
