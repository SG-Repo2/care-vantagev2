import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { darkTheme } from '../constants/theme';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={darkTheme.colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: darkTheme.colors.background,
  },
});

export default LoadingScreen;
