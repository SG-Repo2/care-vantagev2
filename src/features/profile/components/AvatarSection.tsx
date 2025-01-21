import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Avatar, Button, useTheme } from 'react-native-paper';
import { spacing } from '../../../theme';

interface AvatarSectionProps {
  photoURL: string | null | undefined;
  onUpload: (uri: string) => Promise<void>;
  onRemove: () => Promise<void>;
}

export const AvatarSection: React.FC<AvatarSectionProps> = ({
  photoURL,
  onUpload,
  onRemove,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Avatar.Image
        size={100}
        source={{ uri: photoURL ?? 'https://via.placeholder.com/100' }}
      />
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => {/* TODO: Implement image picker */}}
          style={styles.button}
        >
          Change Photo
        </Button>
        {photoURL && (
          <Button
            mode="outlined"
            onPress={onRemove}
            style={styles.button}
          >
            Remove
          </Button>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
  },
});