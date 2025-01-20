import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, Avatar, TextInput, Text, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../../../core/auth/useAuth';

export const ProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading, error, updating, updateProfile, uploadProfilePhoto } = useProfile(user?.id || '');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [saveError, setSaveError] = useState<string | null>(null);

  if (loading && !profile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {error?.message || 'Profile not found'}
        </Text>
      </View>
    );
  }

  const handleSave = async () => {
    try {
      setSaveError(null);
      await updateProfile({ display_name: displayName });
    } catch (err) {
      setSaveError((err as Error).message);
    }
  };

  const handleImagePick = async () => {
    try {
      // Request permissions
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to change your profile photo.');
          return;
        }
      }

      // Pick the image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0].uri) {
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (err) {
      setSaveError((err as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Avatar.Image 
          size={120} 
          source={
            profile.photo_url 
              ? { uri: profile.photo_url }
              : require('../../../assets/user.png')
          }
        />
        <Button 
          mode="outlined" 
          onPress={handleImagePick}
          style={styles.photoButton}
          disabled={updating}
        >
          Change Photo
        </Button>
      </View>

      <TextInput
        label="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
        style={styles.input}
        disabled={updating}
      />

      {saveError && (
        <Text style={styles.errorText}>
          {saveError}
        </Text>
      )}

      <Button 
        mode="contained" 
        onPress={handleSave}
        style={styles.saveButton}
        loading={updating}
        disabled={updating}
      >
        Save Changes
      </Button>

      <View style={styles.statsContainer}>
        <Text variant="titleMedium" style={styles.statsTitle}>
          Your Stats
        </Text>
        <Text style={styles.statsText}>
          Current Score: {profile.score}
        </Text>
        <Text style={styles.statsText}>
          Member Since: {new Date(profile.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoButton: {
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  saveButton: {
    marginTop: 8,
  },
  errorText: {
    color: 'red',
    marginVertical: 8,
    textAlign: 'center',
  },
  statsContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  statsTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  statsText: {
    fontSize: 16,
    marginVertical: 4,
  },
});
