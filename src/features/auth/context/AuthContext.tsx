import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          user,
          isLoading: false,
        }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: 'Failed to load user data' }));
    }
  };

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // TODO: Replace with actual authentication
      const user = { id: 'temp_id', email };
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Login failed',
      }));
    }
  };

  const register = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // TODO: Replace with actual registration
      const user = { id: 'temp_id', email };
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Registration failed',
      }));
    }
  };

  const signInWithGoogle = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // TODO: Implement Google Sign-In logic here
      const mockUser = {
        id: 'google-mock-id',
        email: 'google.user@example.com',
        displayName: 'Google User',
      };
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Google Sign-In failed',
        isLoading: false,
      }));
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await AsyncStorage.removeItem('user');
      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Logout failed',
        isLoading: false,
      }));
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