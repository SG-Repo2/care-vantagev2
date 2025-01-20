import React from 'react';
import { FlatList, View, RefreshControl, StyleSheet } from 'react-native';
import { Card, Avatar, Text, ActivityIndicator } from 'react-native-paper';
import { useLeaderboard } from '../hooks/useLeaderboard';

export const LeaderboardScreen: React.FC = () => {
  const { data, loading, error, loadMore, refresh } = useLeaderboard();

  if (loading && !data.length) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge" style={styles.errorText}>
          Error: {error.message}
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: typeof data[0] }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <Text style={styles.rankText}>#{item.rank}</Text>
        <Avatar.Image 
          size={40} 
          source={
            item.photo_url 
              ? { uri: item.photo_url } 
              : require('../../../assets/user.png')
          } 
        />
        <View style={styles.userInfo}>
          <Text variant="titleMedium">
            {item.display_name || 'Anonymous User'}
          </Text>
          <Text variant="bodyMedium">{item.score} points</Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.public_id}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={loading && !!data.length}
            onRefresh={refresh}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankText: {
    minWidth: 40,
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
});
