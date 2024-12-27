import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import GoogleAuthService from '../services/GoogleAuthService';

type User = {
  id: string;
  email: string;
  displayName?: string;
};

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
};

type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const user = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
        };
        await AsyncStorage.setItem('user', JSON.stringify(user));
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          user,
          isLoading: false,
        }));
      } else {
        await AsyncStorage.removeItem('user');
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          isLoading: false,
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || '',
      };
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user,
        isLoading: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Login failed',
      }));
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || '',
      };
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user,
        isLoading: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Registration failed',
      }));
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await GoogleAuthService.signIn();
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user,
        isLoading: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Google Sign-In failed',
        isLoading: false,
      }));
      throw error;
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await GoogleAuthService.signOut();
      await AsyncStorage.removeItem('user');
      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Logout failed',
        isLoading: false,
      }));
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
