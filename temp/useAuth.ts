import { useState, useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  user: any;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    redirectUri: Platform.select({
      ios: 'com.carevantage.v1:/oauth2redirect',
      android: 'com.carevantage.v1:/oauth2redirect'
    })
  });

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState(prev => ({ ...prev, user, loading: false }));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then((result) => {
          console.log('User signed in with Google successfully');
          // No need to setState here as the auth state listener will handle it
        })
        .catch((error) => {
          console.error('Google sign in error:', error);
          setState(prev => ({ ...prev, error: error.message, loading: false }));
        });
    }
  }, [response]);

  const signInWithGoogle = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await promptAsync();
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setState(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await signInWithEmailAndPassword(auth, email, password);
      // No need to setState here as the auth state listener will handle it
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await createUserWithEmailAndPassword(auth, email, password);
      // No need to setState here as the auth state listener will handle it
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await signOut(auth);
      // No need to setState here as the auth state listener will handle it
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  return {
    currentUser: state.user,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    signInWithGoogle
  };
}
