import React from 'react';
import { View } from 'react-native';
import { SegmentedButtons, Text } from 'react-native-paper';
import { createStyles } from '../styles/ProfileScreen.styles';
import { useTheme } from 'react-native-paper';

interface PrivacySettingsProps {
  privacyLevel: 'public' | 'private';
  onChange: (level: 'public' | 'private') => void;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  privacyLevel,
  onChange,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.privacySelector}>
      <SegmentedButtons
        value={privacyLevel}
        onValueChange={value => onChange(value as 'public' | 'private')}
        buttons={[
          {
            value: 'public',
            label: 'Public',
            icon: 'earth'
          },
          {
            value: 'private',
            label: 'Private',
            icon: 'lock'
          }
        ]}
      />
      <Text style={styles.sectionDescription}>
        {privacyLevel === 'public' 
          ? 'Your profile and scores are visible to everyone'
          : 'Your profile and scores are hidden from the leaderboard'}
      </Text>
    </View>
  );
};