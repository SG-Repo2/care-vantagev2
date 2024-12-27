import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, TextInput, Button, Text } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../../navigation/types';
import AuthService from '../../../services/authService';

type RegisterScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'Register'>;
};

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const [request, response, promptAsync] = AuthService.useGoogleAuth();

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePasswords = () => {
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleRegister = async () => {
    setEmailError('');
    setPasswordError('');
    setError(null);

    const isEmailValid = validateEmail();
    const isPasswordValid = validatePasswords();

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.register(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      setEmailError('');
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) {
      setPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (passwordError) {
      setPasswordError('');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const response = await promptAsync();
      if (response?.type === 'success' && response.authentication) {
        await AuthService.signInWithGoogle(response.authentication.accessToken);
      }
    } catch (err) {
      setError('Google sign-in failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Create Account</Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={handleEmailChange}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        disabled={isLoading}
        error={!!emailError}
      />

      {emailError && (
        <Text variant="bodySmall" style={[styles.error, { color: theme.colors.error }]}>
          {emailError}
        </Text>
      )}

      <TextInput
        label="Password"
        value={password}
        onChangeText={handlePasswordChange}
        mode="outlined"
        style={styles.input}
        secureTextEntry
        disabled={isLoading}
        error={!!passwordError}
      />

      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={handleConfirmPasswordChange}
        mode="outlined"
        style={styles.input}
        secureTextEntry
        disabled={isLoading}
        error={!!passwordError}
      />

      {passwordError && (
        <Text variant="bodySmall" style={[styles.error, { color: theme.colors.error }]}>
          {passwordError}
        </Text>
      )}

      {error && (
        <Text variant="bodySmall" style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      <Button
        mode="contained"
        onPress={handleRegister}
        loading={isLoading}
        style={styles.button}
        disabled={isLoading || !email || !password || !confirmPassword}
      >
        Create Account
      </Button>

      <Button
        mode="outlined"
        onPress={handleGoogleSignIn}
        loading={isLoading}
        style={styles.googleButton}
        disabled={isLoading}
        icon="google"
      >
        Sign up with Google
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate('Login')}
        style={styles.link}
        disabled={isLoading}
      >
        Already have an account? Sign in
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  googleButton: {
    marginTop: 10,
  },
  error: {
    marginBottom: 16,
    textAlign: 'center',
  },
  link: {
    marginTop: 15,
  },
});