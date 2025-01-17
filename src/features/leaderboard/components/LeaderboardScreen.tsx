import React, { useEffect, useState } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../../health-metrics/contexts/AuthContext';
import { StyleSheet } from 'react-native';
import { leaderboardService, LeaderboardEntry } from '../services/leaderboardService';

export const LeaderboardScreen = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const { user } = useAuth();

  const fetchData = async () => {
    try {
      setError(null);
      const data = await leaderboardService.fetchLeaderboard();
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={leaderboardData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card 
            style={[
              styles.card,
              user?.id === item.user_id && styles.currentUserCard
            ]}
          >
            <Card.Content>
              <View style={styles.row}>
                <Text style={styles.rank}>#{item.rank}</Text>
                <Text style={styles.name}>{item.display_name}</Text>
                <Text style={styles.score}>{item.score}</Text>
              </View>
            </Card.Content>
          </Card>
        )}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text>No leaderboard data available</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 8,
  },
  currentUserCard: {
    backgroundColor: '#f0f8ff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    width: 40,
    fontWeight: 'bold',
  },
  name: {
    flex: 1,
    marginLeft: 8,
  },
  score: {
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
});
