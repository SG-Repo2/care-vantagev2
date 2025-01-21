import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LeaderboardList } from './LeaderboardList';

export const LeaderboardScreen = () => {
  return (
    <View style={styles.container}>
      <LeaderboardList />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
