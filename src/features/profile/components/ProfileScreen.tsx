import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Avatar, useTheme, HelperText } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../../context/AuthContext';
import { User } from '../../../services/authService';

type RootStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Login: undefined;
};

type ProfileScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Profile'>;
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const paperTheme = useTheme();
  const { user, signOut, isLoading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    setDisplayName(user?.name || '');
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

  return (
    <View style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      <ScrollView style={styles.content}>
        <View style={styles.avatarContainer}>
          <Avatar.Image
            size={100}
            source={user?.photoUrl ? { uri: user.photoUrl } : { uri: 'https://via.placeholder.com/100' }}
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
                  mode="contained"
                  onPress={handleProfileUpdate}
                  loading={updateLoading}
                  disabled={updateLoading}
                  style={styles.button}
                >
                  Save
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setEditMode(false);
                    setDisplayName(user?.name || '');
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
                value={user?.name || ''}
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
