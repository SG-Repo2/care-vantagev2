import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    userId: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            userId: storedUserId,
            isLoading: false,
          }));
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: 'Failed to load auth state',
          isLoading: false,
        }));
      }
    };

    initializeAuth();
  }, []);

  const login = async (userId: string) => {
    try {
      await AsyncStorage.setItem('userId', userId);
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        userId,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to login',
      }));
      throw new Error('Failed to login');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userId');
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        userId: null,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to logout',
      }));
      throw new Error('Failed to logout');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
      }}
    >
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
