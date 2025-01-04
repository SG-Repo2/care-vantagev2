import React, { useEffect, useState, useMemo, memo } from 'react';
import { View, Text, RefreshControl, Image, VirtualizedList } from 'react-native';
import { useTheme, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { Card } from '../../../components/common/atoms/Card';
import { useAuth } from '../../../context/AuthContext';
import leaderboardService, { LeaderboardEntry } from '../services/leaderboardService';
import { createStyles } from '../styles/LeaderboardScreen.styles';
import { formatDistance } from '../../../core/utils/formatting';

type PeriodType = 'daily' | 'weekly';

interface LeaderboardItem {
  item: LeaderboardEntry;
}

const LeaderboardEntryItem = memo(({ item, isCurrentUser }: { item: LeaderboardEntry, isCurrentUser: boolean }) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Card style={[
      styles.entryContainer,
      isCurrentUser && styles.currentUserEntry
    ]}>
      <View style={styles.rankContainer}>
        <Text style={[
          styles.rankText,
          item.rank !== undefined && item.rank <= 3 ? styles.topThreeRank : undefined
        ]}>
          #{item.rank ?? '-'}
        </Text>
      </View>
      <View style={styles.userContainer}>
        {item.profile.photoUrl && (
          <Image
            source={{ uri: item.profile.photoUrl }}
            style={styles.avatar}
          />
        )}
        <View style={styles.userInfo}>
          <Text style={[
            styles.nameText,
            isCurrentUser && styles.currentUserText
          ]}>
            {item.profile.displayName}
            {isCurrentUser && ' (You)'}
          </Text>
          <View style={styles.statsRow}>
            <Text style={styles.scoreText}>Score: {item.score}</Text>
            <Text style={styles.metricsText}>
              Steps: {item.steps.toLocaleString()} • Distance: {formatDistance(item.distance, 'metric')}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
});

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

  const getItem = (data: LeaderboardEntry[], index: number) => data[index];
  const getItemCount = (data: LeaderboardEntry[]) => data.length;
  const keyExtractor = (item: LeaderboardEntry) => item.profile.userId;

  const sortedEntries = useMemo(() =>
    leaderboardData.sort((a, b) => (a.rank || Infinity) - (b.rank || Infinity)),
    [leaderboardData]
  );

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

      <VirtualizedList
        data={sortedEntries}
        renderItem={({ item }: LeaderboardItem) => (
          <LeaderboardEntryItem
            item={item}
            isCurrentUser={user?.id === item.profile.userId}
          />
        )}
        keyExtractor={keyExtractor}
        getItemCount={getItemCount}
        getItem={getItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
      />
    </View>
  );
};
