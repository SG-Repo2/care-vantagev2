import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import healthMetricsService from '../../../services/healthMetricsService';

interface LeaderboardEntry {
  id: string;
  name: string;
  avatarUrl?: string;
  rank: number;
  metrics: {
    steps: number;
    distance: number;
  };
  score: {
    overall: number;
    categories: {
      steps: number;
      distance: number;
    };
    bonusPoints: number;
  };
}

export const LeaderboardScreen: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const leaderboardData = await healthMetricsService.getLeaderboard(today);
        
        const formattedData = leaderboardData.map((entry, index) => ({
          id: entry.user_id,
          name: entry.users[0].display_name,
          avatarUrl: entry.users[0].photo_url,
          rank: index + 1,
          metrics: {
            steps: entry.steps,
            distance: entry.distance,
          },
          score: {
            overall: entry.score,
            categories: {
              steps: Math.round(entry.score * 0.9),
              distance: Math.round(entry.score * 0.95),
            },
            bonusPoints: 5,
          },
        }));

        setLeaderboardData(formattedData);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError('Failed to fetch leaderboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading leaderboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {leaderboardData.map((entry) => (
        <View key={entry.id} style={styles.entryContainer}>
          <View style={styles.rankContainer}>
            <Text style={styles.rankText}>#{entry.rank}</Text>
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.nameText}>{entry.name}</Text>
            <Text style={styles.metricsText}>
              Steps: {entry.metrics.steps.toLocaleString()} • Distance: {entry.metrics.distance.toFixed(2)}km
            </Text>
            <Text style={styles.scoreText}>Score: {entry.score.overall}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  entryContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  detailsContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  scoreText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
});
