import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useLeaderboard } from '../hooks/useLeaderboard';
import type { LeaderboardUser } from '../types';

export const LeaderboardList = () => {
  const { leaderboard, loading, error, refresh } = useLeaderboard();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: LeaderboardUser; index: number }) => (
    <View style={styles.row}>
      <Text style={styles.rank}>#{index + 1}</Text>
      <Text style={styles.name}>{item.display_name || 'Anonymous User'}</Text>
      <Text style={styles.score}>{item.score || 0}</Text>
    </View>
  );

  return (
    <FlatList
      data={leaderboard}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      onRefresh={refresh}
      refreshing={loading}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rank: {
    width: 50,
    fontSize: 16,
    fontWeight: 'bold',
  },
  name: {
    flex: 1,
    fontSize: 16,
  },
  score: {
    width: 80,
    fontSize: 16,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
});