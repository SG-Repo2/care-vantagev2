import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { useTheme } from 'react-native-paper';
import { Surface, Text, Button } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator<AuthStackParamList>();

// Temporary Login Screen
const LoginScreen = () => {
  const { login } = useAuth();
  const theme = useTheme();

  const handleLogin = async () => {
    try {
      // For testing, automatically log in
      await login('test_user_1');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <Surface style={styles.screen}>
      <Text variant="headlineMedium" style={{ marginBottom: 24 }}>Welcome Back</Text>
      <Button mode="contained" onPress={handleLogin}>
        Login
      </Button>
    </Surface>
  );
};

// Temporary Register Screen
const RegisterScreen = () => {
  const theme = useTheme();
  
  return (
    <Surface style={styles.screen}>
      <Text variant="headlineMedium">Create Account</Text>
    </Surface>
  );
};

export const AuthStack = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          title: 'Login',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{
          title: 'Register',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});
