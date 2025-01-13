import React, { useEffect, useState, useMemo, memo } from 'react';
import { View, Text, RefreshControl, Image, VirtualizedList, Animated } from 'react-native';
import { useTheme, ActivityIndicator, SegmentedButtons, Card } from 'react-native-paper';
import { useAuth } from '../../../core/auth/contexts/AuthContext';
import leaderboardService from '../services/leaderboardService';
import { LeaderboardEntry } from '../types/leaderboard';
import { createStyles } from '../styles/LeaderboardScreen.styles';
type PeriodType = 'daily' | 'weekly';

interface LeaderboardItem {
  item: LeaderboardEntry;
}

const LeaderboardEntryItem = memo(({ item, isCurrentUser }: { item: LeaderboardEntry, isCurrentUser: boolean }) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const scoreScale = new Animated.Value(0.5);

  const isPrivate = item.profile.privacyLevel === 'private' && !isCurrentUser;

  useEffect(() => {
    Animated.spring(scoreScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Card style={[
      styles.entryContainer,
      isCurrentUser && styles.currentUserEntry
    ]}>
      <Card.Content style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.rankContainer}>
          <Text style={[
            styles.rankText,
            item.rank !== undefined && item.rank <= 3 ? styles.topThreeRank : undefined
          ]}>
            #{item.rank ?? '-'}
          </Text>
        </View>
        <View style={styles.userContainer}>
        {!isPrivate && item.profile.photoUrl && (
          <Image
            source={{ uri: item.profile.photoUrl }}
            style={styles.avatar}
          />
        )}
        {isPrivate && (
          <View style={[styles.avatar, styles.privateAvatar]}>
            <Text style={styles.privateAvatarText}>🔒</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[
              styles.nameText,
              isCurrentUser && styles.currentUserText,
              { marginLeft: 10 }
            ]}>
              {isPrivate ? 'Private User' : item.profile.displayName}
              {isCurrentUser && ' (You)'}
              {item.profile.privacyLevel === 'private' && ' 🔒'}
            </Text>
            <Animated.View style={[
              {
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -8
              },
              { transform: [{ scale: scoreScale }] }
            ]}>
              <Text style={[
                styles.scoreText,
                {
                  textShadowColor: 'rgba(0, 0, 0, 0.1)',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 1
                }
              ]}>
                {isPrivate ? '---' : `🏆 ${item.score}`}
              </Text>
            </Animated.View>
          </View>
          {!isPrivate && item.activityBlurb && (
            <Text style={[styles.metricsText, { marginTop: 4 }]}>
              {item.activityBlurb}
            </Text>
          )}
        </View>
      </View>
      </Card.Content>
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
  const keyExtractor = (item: LeaderboardEntry) => item.profileId;

  const sortedEntries = useMemo(() =>
    leaderboardData.sort((a, b) => (a.rank || Infinity) - (b.rank || Infinity)),
    [leaderboardData]
  );

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

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
            isCurrentUser={user?.id === item.profileId}
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
