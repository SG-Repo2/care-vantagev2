import React, { useState } from 'react';
import { View } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { FontAwesome } from '@expo/vector-icons';
import { AuthStackParamList } from '../../../navigation/types';
import { useAuth } from '../../../core/auth/contexts/AuthContext';
import { Button } from '../../../components/common/atoms/Button';
import { spacing } from '../../../components/common/theme/spacing';
import { createStyles } from '../styles/RegisterScreen.styles';

type RegisterScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'Register'>;
};

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { signUpWithEmail, signInWithGoogle, error: authError, isLoading } = useAuth();
  const theme = useTheme();
  const styles = createStyles(theme);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setLocalError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    setLocalError(null);
    try {
      await signUpWithEmail(email, password);
    } catch (err) {
      console.error('Registration error:', err);
      setLocalError(err instanceof Error ? err.message : 'Failed to register');
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    try {
      // Get Google OAuth token - this would typically come from Google Sign-In SDK
      const idToken = await getGoogleIdToken();
      await signInWithGoogle(idToken);
    } catch (err) {
      console.error('Google sign-in error:', err);
      setLocalError('Failed to sign in with Google. Please try again.');
    }
  };

  const getGoogleIdToken = async (): Promise<string> => {
    // TODO: Implement Google Sign-In SDK integration
    throw new Error('Google Sign-In not implemented');
  };

  const error = localError || authError;

  const GoogleIcon = (
    <View style={{ marginRight: spacing.sm }}>
      <FontAwesome name="google" size={20} color="white" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Create Account</Text>
        
        <Text style={styles.subtitle}>
          Join us to start tracking your health journey
        </Text>

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

        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
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
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading || !email || !password || !confirmPassword || password.length < 6}
          fullWidth
          style={[styles.button, styles.primaryButton]}
        >
          Create Account
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
          disabled={true}
          icon={GoogleIcon}
          fullWidth
          style={[styles.button, styles.googleButton]}
        >
          Sign up with Google (Coming Soon)
        </Button>

        <Button
          variant="text"
          size="medium"
          onPress={() => navigation.navigate('Login')}
          disabled={isLoading}
          fullWidth
          style={styles.button}
        >
          Already have an account? Sign in
        </Button>
      </View>
    </View>
  );
};
