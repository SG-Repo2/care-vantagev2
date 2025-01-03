import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Text, useTheme } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../../navigation/types';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/common/atoms/Button';
import { spacing } from '../../../components/common/theme/spacing';

type LoginScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { signInWithGoogle, error: authError, isLoading } = useAuth();
  const theme = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }
    setLocalError(null);
    // Email/password login not implemented in this version
    setLocalError('Email/password login is not available. Please use Google Sign-In.');
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in error:', err);
      setLocalError('Failed to sign in with Google. Please try again.');
    }
  };

  const error = localError || authError;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.xl,
      backgroundColor: theme.colors.background,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: spacing.xl,
      color: theme.colors.onBackground,
      textAlign: 'center',
    },
    input: {
      marginBottom: spacing.md,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    button: {
      marginBottom: spacing.sm,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setLocalError(null);
        }}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        disabled={isLoading}
      />
      
      <TextInput
        label="Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setLocalError(null);
        }}
        mode="outlined"
        style={styles.input}
        secureTextEntry
        disabled={isLoading}
      />

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <Button
        variant="primary"
        size="large"
        onPress={handleLogin}
        loading={isLoading}
        disabled={isLoading || !email || !password}
        fullWidth
        style={styles.button}
      >
        Sign In
      </Button>

      <Button
        variant="outline"
        size="large"
        onPress={handleGoogleSignIn}
        loading={isLoading}
        disabled={isLoading}
        icon="google"
        fullWidth
        style={styles.button}
      >
        Sign in with Google
      </Button>

      <Button
        variant="text"
        size="medium"
        onPress={() => navigation.navigate('Register')}
        disabled={isLoading}
        fullWidth
        style={styles.button}
      >
        Don't have an account? Register
      </Button>
    </View>
  );
};
