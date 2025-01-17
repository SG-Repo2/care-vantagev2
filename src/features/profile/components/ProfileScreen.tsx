import React from 'react';
import { View, ScrollView } from 'react-native';
import { Button, Text, useTheme, ActivityIndicator, Avatar } from 'react-native-paper';
import { useAuth } from '../../../health-metrics/contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { StyleSheet } from 'react-native';

export const ProfileScreen = () => {
  const theme = useTheme();
  const { signOut, user } = useAuth();
  const { profile, loading } = useProfile();

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
        <Avatar.Text 
          size={120} 
          label={profile.display_name.substring(0, 2).toUpperCase()}
        />
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
});
