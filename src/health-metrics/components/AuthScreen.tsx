import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { useAuth } from '../../core/auth/contexts/AuthContext';
import { Button } from '../../components/common/atoms/Button';
import { spacing } from '../../components/common/theme/spacing';
import * as SecureStore from 'expo-secure-store';

WebBrowser.maybeCompleteAuthSession();

const AuthScreen = () => {
  const [localError, setLocalError] = useState<string | null>(null);
  const { signInWithGoogle, error: authError, isLoading } = useAuth();
  const theme = useTheme();

  const googleAuth = Constants.expoConfig?.extra?.googleAuth;
  
  if (!googleAuth?.webClientId || !googleAuth?.iosClientId || !googleAuth?.androidClientId) {
    console.error('Missing Google Auth configuration:', googleAuth);
    setLocalError('Google Sign In is not properly configured');
  }
  
  // Initialize AuthSession and WebBrowser for OAuth
  AuthSession.useAutoDiscovery('https://accounts.google.com');

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleAuth?.webClientId,
    iosClientId: googleAuth?.iosClientId,
    androidClientId: googleAuth?.androidClientId,
    scopes: ['openid', 'profile', 'email']
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (!id_token) {
        console.error('No ID token received from Google');
        setLocalError('Failed to get authentication token');
        return;
      }
      
      // Store the ID token for later use
      SecureStore.setItemAsync('google_id_token', id_token).then(() => {
        signInWithGoogle();
      }).catch(err => {
        console.error('Failed to store Google token:', err);
        setLocalError('Failed to complete authentication');
      });
    } else if (response?.type === 'error') {
      console.error('Google sign-in error:', response.error);
      setLocalError('Failed to sign in with Google. Please try again.');
    }
  }, [response, signInWithGoogle]);

  const handleGoogleSignIn = async () => {
    try {
      setLocalError(null);
      await promptAsync();
    } catch (err) {
      console.error('Google sign-in error:', err);
      setLocalError(err instanceof Error ? err.message : 'Failed to sign in with Google. Please try again.');
    }
  };

  const error = localError || authError;

  const GoogleIcon = (
    <View style={{ marginRight: spacing.sm }}>
      <FontAwesome name="google" size={20} color="white" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineLarge" style={styles.title}>
          Health Metrics
        </Text>
        <Text variant="titleMedium" style={styles.subtitle}>
          Sign in to track your health journey
        </Text>
        
        {error && (
          <Text style={styles.errorText}>
            {error}
          </Text>
        )}

        {isLoading ? (
          <ActivityIndicator size="large" color="#23C552" style={styles.loader} />
        ) : (
          <Button
            variant="primary"
            size="large"
            onPress={handleGoogleSignIn}
            disabled={!request || isLoading}
            icon={GoogleIcon}
            fullWidth
            style={styles.button}
          >
            Sign in with Google
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#999',
    marginBottom: 48,
    textAlign: 'center',
  },
  button: {
    width: '80%',
    marginVertical: 12,
    backgroundColor: '#23C552',
  },
  errorText: {
    color: '#FF4B4B',
    marginBottom: 16,
    textAlign: 'center',
  },
  loader: {
    marginVertical: 12,
  },
});

export default AuthScreen; 