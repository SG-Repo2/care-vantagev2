import React, { useState, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { Button, Text, TextInput, useTheme, MD3Theme } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../utils/supabase';
import { HealthProviderFactory } from '../providers/HealthProviderFactory';
import { useNavigation } from '@react-navigation/native';
import { profileService } from '../../features/profile/services/profileService';
import type { RootStackScreenProps } from '../navigation/types';

type SignInScreenProps = RootStackScreenProps<'SignIn'>;

export const SignInScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const theme = useTheme();
  const navigation = useNavigation<SignInScreenProps['navigation']>();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          // Create or get user profile
          const profile = await profileService.createProfile(session.user);
          console.log('Profile created/retrieved:', profile);
          
          // Initialize health provider after profile is created
          const healthInitialized = await initializeHealthProvider();
          if (healthInitialized) {
            navigation.replace('MainTabs');
          }
        } catch (err) {
          console.error('Failed to initialize user profile:', err);
          setError('Failed to initialize user profile');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigation]);

  const initializeHealthProvider = async () => {
    try {
      await HealthProviderFactory.cleanup();
      await HealthProviderFactory.createProvider();
      return true;
    } catch (err) {
      console.error('Failed to initialize health provider:', err);
      setError('Failed to initialize health services. Please check permissions.');
      return false;
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        // For registration, only sign up first
        const { data, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
        });

        if (signUpError) {
          console.error('SignUp error:', signUpError);
          throw signUpError;
        }

        if (data?.user) {
          // If registration successful, try to sign in
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (signInError) {
            console.error('SignIn after registration error:', signInError);
            throw signInError;
          }
        }
      } else {
        // Regular sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          console.error('SignIn error:', signInError);
          throw signInError;
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      // More descriptive error messages
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (err.message.includes('Email not confirmed')) {
          setError('Please check your email to confirm your account.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Health Metrics</Text>
        <Text style={styles.subtitle}>
          {isRegistering ? 'Create your account' : 'Sign in to your account'}
        </Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          disabled={loading}
        />
        
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          style={styles.input}
          secureTextEntry
          disabled={loading}
        />

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <Button
          mode="contained"
          onPress={handleAuth}
          loading={loading}
          disabled={loading || !email || !password}
          style={[styles.button, styles.primaryButton]}
        >
          {isRegistering ? 'Register' : 'Sign In'}
        </Button>

        <Button
          mode="text"
          onPress={() => setIsRegistering(!isRegistering)}
          disabled={loading}
          style={styles.button}
        >
          {isRegistering 
            ? 'Already have an account? Sign In' 
            : "Don't have an account? Register"}
        </Button>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    color: theme.colors.onBackground,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginBottom: 16,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
}); 