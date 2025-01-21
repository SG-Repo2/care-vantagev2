import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { spacing } from '../../../theme';

export const Settings: React.FC = () => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Settings
      </Text>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.xs,
    color: theme.colors.onSurface,
  },
});
