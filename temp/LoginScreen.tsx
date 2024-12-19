import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet
} from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { useTheme } from 'react-native-paper';
import { TextInput, Button } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  Statistics: undefined;
  Profile: undefined;
  Settings: undefined;
};

type LoginScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signInWithGoogle } = useAuthContext();
  const theme = useTheme();

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await login(email, password);
      // Navigation to Dashboard will be handled by AuthContext
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      // Navigation to Dashboard will be handled by AuthContext
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.onBackground }]}>Login</Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        autoComplete="email"
        disabled={loading}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        style={styles.input}
        secureTextEntry
        autoComplete="password"
        disabled={loading}
      />
      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        style={styles.button}
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </Button>
      <Button
        mode="outlined"
        onPress={handleGoogleSignIn}
        loading={loading}
        style={styles.googleButton}
        disabled={loading}
        icon="google"
      >
        Sign in with Google
      </Button>
      <Button
        mode="text"
        onPress={() => navigation.navigate('Register')}
        style={styles.link}
      >
        Don't have an account? Register
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24, 
    backgroundColor: '#FAFAFA', 
  },
  title: {
    fontSize: 32, 
    fontWeight: 'bold',
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
    borderColor: '#4285F4',
  },
  error: {
    marginBottom: 16, 
    textAlign: 'center',
  },
  link: {
    marginTop: 15,
  },
});
