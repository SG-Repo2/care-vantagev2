import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Text, Avatar } from 'react-native-paper';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useAuth } from '../../../core/auth/useAuth';
import { LoadingScreen } from '../../../health-metrics/components/LoadingScreen';
import { ErrorScreen } from '../../../health-metrics/components/ErrorScreen';

export const LeaderboardScreen: React.FC = () => {
  const { data, loading, error, loadMore } = useLeaderboard();
  const { user } = useAuth();

  if (loading && !data.length) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error.message} />;
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.public_id}
      renderItem={({ item }) => (
        <Card 
          style={[
            styles.card,
            user?.id === item.public_id && styles.currentUserCard
          ]}
        >
          <Card.Content style={styles.cardContent}>
            <View style={styles.rankContainer}>
              <Text variant="titleLarge">#{item.rank}</Text>
            </View>
            <Avatar.Image 
              size={40} 
              source={item.photo_url ? { uri: item.photo_url } : require('../../../assets/user.png')} 
            />
            <View style={styles.userInfo}>
              <Text variant="titleMedium">{item.display_name}</Text>
              <Text variant="bodyLarge">{item.score} points</Text>
            </View>
          </Card.Content>
        </Card>
      )}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 8,
    elevation: 2,
  },
  currentUserCard: {
    backgroundColor: '#e3f2fd',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
});
