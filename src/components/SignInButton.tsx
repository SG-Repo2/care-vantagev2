import React from 'react';
import { TouchableOpacity, Text, Platform, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import authService from '../services/authService';

export function SignInButton() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: Platform.select({
      ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      default: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    }),
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'carevantage',
      path: 'auth/callback'
    }),
  });

  const handleSignIn = async () => {
    try {
      const response = await promptAsync();
      if (response?.type === 'success') {
        const { id_token } = response.params;
        await authService.signInWithGoogle(id_token);
      }
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
      console.log('Storage cleared successfully');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  return (
    <View>
      <TouchableOpacity 
      onPress={handleSignIn}
      disabled={!request}
      style={{
        backgroundColor: '#4285F4',
        padding: 16,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: 'white', textAlign: 'center' }}>
        Sign in with Google
      </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={clearStorage}
        style={{
          backgroundColor: '#dc3545',
          padding: 16,
          borderRadius: 8,
          marginTop: 10,
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Clear Storage
        </Text>
      </TouchableOpacity>
    </View>
  );
}
