import React, { useState } from 'react';
import { 
  View, 
  Text,
  StyleSheet,
  Alert
} from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { darkTheme } from '../../../constants/theme';
import { TextInput, Button, useTheme } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { HealthService } from '../../../features/health/services/HealthService';
import { Platform } from 'react-native';


type RootStackParamList = {
  Register: undefined;
  Login: undefined;
  Dashboard: undefined;
};

type RegisterScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();
  
  const { register, signInWithGoogle } = useAuthContext();

  const handleHealthPermissions = async () => {
    if (Platform.OS === 'ios') {
      const healthService = new HealthService();
      const initialized = await healthService.initialize();
      if (!initialized) return false;
      const result = await healthService.checkPermissions();
      
      if (!result) {
        const permissionChoice = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Health Permissions',
            'CareVantage would like to access your health data. This helps track your fitness metrics.',
            [
              {
                text: 'Don\'t Allow',
                onPress: () => resolve(false),
                style: 'cancel'
              },
              {
                text: 'Allow',
                onPress: () => resolve(true)
              }
            ]
          );
        });

        return permissionChoice;
      }
      return result;
    }
    return true;
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      
      // Request health permissions first
      const permissionsGranted = await handleHealthPermissions();
      
      if (permissionsGranted) {
        await signInWithGoogle();
        // Navigation to Dashboard will be handled by AuthContext
      } else {
        Alert.alert(
          'Permissions Denied',
          'You can enable health permissions later in the app settings.'
        );
      }
    } catch (err) {
      console.error('Google registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to register with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Request health permissions first
      const permissionsGranted = await handleHealthPermissions();
      
      if (permissionsGranted) {
        await register(email, password);
        // Navigation to Dashboard will be handled by AuthContext
      } else {
        Alert.alert(
          'Permissions Denied',
          'You can enable health permissions later in the app settings.'
        );
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <TextInput
        label="Email"
        mode="outlined"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
        style={styles.input}
      />
      
      <TextInput
        label="Password"
        mode="outlined"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
        style={styles.input}
      />
      
      <TextInput
        label="Confirm Password"
        mode="outlined"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!loading}
        style={styles.input}
      />
      
      <Button
        mode="contained"
        onPress={handleRegister}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Register
      </Button>

      <Button
        mode="outlined"
        onPress={handleGoogleSignIn}
        disabled={loading}
        style={[styles.button, styles.googleButton]}
        icon="google"
      >
        Sign up with Google
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate('Login')}
        style={styles.linkButton}
      >
        Already have an account? Login
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24, 
    backgroundColor: darkTheme.colors.background,
  },
  title: {
    fontSize: 32, 
    fontWeight: 'bold',
    color: darkTheme.colors.primary,
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
    borderColor: darkTheme.colors.primary, 
  },
  error: {
    color: darkTheme.colors.error,
    marginBottom: 16, 
    textAlign: 'center',
  },
  linkButton: {
    marginTop: 24, 
  }
});
