import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';

import healthMetricsService from '../../../services/healthMetricsService';
import { createStyles } from '../styles/LeaderboardScreen.styles';

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
  const theme = useTheme();
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

