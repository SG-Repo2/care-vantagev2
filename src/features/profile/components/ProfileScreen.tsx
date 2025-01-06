import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { AvatarSection } from './AvatarSection';
import { PrivacySettings } from './PrivacySettings';
import { UserDetails } from './UserDetails';
import { AccountActions } from './AccountActions';
import { createStyles } from '../styles/ProfileScreen.styles';

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
  const { signOut } = useAuth();
  const {
    profile,
    loading,
    error,
    updateProfile,
    updateAvatar,
    deleteAccount
  } = useProfile();
  const [editMode, setEditMode] = useState(false);
  const styles = createStyles(theme);

  if (!profile) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <AvatarSection
          photoURL={profile.photoURL}
          onUpload={updateAvatar}
          onRemove={() => updateAvatar('')}
        />

        {profile.settings && (
          <PrivacySettings
            privacyLevel={profile.settings.privacyLevel}
            onChange={(level) => updateProfile({
              settings: { ...profile.settings, privacyLevel: level }
            })}
          />
        )}

        <UserDetails
          displayName={profile.displayName || ''}
          email={profile.email}
          onSave={(newDisplayName) => updateProfile({ display_name: newDisplayName })}
          editMode={editMode}
          setEditMode={setEditMode}
          error={error}
          loading={loading}
        />

        <AccountActions
          onLogout={signOut}
          onDeleteAccount={deleteAccount}
          logoutLoading={loading}
          deleteLoading={loading}
        />
      </ScrollView>
    </View>
  );
};
