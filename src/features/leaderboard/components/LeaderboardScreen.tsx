import React, { useEffect, useState } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../../health-metrics/contexts/AuthContext';
import { StyleSheet } from 'react-native';

interface LeaderboardEntry {
  profileId: string;
  rank: number;
  score: number;
  profile: {
    displayName: string;
  };
}

export const LeaderboardScreen = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();
  const { user } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual leaderboard fetching
      // For now, just show dummy data
      const dummyData: LeaderboardEntry[] = [
        { profileId: '1', rank: 1, score: 100, profile: { displayName: 'User 1' } },
        { profileId: '2', rank: 2, score: 90, profile: { displayName: 'User 2' } },
        { profileId: '3', rank: 3, score: 80, profile: { displayName: 'User 3' } },
      ];
      setLeaderboardData(dummyData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
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

  return (
    <View style={styles.container}>
      <FlatList
        data={leaderboardData}
        keyExtractor={(item) => item.profileId}
        renderItem={({ item }) => (
          <Card 
            style={[
              styles.card,
              user?.id === item.profileId && styles.currentUserCard
            ]}
          >
            <Card.Content>
              <View style={styles.row}>
                <Text style={styles.rank}>#{item.rank}</Text>
                <Text style={styles.name}>{item.profile.displayName}</Text>
                <Text style={styles.score}>{item.score}</Text>
              </View>
            </Card.Content>
          </Card>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
});
