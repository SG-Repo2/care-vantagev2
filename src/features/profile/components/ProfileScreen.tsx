import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Avatar, useTheme, HelperText, SegmentedButtons, Text } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../../context/AuthContext';
import type { User } from '../../../features/auth/types/auth';
import type { PrivacyLevel } from '../../../core/types/base';
import { Button } from '../../../components/common/atoms/Button';
import { spacing } from '../../../components/common/theme/spacing';
import { createStyles } from '../styles/ProfileScreen.styles';
import { profileService } from '../services/profileService';

type RootStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Login: undefined;
};

type ProfileScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Profile'>;
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { user, signOut, isLoading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('private');
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    setDisplayName(user?.displayName || '');
    // Load privacy settings from user profile
    const loadProfile = async () => {
      if (user?.id) {
        try {
          const profile = await profileService.getProfile(user.id);
          if (profile?.settings?.privacyLevel) {
            setPrivacyLevel(profile.settings.privacyLevel);
          }
        } catch (err) {
          console.error('[ProfileScreen] Error loading profile:', err);
        }
      }
    };
    loadProfile();
  }, [user]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('[ProfileScreen] Logout error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  }, [signOut]);

  const handleProfileUpdate = useCallback(async () => {
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }
    
    if (!user?.id) {
      setError('User not found');
      return;
    }
    
    try {
      setUpdateLoading(true);
      setError(null);
      
      await profileService.updateProfile(user.id, {
        display_name: displayName.trim(),
        settings: {
          privacyLevel: privacyLevel,
          // Preserve other settings
          measurementSystem: 'metric',
          notifications: true,
          dailyGoals: {
            steps: 10000,
            sleep: 480,
            water: 2000
          }
        }
      });
      
      setEditMode(false);
    } catch (err) {
      console.error('[ProfileScreen] Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  }, [displayName, privacyLevel, user?.id]);

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.avatarContainer}>
          <Avatar.Image
            size={100}
            source={{ uri: 'https://via.placeholder.com/100' }}
          />
        </View>

          <View style={styles.form}>
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Privacy Settings</Text>
              <Text variant="bodySmall" style={styles.sectionDescription}>
                Control how your health data appears in the leaderboard
              </Text>
              <SegmentedButtons
                value={privacyLevel}
                onValueChange={value => setPrivacyLevel(value as PrivacyLevel)}
                buttons={[
                  { value: 'private', label: 'Private' },
                  { value: 'public', label: 'Public' }
                ]}
                style={styles.privacySelector}
              />
            </View>
          {editMode ? (
            <>
              <TextInput
                label="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
                mode="outlined"
                disabled={updateLoading}
                error={!!error}
              />
              {error && <HelperText type="error">{error}</HelperText>}
              <View style={styles.buttonContainer}>
                <Button
                  variant="primary"
                  size="medium"
                  onPress={handleProfileUpdate}
                  loading={updateLoading}
                  disabled={updateLoading}
                  style={styles.button}
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="medium"
                  onPress={() => {
                    setEditMode(false);
                    setDisplayName(user?.displayName || '');
                    setError(null);
                  }}
                  disabled={updateLoading}
                  style={styles.button}
                >
                  Cancel
                </Button>
              </View>
            </>
          ) : (
            <>
              <TextInput
                label="Display Name"
                value={displayName}
                disabled
                mode="outlined"
              />
              <TextInput
                label="Email"
                value={user?.email || ''}
                disabled
                mode="outlined"
              />
              <View style={styles.buttonContainer}>
                <Button
                  variant="primary"
                  size="medium"
                  onPress={() => setEditMode(true)}
                  style={styles.button}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  size="medium"
                  onPress={handleLogout}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.button}
                >
                  Logout
                </Button>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
