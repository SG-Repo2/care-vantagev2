import React, { useState } from 'react';
import { View } from 'react-native';
import { TextInput, Text, useTheme } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { FontAwesome } from '@expo/vector-icons';
import { AuthStackParamList } from '../../../navigation/types';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/common/atoms/Button';
import { spacing } from '../../../components/common/theme/spacing';
import { createStyles } from '../styles/LoginScreen.styles';

type LoginScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { signInWithEmail, signInWithGoogle, error: authError, isLoading } = useAuth();
  const theme = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    setLocalError(null);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      console.error('Login error:', err);
      setLocalError(err instanceof Error ? err.message : 'Failed to sign in');
    }
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
  const styles = createStyles(theme);

  const GoogleIcon = (
    <View style={{ marginRight: spacing.sm }}>
      <FontAwesome name="google" size={20} color="white" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue your health journey</Text>

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
          disabled={isLoading || !email || !password || password.length < 6}
          fullWidth
          style={[styles.button, styles.primaryButton]}
        >
          Sign In with Email
        </Button>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          variant="primary"
          size="large"
          onPress={handleGoogleSignIn}
          loading={isLoading}
          disabled={isLoading}
          icon={GoogleIcon}
          fullWidth
          style={[styles.button, styles.googleButton]}
        >
          Sign in with Google
        </Button>

        <Button
          variant="text"
          size="medium"
          onPress={() => navigation.navigate('Register')}
          disabled={isLoading}
          fullWidth
          style={[styles.button, styles.registerButton]}
        >
          Don't have an account? Register
        </Button>
      </View>
    </View>
  );
};
