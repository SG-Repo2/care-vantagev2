import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Avatar, useTheme, HelperText } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../../context/AuthContext';
import type { User } from '../../../features/auth/types/auth';
import { Button } from '../../../components/common/atoms/Button';
import { spacing } from '../../../components/common/theme/spacing';

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
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    setDisplayName(user?.displayName || '');
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
    
    try {
      setUpdateLoading(true);
      setError(null);
      // TODO: Implement profile update
      setEditMode(false);
    } catch (err) {
      console.error('[ProfileScreen] Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  }, [displayName]);

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
                value={user?.displayName || ''}
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

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  button: {
    flex: 1,
  },
});
