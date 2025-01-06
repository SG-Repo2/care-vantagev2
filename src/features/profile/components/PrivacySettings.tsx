import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { spacing } from '../../../components/common/theme/spacing';
import type { PrivacyLevel } from '../../../core/types/base';

interface PrivacySettingsProps {
  privacyLevel: PrivacyLevel;
  onChange: (level: PrivacyLevel) => void;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  privacyLevel,
  onChange,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Privacy Settings
      </Text>
      <Text variant="bodySmall" style={styles.description}>
        Control how your health data appears in the leaderboard
      </Text>
      <SegmentedButtons
        value={privacyLevel}
        onValueChange={value => onChange(value as PrivacyLevel)}
        buttons={[
          { value: 'private', label: 'Private' },
          { value: 'friends', label: 'Friends Only' },
          { value: 'public', label: 'Public' },
        ]}
        style={styles.buttons}
      />
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
  description: {
    marginBottom: spacing.md,
    color: theme.colors.onSurfaceVariant,
  },
  buttons: {
    marginBottom: spacing.md,
  },
});