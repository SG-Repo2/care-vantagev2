import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Button, Text, useTheme, ActivityIndicator, Avatar, Portal, Dialog } from 'react-native-paper';
import { useAuth } from '../../../health-metrics/contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { StyleSheet } from 'react-native';

export const ProfileScreen = () => {
  const theme = useTheme();
  const { signOut } = useAuth();
  const { profile, loading, error, isValid, deleteAccount } = useProfile();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      // User will be automatically signed out by useProfile
    } catch (err) {
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isValid) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Your account is no longer valid</Text>
        <Button mode="contained" onPress={signOut} style={styles.signOutButton}>
          Sign Out
        </Button>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={signOut} style={styles.signOutButton}>
          Sign Out
        </Button>
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
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Avatar.Text 
            size={120} 
            label={(profile.display_name || profile.email || 'U').substring(0, 2).toUpperCase()}
          />
          <Text style={styles.displayName}>{profile.display_name || profile.email || 'User'}</Text>
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
          <Button 
            mode="outlined" 
            onPress={() => setShowDeleteDialog(true)}
            style={styles.deleteButton}
            textColor={theme.colors.error}
          >
            Delete Account
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Account</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete your account? This action cannot be undone.
              All your health data and progress will be lost.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button textColor={theme.colors.error} onPress={handleDeleteAccount}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
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
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 16,
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
  deleteButton: {
    marginTop: 8,
    borderColor: 'transparent',
  },
  errorText: {
    color: '#FF4B4B',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
});
