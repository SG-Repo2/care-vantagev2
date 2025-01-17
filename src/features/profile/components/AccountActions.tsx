import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { spacing } from '../../../components/common/theme/spacing';

interface AccountActionsProps {
  onLogout: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  logoutLoading: boolean;
  deleteLoading: boolean;
}

export const AccountActions: React.FC<AccountActionsProps> = ({
  onLogout,
  onDeleteAccount,
  logoutLoading,
  deleteLoading,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  const handleDelete = async () => {
    // TODO: Add confirmation dialog
    await onDeleteAccount();
  };

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={onLogout}
        loading={logoutLoading}
        disabled={logoutLoading || deleteLoading}
        style={styles.button}
      >
        Logout
      </Button>
      <Button
        mode="outlined"
        onPress={handleDelete}
        loading={deleteLoading}
        disabled={logoutLoading || deleteLoading}
        style={styles.button}
        textColor={theme.colors.error}
      >
        Delete Account
      </Button>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  button: {
    width: '100%',
  },
});