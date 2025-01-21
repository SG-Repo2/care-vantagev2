import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { LeaderboardList } from './LeaderboardList';
import { LeaderboardErrorBoundary } from './LeaderboardErrorBoundary';
import { useLeaderboard } from '../hooks/useLeaderboard';
import type { LeaderboardTimeframe } from '../types/leaderboard';
import { createStyles } from '../styles/LeaderboardScreen.styles';

export const LeaderboardScreen: React.FC = () => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { 
    entries,
    timeframe,
    loading,
    error,
    loadMore,
    refresh,
    changeTimeframe
  } = useLeaderboard('daily');

  const timeframeButtons = [
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'Week' },
    { value: 'monthly', label: 'Month' }
  ];

  return (
    <LeaderboardErrorBoundary>
      <View style={styles.container}>
        <SegmentedButtons
          value={timeframe}
          onValueChange={(value) => changeTimeframe(value as LeaderboardTimeframe)}
          buttons={timeframeButtons}
          style={styles.periodSelector}
        />
        <LeaderboardList
          entries={entries}
          loading={loading}
          error={error}
          onRefresh={refresh}
          onLoadMore={loadMore}
        />
      </View>
    </LeaderboardErrorBoundary>
  );
};
