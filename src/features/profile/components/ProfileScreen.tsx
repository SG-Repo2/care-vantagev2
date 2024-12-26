import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Avatar, useTheme, HelperText } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../auth/context/AuthContext';
import { customLightTheme, customDarkTheme } from '../../../theme';

type RootStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Login: undefined;
};

type ProfileScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Profile'>;
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { logout, user } = useAuth();
  const paperTheme = useTheme();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = useCallback(async () => {
    try {
      setLoading(true);
      await logout();
      // Navigation will be handled by the AuthContext
    } catch (err) {
      console.error('[ProfileScreen] Logout error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [logout]);

  const handleProfileUpdate = useCallback(async () => {
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      // TODO: Implement profile update
      setEditMode(false);
    } catch (err) {
      console.error('[ProfileScreen] Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }, [displayName]);

  return (
    <View style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
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
                disabled={loading}
                error={!!error}
              />
              {error && <HelperText type="error">{error}</HelperText>}
              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={handleProfileUpdate}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                >
                  Save
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setEditMode(false);
                    setDisplayName(user?.displayName || '');
                    setError(null);
                  }}
                  disabled={loading}
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
                  mode="contained"
                  onPress={() => setEditMode(true)}
                  style={styles.button}
                >
                  Edit Profile
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleLogout}
                  loading={loading}
                  disabled={loading}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  form: {
    gap: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});
