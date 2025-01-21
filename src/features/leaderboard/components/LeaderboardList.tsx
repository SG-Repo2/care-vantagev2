import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Text, Card, Avatar, ActivityIndicator, useTheme } from 'react-native-paper';
import type { LeaderboardEntry } from '../types/leaderboard';
import { createStyles } from '../styles/LeaderboardScreen.styles';

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
  onLoadMore: () => void;
}

export const LeaderboardList: React.FC<LeaderboardListProps> = ({
  entries,
  loading,
  error,
  onRefresh,
  onLoadMore
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  if (loading && !entries.length) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: LeaderboardEntry }) => (
    <Card 
      style={[
        styles.entryContainer,
        item.isCurrentUser && styles.currentUserEntry
      ]}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.rankContainer}>
          <Text style={[
            styles.rankText,
            item.rank <= 3 && styles.topThreeRank
          ]}>
            #{item.rank}
          </Text>
        </View>

        <Avatar.Image
          size={48}
          source={
            item.photoUrl
              ? { uri: item.photoUrl }
              : require('assets/user.png')
          }
        />

        <View style={styles.userInfoContainer}>
          <Text style={styles.displayName}>
            {item.displayName}
          </Text>
          <Text style={styles.scoreText}>
            Score: {item.dailyScore}
          </Text>
          {item.streakDays && (
            <Text style={styles.streakText}>
              🔥 {item.streakDays} day streak
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <FlatList
      data={entries}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      onRefresh={onRefresh}
      refreshing={loading}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text>No leaderboard entries available</Text>
        </View>
      }
    />
  );
};