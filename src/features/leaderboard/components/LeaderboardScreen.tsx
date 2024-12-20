import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Surface, Text, useTheme, Avatar, Divider } from 'react-native-paper';
import { formatScore } from '../../../core/utils/formatting';

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  rank: number;
}

interface LeaderboardItemProps {
  rank: number;
  name: string;
  score: number;
  isUser: boolean;
}

// Dummy data for the leaderboard
const DUMMY_DATA: LeaderboardEntry[] = [
  { id: '1', name: 'You', score: 85, rank: 1 },
  { id: '2', name: 'Sarah Johnson', score: 82, rank: 2 },
  { id: '3', name: 'Mike Chen', score: 79, rank: 3 },
  { id: '4', name: 'Emma Wilson', score: 76, rank: 4 },
  { id: '5', name: 'James Smith', score: 73, rank: 5 },
  { id: '6', name: 'Lisa Brown', score: 70, rank: 6 },
  { id: '7', name: 'David Lee', score: 68, rank: 7 },
  { id: '8', name: 'Anna Garcia', score: 65, rank: 8 },
  { id: '9', name: 'Tom Wilson', score: 62, rank: 9 },
  { id: '10', name: 'Rachel Kim', score: 60, rank: 10 },
];

const LeaderboardItem: React.FC<LeaderboardItemProps> = ({ rank, name, score, isUser }) => {
  const theme = useTheme();
  
  return (
    <Surface style={[styles.itemContainer, isUser && { backgroundColor: theme.colors.primaryContainer }]}>
      <View style={styles.rankContainer}>
        <Text style={[styles.rank, { color: theme.colors.primary }]}>{rank}</Text>
      </View>
      <View style={styles.userInfo}>
        <Avatar.Text size={40} label={name.charAt(0)} />
        <Text style={[styles.name, { marginLeft: 12 }]}>{name}</Text>
      </View>
      <View style={styles.scoreContainer}>
        <Text style={[styles.score, { color: theme.colors.primary }]}>{formatScore(score)}</Text>
      </View>
    </Surface>
  );
};

export const LeaderboardScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.headerContainer, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineMedium" style={styles.title}>Leaderboard</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Top Health Scores
        </Text>
      </Surface>
      
      <ScrollView style={styles.scrollView}>
        {DUMMY_DATA.map((item) => (
          <React.Fragment key={item.id}>
            <LeaderboardItem
              rank={item.rank}
              name={item.name}
              score={item.score}
              isUser={item.name === 'You'}
            />
            <Divider />
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scrollView: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    height: 80,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  scoreContainer: {
    marginLeft: 'auto',
    paddingRight: 8,
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
