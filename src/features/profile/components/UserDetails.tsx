import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText, useTheme } from 'react-native-paper';
import { spacing } from '../../../theme';

interface UserDetailsProps {
  displayName: string;
  email: string;
  onSave: (newDisplayName: string) => Promise<void>;
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  error: string | null;
  loading: boolean;
}

export const UserDetails: React.FC<UserDetailsProps> = ({
  displayName,
  email,
  onSave,
  editMode,
  setEditMode,
  error,
  loading,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [localDisplayName, setLocalDisplayName] = useState(displayName);

  const handleSave = async () => {
    await onSave(localDisplayName);
  };

  const handleCancel = () => {
    setLocalDisplayName(displayName);
    setEditMode(false);
  };

  return (
    <View style={styles.container}>
      {editMode ? (
        <>
          <TextInput
            label="Display Name"
            value={localDisplayName}
            onChangeText={setLocalDisplayName}
            mode="outlined"
            disabled={loading}
            error={!!error}
          />
          {error && <HelperText type="error">{error}</HelperText>}
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Save
            </Button>
            <Button
              mode="outlined"
              onPress={handleCancel}
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
            value={displayName}
            disabled
            mode="outlined"
          />
          <TextInput
            label="Email"
            value={email}
            disabled
            mode="outlined"
          />
          <Button
            mode="contained"
            onPress={() => setEditMode(true)}
            style={styles.editButton}
          >
            Edit Profile
          </Button>
        </>
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
  },
  editButton: {
    marginTop: spacing.md,
  },
});