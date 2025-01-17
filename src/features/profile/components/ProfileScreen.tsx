import React, { useState } from 'react';
import { View, ScrollView, Image, TouchableOpacity, Platform } from 'react-native';
import { Button, Text, useTheme, ActivityIndicator, Avatar } from 'react-native-paper';
import { useAuth } from '../../../health-metrics/contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../utils/supabase';
import { profileService } from '../services/profileService';

export const ProfileScreen = () => {
  const theme = useTheme();
  const { signOut, user } = useAuth();
  const { profile, loading, refreshProfile } = useProfile();
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to upload a profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) return;

    try {
      setUploading(true);

      // Convert URI to Blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Generate unique file name
      const fileExt = uri.substring(uri.lastIndexOf('.') + 1);
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new photo URL
      await profileService.updateProfilePhoto(user.id, publicUrl);
      await refreshProfile();

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>No profile found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={pickImage}
          disabled={uploading}
          style={styles.avatarContainer}
        >
          {profile.photo_url ? (
            <Image
              source={{ uri: profile.photo_url }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Text 
              size={120} 
              label={profile.display_name.substring(0, 2).toUpperCase()}
            />
          )}
          {uploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color={theme.colors.surface} />
            </View>
          )}
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>Edit</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.displayName}>{profile.display_name}</Text>
        <Text style={styles.email}>{profile.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Member Since</Text>
          <Text style={styles.value}>
            {new Date(profile.created_at || Date.now()).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Health Permissions</Text>
          <Text style={styles.value}>
            {profile.permissions_granted ? 'Granted' : 'Not Granted'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Button 
          mode="contained" 
          onPress={signOut}
          style={styles.signOutButton}
        >
          Sign Out
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editBadgeText: {
    color: 'white',
    fontSize: 12,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
  },
  signOutButton: {
    marginTop: 8,
  },
});
