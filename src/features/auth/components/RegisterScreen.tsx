import React, { useState } from 'react';
import { View, Platform } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { FontAwesome } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
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

  const googleAuth = Constants.expoConfig?.extra?.googleAuth;
  // Redirect
  React.useEffect(() => {
      WebBrowser.maybeCompleteAuthSession();
    }, []);
  
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: Platform.select({
      ios: googleAuth?.iosClientId,
      android: googleAuth?.androidClientId,
      default: googleAuth?.webClientId,
    }),
    iosClientId: googleAuth?.iosClientId,
    androidClientId: googleAuth?.androidClientId,
    webClientId: googleAuth?.webClientId,
    scopes: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid'
    ]
  });

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    try {
      await promptAsync();
    } catch (err) {
      console.error('Google sign-in error:', err);
      setLocalError('Failed to sign in with Google. Please try again.');
    }
  };

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      signInWithGoogle(id_token).catch(err => {
        console.error('Google sign-in error:', err);
        setLocalError('Failed to sign in with Google. Please try again.');
      });
    }
  }, [response]);

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
          onPress={() => handleGoogleSignIn()}
          loading={isLoading}
          disabled={!request || isLoading}
          icon={GoogleIcon}
          fullWidth
          style={[styles.button, styles.googleButton]}
        >
          Sign up with Google
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
